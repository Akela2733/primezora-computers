"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";

export default function ResetPasswordForm({
  nextPath,
}: {
  nextPath: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Your new password must be between 8 and 128 characters.");
      return;
    }
    const tokenHash =
      new URLSearchParams(window.location.hash.slice(1)).get("token_hash") || "";
    if (!tokenHash) {
      setError("This password reset link is invalid or has expired. Request a new one to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenHash, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "We could not reset your password. Please try again.");
        return;
      }

      setIsComplete(true);
      setPassword("");
      setConfirmPassword("");
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    } catch {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="mt-8">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left text-xs text-emerald-300" role="status">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          <div className="leading-relaxed">Your password has been updated. You can now sign in with your new password.</div>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-600 hover:to-amber-600"
        >
          <span>Back to sign in</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-left text-xs text-rose-300" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="customer-new-password" className="mb-1.5 block text-left text-xs font-medium text-white/70">
            New password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <KeyRound size={16} />
            </span>
            <input
              id="customer-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-11 text-sm text-white/90 placeholder-white/20 transition focus:border-amber-600/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-600/50 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/90"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="customer-confirm-password" className="mb-1.5 block text-left text-xs font-medium text-white/70">
            Confirm new password
          </label>
          <input
            id="customer-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={isSubmitting}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter your new password again"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/90 placeholder-white/20 transition focus:border-amber-600/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-600/50 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-600 hover:to-amber-600 disabled:cursor-wait disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Update password</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
