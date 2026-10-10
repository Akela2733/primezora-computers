"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import ResendConfirmationForm from "@/app/email-confirmation/ResendConfirmationForm";

type VerifyEmailClientProps = {
  email: string;
  nextPath: string;
  token: string;
  deliveryFailed: boolean;
  cooldownSeconds: number;
};

type VerificationResult = {
  status?: string;
  message?: string;
};

export default function VerifyEmailClient({
  email,
  nextPath,
  token: initialToken,
  deliveryFailed,
  cooldownSeconds,
}: VerifyEmailClientProps) {
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    deliveryFailed
      ? "We couldn't send the verification email. Check your email address and try again."
      : null
  );
  const [loading, setLoading] = useState(false);
  const loginUrl = `/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`;
  const changeEmailUrl = `/register?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`;

  async function verifyEmail() {
    setLoading(true);
    setMessage(null);
    const currentUrl = new URL(window.location.href);
    const token =
      initialToken ||
      new URLSearchParams(currentUrl.hash.slice(1)).get("token") ||
      "";
    if (!token) {
      setVerificationStatus("missing");
      setMessage("Verification link is missing. Request a new link to continue.");
      setLoading(false);
      return;
    }

    if (currentUrl.hash || currentUrl.searchParams.has("token")) {
      currentUrl.hash = "";
      currentUrl.searchParams.delete("token");
      window.history.replaceState(
        null,
        "",
        `${currentUrl.pathname}${currentUrl.search}`
      );
    }

    try {
      const response = await fetch("/api/auth/customer/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as VerificationResult;
      setVerificationStatus(result.status ?? "invalid");
      setMessage(result.message ?? "We could not verify this link.");
    } catch {
      setVerificationStatus("failure");
      setMessage("A network error occurred. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  const verified = verificationStatus === "verified" || verificationStatus === "already_verified";
  const alreadyUsed = verificationStatus === "already_used";
  const showResend = !verified && !alreadyUsed;

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
      <section
        aria-labelledby="verify-email-heading"
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#070b12]/90 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:p-8"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          {verified ? <CheckCircle2 size={27} aria-hidden="true" /> : <ShieldCheck size={27} aria-hidden="true" />}
        </div>
        <h1 id="verify-email-heading" className="text-2xl font-bold tracking-tight text-white">
          {verified ? "Email verified" : "Verify your email"}
        </h1>

        {verificationStatus === null && (
          <>
            <p className="mt-4 text-sm leading-6 text-white/70">
              If you received a verification message at <span className="font-medium text-white">{email || "your email address"}</span>, open its link and confirm below. You will sign in separately after verification.
            </p>
            <button
              type="button"
              onClick={verifyEmail}
              disabled={loading}
              aria-busy={loading}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify email address"}
            </button>
          </>
        )}

        {deliveryFailed && verificationStatus === null && message && (
          <div role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-left text-sm leading-6 text-rose-200">
            {message}
          </div>
        )}

        {verified && (
          <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-emerald-200">
            {message}
          </p>
        )}

        {alreadyUsed && (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-left text-sm leading-6 text-blue-100">
            {message}
          </div>
        )}

        {verificationStatus && verificationStatus !== "missing" && !verified && !alreadyUsed && message && (
          <div role="alert" aria-live="assertive" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-left text-sm leading-6 text-rose-200">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {showResend && (
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left">
            <p className="text-sm font-medium text-white">Need a new verification link?</p>
            <ResendConfirmationForm
              initialEmail={email}
              nextPath={nextPath}
              initialCooldownSeconds={cooldownSeconds}
            />
          </div>
        )}

        {verificationStatus === null && !deliveryFailed && (
          <p className="mt-5 text-xs leading-5 text-white/50">
            The link expires after 24 hours and can only be used once. Check your spam folder if you do not see the message.
          </p>
        )}

        <nav aria-label="Account verification actions" className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={loginUrl}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
          >
            {verified || alreadyUsed ? "Continue to sign in" : "Return to sign in"}
          </Link>
          <Link
            href={changeEmailUrl}
            className="rounded-xl border border-amber-500/30 px-4 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-500/10"
          >
            Change email
          </Link>
        </nav>
      </section>
    </main>
  );
}
