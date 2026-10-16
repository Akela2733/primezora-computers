import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password | Primezora Technologies",
  description: "Choose a new password for your Primezora customer account.",
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeCustomerRedirectPath(rawNext);

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#030505] px-4 py-12 text-white/90">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#030505]/90 p-8 text-center shadow-[0_20px_60px_rgba(3,5,5,0.6)]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-600/20 bg-amber-600/10 text-amber-600 shadow-[0_0_25px_rgba(217,119,6,0.15)]">
            <KeyRound size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Enter and confirm a new password for your Primezora account. Your
          password must be at least 8 characters long.
        </p>

        <ResetPasswordForm nextPath={nextPath} />

        <div className="mt-8 flex justify-center">
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
