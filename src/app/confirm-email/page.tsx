import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyCustomerEmailConfirmation } from "@/lib/email-confirmation";

export const metadata: Metadata = {
  title: "Confirm your email | Primezora Technologies",
  description: "Verify your Primezora account email address.",
  robots: {
    index: false,
    follow: false,
  },
};

type ConfirmEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const params = await searchParams;
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;

  if (!rawToken) {
    return (
      <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/20 bg-[#070b12]/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <h1 className="text-2xl font-bold text-white">Verification link missing</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">
            We could not verify your email because the confirmation link is missing or incomplete.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const verified = await verifyCustomerEmailConfirmation(rawToken);
  if (verified) {
    redirect("/email-confirmed");
  }

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-rose-500/20 bg-[#070b12]/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-2xl text-rose-400">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-white">This link is no longer valid</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          Your confirmation link may have expired or already been used. Please request a fresh confirmation email to continue.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
          >
            Register again
          </Link>
          <a
            href="mailto:support@primezora.com?subject=Primezora%20Account%20Verification%20Help"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
