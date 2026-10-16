import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | Primezora Technologies",
  description: "Request a password reset for your Primezora customer account.",
  robots: {
    index: false,
    follow: false,
  },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeCustomerRedirectPath(rawNext);

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#030505] px-4 py-12 text-white/90">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#030505]/90 p-8 text-center shadow-[0_20px_60px_rgba(3,5,5,0.6)]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-600/20 bg-amber-600/10 text-amber-600 shadow-[0_0_25px_rgba(217,119,6,0.15)]">
            <Mail size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Enter the email address linked to your Primezora account. We’ll send a secure link to help you create a new password.
        </p>

        <ForgotPasswordForm nextPath={nextPath} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90 transition hover:border-amber-600/40 hover:text-amber-600"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
