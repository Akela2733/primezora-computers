"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

export default function ForgotPasswordForm({
  nextPath,
}: {
  nextPath: string;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: nextPath }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "We could not process your request. Please try again.");
        return;
      }

      setMessage(data.message);
    } catch {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left text-xs text-emerald-300" role="status">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          <div className="leading-relaxed">{message} Check your inbox and spam folder.</div>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-left text-xs text-rose-300" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label
          htmlFor="customer-forgot-email"
          className="mb-1.5 block text-left text-xs font-medium text-white/70"
        >
          Email Address
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            <Mail size={16} />
          </span>
          <input
            id="customer-forgot-email"
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white/90 placeholder-white/20 transition focus:border-amber-600/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-amber-600/50 disabled:opacity-50"
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
              <span>Sending reset link...</span>
            </>
          ) : (
            <>
              <span>Send reset link</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
