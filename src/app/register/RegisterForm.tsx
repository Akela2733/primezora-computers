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
  AlertCircle,
  Loader2,
} from "lucide-react";
import CustomerAuthMascot, {
  type CustomerAuthMascotState,
} from "@/components/auth/CustomerAuthMascot";

type RegisterFormProps = {
  nextPath: string;
  initialEmail?: string;
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

export default function RegisterForm({
  nextPath,
  initialEmail = "",
}: RegisterFormProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] =
    useState<CustomerAuthMascotState>("welcome");

  const handleEmailFocus = () => {
    setMascotState(email.trim() ? "email-entered" : "email");
  };

  const handlePasswordFocus = () => {
    setMascotState("password");
  };

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

      const data: {
        error?: string;
        redirectUrl?: string;
        requiresSignIn?: boolean;
        verificationPending?: boolean;
      } = await res.json();

      if (!res.ok) {
        if (data.verificationPending && data.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }
        setError(normalizeAuthError(data?.error || "Registration failed. Please check your information."));
        setMascotState("error");
        setLoading(false);
        return;
      }

      setMascotState("success");
      const fallbackPath = data.requiresSignIn
        ? `/login?registered=true&next=${encodeURIComponent(nextPath)}`
        : nextPath;
      router.push(data.redirectUrl || fallbackPath);
      router.refresh();
    } catch {
      setError("A network error occurred. Please check your connection and retry.");
      setLoading(false);
    }
  };

  return (
    <div data-auth-card className="mx-auto w-full max-w-[520px] rounded-[28px] border border-[#ff7a1d]/80 bg-[#0d0d0d]/95 p-3 pb-6 shadow-[0_0_0_1px_rgba(255,122,29,0.15),0_25px_60px_rgba(0,0,0,0.52)] backdrop-blur-xl sm:p-4 sm:pb-6">
      <div data-auth-mascot className="mb-2 flex justify-center">
        <CustomerAuthMascot
          flow="register"
          state={error ? "error" : mascotState}
          loading={loading}
        />
      </div>

      <div data-auth-title className="mb-3 text-center">
        <h1 className="font-display text-2xl font-black tracking-[-0.06em] text-white">
          Create Your Account
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Join PrimeZora and manage your orders, builds, and saved favorites.
        </p>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300" role="alert" aria-live="assertive">
          <AlertCircle size={17} className="shrink-0 text-rose-400" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <form data-auth-form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="customer-first-name" className="mb-1 block text-xs font-medium text-white/70">
              First Name
            </label>
            <input
              id="customer-first-name"
              type="text"
              name="firstName"
              autoComplete="given-name"
              maxLength={50}
              required
              value={firstName}
              onFocus={() => setMascotState("name")}
              onBlur={() => setMascotState("welcome")}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError(null);
              }}
              placeholder="First name"
              className="w-full rounded-xl border border-[#ff7a1d]/40 bg-[#090909] px-3.5 py-2 text-sm text-white/90 placeholder-white/30 transition focus:border-[#ff8a3d] focus:bg-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d]/60"
            />
          </div>
          <div>
            <label htmlFor="customer-last-name" className="mb-1 block text-xs font-medium text-white/70">
              Last Name
            </label>
            <input
              id="customer-last-name"
              type="text"
              name="lastName"
              autoComplete="family-name"
              maxLength={50}
              required
              value={lastName}
              onFocus={() => setMascotState("name")}
              onBlur={() => setMascotState("welcome")}
              onChange={(e) => {
                setLastName(e.target.value);
                setError(null);
              }}
              placeholder="Last name"
              className="w-full rounded-xl border border-[#ff7a1d]/40 bg-[#090909] px-3.5 py-2 text-sm text-white/90 placeholder-white/30 transition focus:border-[#ff8a3d] focus:bg-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d]/60"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customer-email" className="mb-1 block text-xs font-medium text-white/70">
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
          <label htmlFor="customer-password" className="mb-1 block text-xs font-medium text-white/70">
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
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/90"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-1.5" aria-live="polite">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/60">
              <span>Password strength (optional tips)</span>
              <span>{strength.label}</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"
              role="meter"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={strength.score}
              aria-valuetext={strength.label}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  strength.score <= 2
                    ? "bg-rose-500"
                    : strength.score <= 4
                      ? "bg-amber-600"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] leading-tight text-white/50">
              Use at least 8 characters. A longer passphrase is easier to remember; mixing character types makes it harder to guess.
            </p>
            <ul className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 text-[10px] leading-tight text-white/55" aria-label="Optional password tips">
              <li className={strength.checks.length ? "text-emerald-300" : ""}>8-128 characters</li>
              <li className={strength.checks.uppercase ? "text-emerald-300" : ""}>Uppercase letter</li>
              <li className={strength.checks.lowercase ? "text-emerald-300" : ""}>Lowercase letter</li>
              <li className={strength.checks.number ? "text-emerald-300" : ""}>Number</li>
              <li className={strength.checks.symbol ? "text-emerald-300" : ""}>Symbol</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="customer-confirm-password" className="mb-1 block text-xs font-medium text-white/70">
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
              onFocus={() => setMascotState("confirm-password")}
              onBlur={() => setMascotState("welcome")}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-[#ff7a1d]/40 bg-[#090909] py-2 pl-11 pr-10 text-sm text-white/90 placeholder-white/30 transition focus:border-[#ff8a3d] focus:bg-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d]/60"
            />
            <button
              type="button"
              disabled={loading}
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/90"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          id="customer-register-submit"
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7417] to-[#ff9b37] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#17100a] shadow-[0_10px_28px_rgba(255,116,23,0.18)] transition duration-200 hover:-translate-y-0.5 hover:from-[#ff8730] hover:to-[#ffad54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Sign Up</span>
            </>
          )}
        </button>
      </form>

      <div data-auth-footer className="mt-3 mb-1 pb-3 text-center text-sm text-white/55">
        Already have an account? {" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-[#ff8a3d] hover:text-[#ffad54]"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
