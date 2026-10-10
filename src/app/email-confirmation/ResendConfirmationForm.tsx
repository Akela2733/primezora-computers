"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, Mail } from "lucide-react";

type ResendConfirmationFormProps = {
  initialEmail: string;
  nextPath?: string;
  initialCooldownSeconds?: number;
};

export default function ResendConfirmationForm({
  initialEmail,
  nextPath = "/account",
  initialCooldownSeconds = 0,
}: ResendConfirmationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsSent, setMessageIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(
    Math.max(0, initialCooldownSeconds)
  );

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timeout = window.setTimeout(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageIsSent(false);
    setError(null);
    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} seconds before requesting another link.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/customer/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, next: nextPath }),
      });
      const data: { message?: string; error?: string; sent?: boolean } = await response.json();

      if (!response.ok) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        if (response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
          setCooldownSeconds(retryAfter);
        }
        setError(data.error || "We could not send the email. Please try again later.");
        return;
      }

      setMessage(
        data.message ||
          "Request received. If an unverified account matches this address, a verification link will be sent when delivery is available."
      );
      setMessageIsSent(data.sent === true);
    } catch {
      setError("A network error occurred. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 text-left">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="resend-confirmation-email"
          className="block text-xs font-medium text-white/70"
        >
          Confirmation email address
        </label>
        <div className="relative">
          <Mail
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            id="resend-confirmation-email"
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={254}
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage(null);
              setMessageIsSent(false);
              setError(null);
            }}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-3.5 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${
              messageIsSent
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-blue-500/30 bg-blue-500/10 text-blue-200"
            }`}
          >
            {messageIsSent ? (
              <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            ) : (
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-200"
          >
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || cooldownSeconds > 0}
          aria-busy={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending confirmation email...
            </>
          ) : cooldownSeconds > 0 ? (
            `Resend available in ${cooldownSeconds}s`
          ) : (
            "Resend verification email"
          )}
        </button>
      </form>
    </div>
  );
}
