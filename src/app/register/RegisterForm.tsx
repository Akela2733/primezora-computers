"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

type RegisterFormProps = {
  nextPath: string;
};

function normalizeAuthError(message?: string | null): string {
  const fallback = "Something went wrong while creating your account. Please try again.";
  const trimmed = message?.trim();

  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();
  if (
    normalized.includes("request protection is temporarily unavailable") ||
    normalized.includes("authentication service is temporarily unavailable") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit")
  ) {
    return "We’re temporarily unable to create new accounts. Please try again in a moment.";
  }

  return trimmed;
}

function getPasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  for (const value of Object.values(checks)) {
    if (value) score += 1;
  }

  if (!password) return { score: 0, label: "Add a password", checks };
  if (score <= 2) return { score, label: "Weak", checks };
  if (score <= 4) return { score, label: "Good", checks };
  return { score, label: "Strong", checks };
}

export default function RegisterForm({ nextPath }: RegisterFormProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters long.");
      return;
    }

    if (strength.score < 4) {
      setError("Choose a stronger password with uppercase, lowercase, numbers, and a symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          next: nextPath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(normalizeAuthError(data?.error || "Registration failed. Please check your information."));
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl || "/account");
      router.refresh();
    } catch {
      setError("A network error occurred. Please check your connection and retry.");
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
          Create Your Account
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Join Primezora to track orders, manage addresses, and save favorites.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300" role="alert">
          <AlertCircle size={17} className="shrink-0 text-rose-400" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="customer-first-name" className="mb-1.5 block text-xs font-medium text-white/70">
              First Name
            </label>
            <input
              id="customer-first-name"
              type="text"
              name="firstName"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Kasun"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-white/20 transition focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label htmlFor="customer-last-name" className="mb-1.5 block text-xs font-medium text-white/70">
              Last Name
            </label>
            <input
              id="customer-last-name"
              type="text"
              name="lastName"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Perera"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-white/20 transition focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customer-email" className="mb-1.5 block text-xs font-medium text-white/70">
            Email Address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <Mail size={16} />
            </span>
            <input
              id="customer-email"
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
          <label htmlFor="customer-password" className="mb-1.5 block text-xs font-medium text-white/70">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <Lock size={16} />
            </span>
            <input
              id="customer-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/60">
              <span>Password strength</span>
              <span>{strength.label}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all ${
                  strength.score <= 2
                    ? "bg-rose-500"
                    : strength.score <= 4
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-white/55">
              <li>8-128 chars</li>
              <li>Uppercase</li>
              <li>Lowercase</li>
              <li>Number</li>
              <li>Symbol</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="customer-confirm-password" className="mb-1.5 block text-xs font-medium text-white/70">
            Confirm Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <Lock size={16} />
            </span>
            <input
              id="customer-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/20 transition focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          id="customer-register-submit"
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-white/[0.06] pt-6 text-center text-xs text-white/50">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-amber-400 transition hover:text-amber-300 hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
