import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Password Recovery | Primezora Technologies",
  description: "Password recovery for Primezora customer accounts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#070b12]/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <h1 className="text-2xl font-bold">Password recovery unavailable</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          We do not currently have an active email delivery service configured for customer password resets.
          To protect customer accounts, the reset flow is temporarily disabled until a verified mail provider is configured.
        </p>
        <p className="mt-4 text-sm leading-6 text-white/60">
          If you need help regaining access to your account, please contact our support team.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
          >
            Back to sign in
          </Link>
          <a
            href="mailto:support@primezora.com"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
