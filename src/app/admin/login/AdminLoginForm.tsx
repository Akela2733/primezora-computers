"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

type AuthTab = "login" | "forgot";

type AdminLoginFormProps = {
  nextPath?: string;
  loggedOut?: boolean;
  initialTab?: AuthTab;
};

function normalizeAuthError(message?: string | null): string {
  const fallback = "Unable to sign in to the admin portal. Please try again.";
  const trimmed = message?.trim();

  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();
  if (
    normalized.includes("request protection is temporarily unavailable") ||
    normalized.includes("admin login is temporarily unavailable") ||
    normalized.includes("authentication is temporarily unavailable") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit")
  ) {
    return "The admin portal is temporarily unavailable. Please try again in a moment.";
  }

  return trimmed;
}

export default function AdminLoginForm({
  nextPath = "/admin",
  loggedOut = false,
  initialTab = "login",
}: AdminLoginFormProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [wasLoggedOut, setWasLoggedOut] = useState(loggedOut);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setErrorMessage("");
    setSuccessMessage("");
    setWasLoggedOut(false);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setWasLoggedOut(false);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your admin email address.");
      return;
    }

    if (!loginPassword) {
      setErrorMessage("Please enter your admin password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: loginPassword,
          next: nextPath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(normalizeAuthError(data?.error || "Invalid email or password."));
        setIsSubmitting(false);
        return;
      }

      const destination = data.redirectTo || nextPath || "/admin";
      window.location.href = destination;
    } catch {
      setErrorMessage("Unable to sign in. Please verify your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-orange-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-blue-500/[0.03] rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-orange-400 transition"
          >
            <ArrowLeft size={12} />
            <span>Return to Storefront</span>
          </Link>
        </div>

        <div className="border border-white/[0.08] bg-[#070b12]/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

          <div className="grid grid-cols-2 gap-1 bg-[#05080e] p-1 border border-white/[0.06] mb-8">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[9px] font-bold uppercase tracking-[0.15em] transition ${
                tab === "login"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm"
                  : "text-white/40 hover:text-white/80 border border-transparent"
              }`}
            >
              <ShieldCheck size={13} className="shrink-0" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("forgot")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[9px] font-bold uppercase tracking-[0.15em] transition ${
                tab === "forgot"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm"
                  : "text-white/40 hover:text-white/80 border border-transparent"
              }`}
            >
              <KeyRound size={13} className="shrink-0" />
              <span>Recovery</span>
            </button>
          </div>

          <div className="text-center mb-6">
            {tab === "login" && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-4">
                  <ShieldCheck size={24} />
                </div>
                <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
                  Security Clearance
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  Admin Sign In
                </h1>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Enter your credentials to access the Primezora administration system.
                </p>
              </>
            )}

            {tab === "forgot" && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-4">
                  <KeyRound size={24} />
                </div>
                <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
                  Credential Recovery
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  Account Recovery
                </h1>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Administrator credentials are managed through deployment configuration.
                </p>
              </>
            )}
          </div>

          {wasLoggedOut && (
            <div className="mb-6 flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-5">
                You have been successfully signed out of the admin portal.
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 border border-red-500/30 bg-red-500/[0.08] p-3 text-red-300"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
              <p className="text-xs leading-5">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <p className="text-xs leading-5">{successMessage}</p>
            </div>
          )}

          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block font-display text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                    <Mail size={15} />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    disabled={isSubmitting}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@primezora.com"
                    className="w-full h-11 pl-10 pr-4 bg-[#0a0f18] border border-white/[0.09] text-xs text-white placeholder-white/20 outline-none transition focus:border-orange-500/60 focus:bg-[#0c131f] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="admin-password"
                    className="block font-display text-[9px] uppercase tracking-[0.2em] text-white/60"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab("forgot")}
                    className="text-[9px] font-bold uppercase tracking-[0.15em] text-orange-400 hover:text-orange-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                    <Lock size={15} />
                  </div>
                  <input
                    id="admin-password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-[#0a0f18] border border-white/[0.09] text-xs text-white placeholder-white/20 outline-none transition focus:border-orange-500/60 focus:bg-[#0c131f] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition"
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 hover:bg-orange-400 text-black font-display text-[10px] font-bold uppercase tracking-[0.2em] transition shadow-lg shadow-orange-500/20 disabled:cursor-wait disabled:opacity-60 mt-2"
              >
                <span>{isSubmitting ? "Verifying Credentials..." : "Authenticate"}</span>
                <ArrowRight size={14} className={isSubmitting ? "animate-pulse" : ""} />
              </button>
            </form>
          )}

          {tab === "forgot" && (
            <div className="space-y-6">
              <p className="text-xs leading-6 text-white/60">
                For security, password changes are handled by an authorized deployment
                operator through the deployment configuration. Contact your administrator
                to rotate the configured credentials.
              </p>
              <button
                type="button"
                onClick={() => switchTab("login")}
                className="w-full h-12 flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 hover:bg-orange-400 text-black font-display text-[10px] font-bold uppercase tracking-[0.2em] transition shadow-lg shadow-orange-500/20"
              >
                <span>Return to Sign In</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div className="mt-8 border-t border-white/[0.06] pt-5 text-center">
            <p className="text-[10px] leading-4 text-white/30">
              Restricted portal. All authentication events and IP addresses are monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
