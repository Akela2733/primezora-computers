import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Email confirmed | Primezora Technologies",
  description: "Your Primezora account email address has been confirmed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmailConfirmedPage() {
  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-[#070b12]/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-2xl text-emerald-400">
          ✓
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">Email confirmed</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          Your Primezora account is now verified. You can continue to sign in and manage your orders securely.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500"
          >
            Sign in now
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
