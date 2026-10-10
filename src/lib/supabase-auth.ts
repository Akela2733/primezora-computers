import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

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
      requiresEmailConfirmation: true,
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
