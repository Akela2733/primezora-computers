import "server-only";

import { cookies } from "next/headers";
import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
  type User,
} from "@supabase/supabase-js";

export type SupabaseAuthConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  isConfigured: boolean;
};

/**
 * Reads the public Auth configuration and the server-only admin key separately.
 */
export function getSupabaseAuthConfig(): SupabaseAuthConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const cleanUrl = url.trim().replace(/\/+$/, "");
  const cleanKey = anonKey.trim();

  return {
    url: cleanUrl,
    anonKey: cleanKey,
    serviceRoleKey: serviceRoleKey.trim(),
    isConfigured: Boolean(cleanUrl && cleanKey),
  };
}

let authClientInstance: SupabaseClient | null = null;
let supabaseAdminClientInstance: SupabaseClient | null = null;
const CUSTOMER_OAUTH_STORAGE_KEY = "primezora-customer-oauth";
const CUSTOMER_OAUTH_VERIFIER_MAX_AGE_SECONDS = 15 * 60;

async function getCustomerOAuthClient(): Promise<SupabaseClient> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Supabase Auth is not fully configured. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();
  const memoryStorage = new Map<string, string>();
  const cookieNameForKey = (key: string) => key;
  const isVerifierKey = (key: string) =>
    key.startsWith(`${CUSTOMER_OAUTH_STORAGE_KEY}-`) &&
    key.endsWith("-code-verifier");

  const storage: SupportedStorage = {
    getItem: async (key) => {
      if (!isVerifierKey(key)) return memoryStorage.get(key) ?? null;
      return cookieStore.get(cookieNameForKey(key))?.value ?? null;
    },
    setItem: async (key, value) => {
      if (!isVerifierKey(key)) {
        memoryStorage.set(key, value);
        return;
      }

      cookieStore.set(cookieNameForKey(key), value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CUSTOMER_OAUTH_VERIFIER_MAX_AGE_SECONDS,
      });
    },
    removeItem: async (key) => {
      if (!isVerifierKey(key)) {
        memoryStorage.delete(key);
        return;
      }

      cookieStore.set(cookieNameForKey(key), "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    },
  };

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      flowType: "pkce",
      storageKey: CUSTOMER_OAUTH_STORAGE_KEY,
      storage,
      experimental: { appendPkceFlowIdToRedirects: true },
    },
  });
}

/**
 * Returns a server-side Supabase client dedicated to Auth operations.
 */
export function getSupabaseAuthClient(): SupabaseClient {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Supabase Auth is not fully configured. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!authClientInstance) {
    authClientInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return authClientInstance;
}

function getSupabaseAdminClient(): SupabaseClient {
  const config = getSupabaseAuthConfig();
  if (!config.url || !config.serviceRoleKey) {
    throw new Error(
      "Supabase customer registration requires SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!supabaseAdminClientInstance) {
    supabaseAdminClientInstance = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClientInstance;
}

export type SignUpResult = {
  success: boolean;
  user?: User;
  session?: unknown;
  error?: string;
  requiresEmailConfirmation?: boolean;
  emailMayExist?: boolean;
};

export type SignInResult = {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

/**
 * Creates a customer account without depending on Supabase confirmation email delivery.
 */
export async function supabaseSignUp(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<SignUpResult> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      email_confirm: true,
      user_metadata: {
        firstName: params.firstName.trim(),
        lastName: params.lastName.trim(),
        fullName: `${params.firstName.trim()} ${params.lastName.trim()}`.trim(),
      },
    });

    if (error) {
      // Map Supabase errors to friendly messages without revealing system internals
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("unique constraint") ||
        error.status === 422
      ) {
        return {
          success: false,
          emailMayExist: true,
        };
      }
      return {
        success: false,
        error: error.message || "Failed to create account. Please check your details.",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Unable to complete registration. Please try again.",
      };
    }

    return {
      success: true,
      user: data.user,
      requiresEmailConfirmation: false,
    };
  } catch (err) {
    console.error("Supabase signUp exception:", err);
    return {
      success: false,
      error: "Unable to process registration at this time. Please try again.",
    };
  }
}

/**
 * Authenticates a customer using email and password via Supabase Auth.
 */
export async function supabaseSignIn(params: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email.trim().toLowerCase(),
      password: params.password,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid credentials") ||
        error.status === 400
      ) {
        return {
          success: false,
          error: "Invalid email or password. Please try again.",
        };
      }

      if (error.message.toLowerCase().includes("email not confirmed")) {
        return {
          success: false,
          error: "This older account still requires email verification. Please contact support for help accessing it.",
        };
      }

      return {
        success: false,
        error: "Unable to sign in. Please verify your credentials.",
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: "Invalid credentials.",
      };
    }

    return {
      success: true,
      user: data.user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (err) {
    console.error("Supabase signIn exception:", err);
    return {
      success: false,
      error: "Unable to sign in at this time. Please try again.",
    };
  }
}

/**
 * Signs out a customer from Supabase Auth if an access token is provided.
 */
export type SocialProvider = "google" | "facebook";

export async function supabaseSignInWithProvider(params: {
  provider: SocialProvider;
  redirectTo: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const supabase = await getCustomerOAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: params.provider,
      options: {
        redirectTo: params.redirectTo,
        queryParams:
          params.provider === "google"
            ? {
                access_type: "offline",
                prompt: "consent",
              }
            : undefined,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Social authentication could not be started.",
      };
    }

    return {
      success: true,
      url: data?.url,
    };
  } catch (err) {
    console.error("Supabase social sign-in exception:", err);
    return {
      success: false,
      error: "Unable to start social sign-in at this time.",
    };
  }
}

export async function supabaseExchangeCodeForSession(
  code: string,
  flowId?: string
): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const supabase = await getCustomerOAuthClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );
    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || "The provider callback could not be completed.",
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err) {
    console.error("Supabase oauth exchange exception:", err);
    return {
      success: false,
      error: "The provider callback could not be completed.",
    };
  }
}

export async function supabaseSignOut(accessToken?: string): Promise<void> {
  const config = getSupabaseAuthConfig();
  if (!config.isConfigured || !accessToken) return;

  try {
    const supabase = getSupabaseAuthClient();
    await supabase.auth.admin.signOut(accessToken).catch(() => null);
  } catch {
    // Non-blocking logout cleanup
  }
}
