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
  UserPlus,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

type AuthTab = "login" | "register" | "forgot";

type AdminLoginFormProps = {
  nextPath?: string;
  loggedOut?: boolean;
  initialTab?: AuthTab;
};

export default function AdminLoginForm({
  nextPath = "/admin",
  loggedOut = false,
  initialTab = "login",
}: AdminLoginFormProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);

  // Common feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [wasLoggedOut, setWasLoggedOut] = useState(loggedOut);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<{
    email: string;
    passwordHash: string;
  } | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setErrorMessage("");
    setSuccessMessage("");
    setWasLoggedOut(false);
  };

  // ---------------------------------------------------------------------------
  // 1. Handle Login
  // ---------------------------------------------------------------------------
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
        setErrorMessage(data.error || "Invalid email or password.");
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

  // ---------------------------------------------------------------------------
  // 2. Handle Register
  // ---------------------------------------------------------------------------
  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = regEmail.trim();
    if (!trimmedEmail) {
      setErrorMessage("Administrator email is required.");
      return;
    }

    if (regPassword.length < 12) {
      setErrorMessage("Admin password must be at least 12 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: regPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to generate administrator credentials.");
        setIsSubmitting(false);
        return;
      }

      setRegisteredResult({
        email: data.email || trimmedEmail,
        passwordHash: data.passwordHash,
      });
      setSuccessMessage("Administrator credentials generated successfully!");
    } catch {
      setErrorMessage("Registration request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-12">
      {/* Background ambient decorative glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-orange-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-blue-500/[0.03] rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-lg">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-orange-400 transition"
          >
            <ArrowLeft size={12} />
            <span>Return to Storefront</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="border border-white/[0.08] bg-[#070b12]/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#05080e] p-1 border border-white/[0.06] mb-8">
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
              onClick={() => switchTab("register")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[9px] font-bold uppercase tracking-[0.15em] transition ${
                tab === "register"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm"
                  : "text-white/40 hover:text-white/80 border border-transparent"
              }`}
            >
              <UserPlus size={13} className="shrink-0" />
              <span>Register</span>
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

          {/* Header Area */}
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

            {tab === "register" && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-4">
                  <UserPlus size={24} />
                </div>
                <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
                  Credential Generation
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  Register Administrator
                </h1>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Generate secure scrypt-hashed credentials to configure administrator access.
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

          {/* Notification: Signed Out */}
          {wasLoggedOut && (
            <div className="mb-6 flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-5">
                You have been successfully signed out of the admin portal.
              </p>
            </div>
          )}

          {/* Notification: Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 border border-red-500/30 bg-red-500/[0.08] p-3 text-red-300"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
              <p className="text-xs leading-5">{errorMessage}</p>
            </div>
          )}

          {/* Notification: Success */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <p className="text-xs leading-5">{successMessage}</p>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: LOGIN                                                    */}
          {/* =============================================================== */}
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

              <div className="pt-4 border-t border-white/[0.06] text-center">
                <p className="text-[10px] text-white/40">
                  Need to configure an administrator account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (loginEmail) setRegEmail(loginEmail);
                      switchTab("register");
                    }}
                    className="font-bold text-orange-400 hover:underline inline-flex items-center gap-1 ml-1"
                  >
                    <span>Register Admin</span>
                    <ArrowRight size={10} />
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* =============================================================== */}
          {/* TAB 2: REGISTER                                                 */}
          {/* =============================================================== */}
          {tab === "register" && (
            <div className="space-y-6">
              {registeredResult ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border border-emerald-500/30 bg-emerald-500/[0.05] p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                      <CheckCircle2 size={16} />
                      <span>Administrator Credentials Generated</span>
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed">
                      Copy the environment configuration block below and paste it into your{" "}
                      <code className="text-orange-300 bg-black/40 px-1 py-0.5 rounded">.env.local</code>{" "}
                      file or cloud deployment environment variables.
                    </p>
                    <div className="relative bg-[#05080e] p-3 border border-white/10 rounded-sm font-mono text-[11px] text-white/80 overflow-x-auto select-all">
                      <div>ADMIN_EMAIL=&quot;{registeredResult.email}&quot;</div>
                      <div className="break-all mt-1">ADMIN_PASSWORD_HASH=&quot;{registeredResult.passwordHash}&quot;</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `ADMIN_EMAIL="${registeredResult.email}"\nADMIN_PASSWORD_HASH="${registeredResult.passwordHash}"`,
                        )
                      }
                      className="w-full py-2.5 px-3 flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-display text-[9px] uppercase tracking-[0.2em] transition"
                    >
                      {copiedConfig ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Configuration</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail(registeredResult.email);
                        setLoginPassword(regPassword);
                        switchTab("login");
                      }}
                      className="flex-1 h-11 flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 hover:bg-orange-400 text-black font-display text-[10px] font-bold uppercase tracking-[0.2em] transition"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisteredResult(null);
                        setRegPassword("");
                        setRegConfirmPassword("");
                      }}
                      className="h-11 px-4 flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 font-display text-[9px] uppercase tracking-[0.2em] transition"
                    >
                      <RotateCcw size={13} />
                      <span>Register Another</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block font-display text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2"
                    >
                      Administrator Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Mail size={15} />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="admin@primezora.com"
                        className="w-full h-11 pl-10 pr-4 bg-[#0a0f18] border border-white/[0.09] text-xs text-white placeholder-white/20 outline-none transition focus:border-orange-500/60 focus:bg-[#0c131f] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block font-display text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2"
                    >
                      Admin Password (min. 12 characters)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Lock size={15} />
                      </div>
                      <input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={12}
                        disabled={isSubmitting}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 12 characters"
                        className="w-full h-11 pl-10 pr-10 bg-[#0a0f18] border border-white/[0.09] text-xs text-white placeholder-white/20 outline-none transition focus:border-orange-500/60 focus:bg-[#0c131f] disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition"
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/30">
                      <span>Length: {regPassword.length} / 12 characters</span>
                      {regPassword.length >= 12 && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check size={12} /> Valid Length
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block font-display text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Lock size={15} />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type={showRegPassword ? "text" : "password"}
                        required
                        disabled={isSubmitting}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat admin password"
                        className="w-full h-11 pl-10 pr-4 bg-[#0a0f18] border border-white/[0.09] text-xs text-white placeholder-white/20 outline-none transition focus:border-orange-500/60 focus:bg-[#0c131f] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 hover:bg-orange-400 text-black font-display text-[10px] font-bold uppercase tracking-[0.2em] transition shadow-lg shadow-orange-500/20 disabled:cursor-wait disabled:opacity-60 mt-2"
                  >
                    <span>{isSubmitting ? "Generating Hash..." : "Create Admin Credentials"}</span>
                    <ArrowRight size={14} className={isSubmitting ? "animate-pulse" : ""} />
                  </button>

                  <div className="pt-4 border-t border-white/[0.06] text-center">
                    <p className="text-[10px] text-white/40">
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("login")}
                        className="font-bold text-orange-400 hover:underline inline-flex items-center gap-1 ml-1"
                      >
                        <span>Return to Sign In</span>
                        <ArrowRight size={10} />
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: ACCOUNT RECOVERY                                        */}
          {/* =============================================================== */}
          {tab === "forgot" && (
            <div className="space-y-6">
              <p className="text-xs leading-6 text-white/60">
                For security, password changes are handled by an authorized
                deployment operator through the deployment configuration.
                Contact your administrator to rotate the configured credentials.
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

          {/* Security Notice */}
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
