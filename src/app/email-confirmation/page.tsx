import type { Metadata } from "next";
import Link from "next/link";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import ResendConfirmationForm from "./ResendConfirmationForm";

export const metadata: Metadata = {
  title: "Confirm your email | Primezora Technologies",
  description: "Confirm your Primezora customer account email address.",
  robots: {
    index: false,
    follow: false,
  },
};

type EmailConfirmationPageProps = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default async function EmailConfirmationPage({
  searchParams,
}: EmailConfirmationPageProps) {
  const params = await searchParams;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeCustomerRedirectPath(rawNext);
  const email = rawEmail || "your email address";

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#05090f] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#070b12]/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-2xl text-amber-400">
          ✉️
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          We have sent a confirmation email to <span className="font-medium text-white">{email}</span>.
          Click the verification link in that email to activate your Primezora account.
        </p>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-left text-xs leading-6 text-amber-100">
          <p className="font-medium text-amber-200">Before you sign in:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-50/80">
            <li>Open the email from Primezora</li>
            <li>Click the confirmation link</li>
            <li>Return here to continue to your account</li>
          </ul>
        </div>

        <ResendConfirmationForm initialEmail={rawEmail || ""} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-500/40 hover:text-amber-300"
          >
            Back to sign in
          </Link>
          <a
            href="mailto:support@primezora.com?subject=Resend%20Primezora%20Account%20Verification"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-amber-500"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
