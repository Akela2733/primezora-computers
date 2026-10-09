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
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type LoginFormProps = {
  nextPath?: string;
  loggedOut?: boolean;
  registered?: boolean;
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

  return trimmed;
}

export default function LoginForm({
  nextPath = "/account",
  loggedOut = false,
  registered = false,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl || nextPath || "/account");
      router.refresh();
    } catch {
      setError("A network error occurred. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#070b12]/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <ShieldCheck size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Sign In
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Access your orders, saved addresses, and profile details.
        </p>
      </div>

      {loggedOut && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-300">
          <CheckCircle2 size={17} className="shrink-0 text-blue-400" />
          <div className="flex-1 leading-relaxed">You have been logged out safely.</div>
        </div>
      )}

      {registered && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
          <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
          <div className="flex-1 leading-relaxed">Account created successfully. You can sign in now.</div>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle size={17} className="shrink-0 text-rose-400" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer-login-email" className="mb-1.5 block text-xs font-medium text-white/70">
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-white/20 transition focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="customer-login-password" className="text-xs font-medium text-white/70">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-amber-400 transition hover:text-amber-300 hover:underline"
            >
              Forgot password?
            </Link>
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/20 transition focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          id="customer-login-submit"
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-white/[0.06] pt-6 text-center text-xs text-white/50">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-amber-400 transition hover:text-amber-300 hover:underline"
        >
          Create One
        </Link>
      </div>
    </div>
  );
}
