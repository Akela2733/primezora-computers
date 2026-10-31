"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import CustomerAuthMascot, {
  type CustomerAuthMascotState,
} from "@/components/auth/CustomerAuthMascot";

type LoginFormProps = {
  nextPath?: string;
  initialEmail?: string;
  loggedOut?: boolean;
  registered?: boolean;
  authError?: string | null;
};

function normalizeAuthError(message?: string | null): string {
  const fallback = "Something went wrong while signing you in. Please try again.";
  const trimmed = message?.trim();

  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();
  if (
    normalized.includes("request protection is temporarily unavailable") ||
    normalized.includes("authentication service is temporarily unavailable") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit")
  ) {
    return "We’re temporarily unable to verify sign-ins. Please try again in a moment.";
  }

  if (normalized === "account-link-required") {
    return "This email is already linked to another account. Please sign in with your password and confirm the account before connecting Google or Facebook.";
  }

  if (normalized === "oauth-callback-failed") {
    return "Google or Facebook sign-in could not be completed. Please try again.";
  }

  if (normalized === "oauth-flow-already-used") {
    return "This Google or Facebook sign-in attempt has already been used. Start a new sign-in attempt and do not reload the provider page.";
  }

  if (normalized === "missing-email") {
    return "Your sign-in provider did not return an email address. Please sign in with your email and password and complete your profile, or try again with an account that includes an email.";
  }

  return trimmed;
}

export default function LoginForm({
  nextPath = "/account",
  initialEmail = "",
  loggedOut = false,
  registered = false,
  authError = null,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(authError ? normalizeAuthError(authError) : null);
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] =
    useState<CustomerAuthMascotState>("welcome");

  const handleEmailFocus = () => {
    setMascotState(email.trim() ? "email-entered" : "email");
  };

  const handlePasswordFocus = () => {
    setMascotState("password");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          next: nextPath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(normalizeAuthError(data?.error || "Invalid email or password."));
        setMascotState("error");
        setLoading(false);
        return;
      }

      setMascotState("success");
      router.push(data.redirectUrl || nextPath || "/account");
      router.refresh();
    } catch {
      setError("A network error occurred. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div data-auth-card data-login-card className="mx-auto max-h-full w-full max-w-[520px] rounded-[28px] border border-[#ff7a1d]/80 bg-[#0d0d0d]/95 p-3 pb-6 shadow-[0_0_0_1px_rgba(255,122,29,0.15),0_25px_60px_rgba(0,0,0,0.52)] backdrop-blur-xl sm:p-4 sm:pb-6">
      <div data-auth-mascot data-login-mascot className="mb-2 flex justify-center">
        <CustomerAuthMascot
          flow="login"
          state={error ? "error" : mascotState}
          loading={loading}
        />
      </div>

      <div data-auth-title data-login-title className="mb-3 text-center">
        <h1 className="font-display text-2xl font-black tracking-[-0.06em] text-white">
          Sign In
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Welcome back! Please sign in to your PrimeZora account.
        </p>
      </div>

      {loggedOut && (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-600/10 p-3 text-xs text-amber-600">
          <CheckCircle2 size={17} className="shrink-0 text-amber-600" />
          <div className="flex-1 leading-relaxed">You have been logged out safely.</div>
        </div>
      )}

      {registered && (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-600/10 p-3 text-xs text-amber-600">
          <CheckCircle2 size={17} className="shrink-0 text-amber-600" />
          <div className="flex-1 leading-relaxed">
            Your account is ready. Sign in below or{" "}
            <a
              href="mailto:primezorasolution@gmail.com"
              className="font-medium underline underline-offset-2 hover:text-emerald-200"
            >
              contact support
            </a>
            .
          </div>
        </div>
      )}

      {error && (
        <div role="alert" aria-live="assertive" className="mb-3 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={17} className="shrink-0 text-rose-400" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <form data-auth-form data-login-form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label htmlFor="customer-login-email" className="mb-1 block text-xs font-medium text-white/70">
            Email Address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <Mail size={16} />
            </span>
            <input
              id="customer-login-email"
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email}
              onFocus={handleEmailFocus}
              onBlur={() => setMascotState("welcome")}
              onChange={(e) => {
                setEmail(e.target.value);
                setMascotState(e.target.value.trim() ? "email-entered" : "email");
                setError(null);
              }}
              placeholder="Email address"
              className="w-full rounded-xl border border-[#ff7a1d]/40 bg-[#090909] py-2 pl-11 pr-3.5 text-sm text-white/90 placeholder-white/30 transition focus:border-[#ff8a3d] focus:bg-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d]/60"
            />
          </div>
        </div>

        <div>
          <div className="mb-1">
            <label htmlFor="customer-login-password" className="text-xs font-medium text-white/70">
              Password
            </label>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <Lock size={16} />
            </span>
            <input
              id="customer-login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onFocus={handlePasswordFocus}
              onBlur={() => setMascotState("welcome")}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Password"
              className="w-full rounded-xl border border-[#ff7a1d]/40 bg-[#090909] py-2 pl-11 pr-10 text-sm text-white/90 placeholder-white/30 transition focus:border-[#ff8a3d] focus:bg-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d]/60"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/90"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#ff7a1d]" />
            <span>Remember me</span>
          </label>
          <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`} className="font-medium text-[#ff8a3d] hover:text-[#ffad54]">
            Forgot password?
          </Link>
        </div>

        <button
          id="customer-login-submit"
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7417] to-[#ff9b37] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#17100a] shadow-[0_10px_28px_rgba(255,116,23,0.18)] transition duration-200 hover:-translate-y-0.5 hover:from-[#ff8730] hover:to-[#ffad54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div data-auth-footer className="mt-3 mb-1 pb-3 text-center text-sm text-white/55">
        Don&apos;t have an account? {" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-[#ff8a3d] hover:text-[#ffad54]"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
