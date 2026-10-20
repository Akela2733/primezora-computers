import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

type CheckoutLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function CheckoutLayout({
  children,
}: CheckoutLayoutProps) {
  const session = await getCustomerSession();

  if (session) {
    return children;
  }

  return (
    <main className="min-h-screen bg-[#030505] px-4 py-12 text-white/90 sm:py-20">
      <section className="container-primezora mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-xl border border-orange-500/25 bg-white/[0.02] p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/[0.07] text-orange-400">
            <ShieldCheck size={24} />
          </span>
          <p className="mt-5 font-display text-[9px] font-bold uppercase tracking-[0.25em] text-orange-400">
            Secure Checkout
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase text-white">
            Sign in to continue
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/55">
            Checkout is available to Primezora customers. Sign in or create an
            account to continue; your cart will be waiting for you.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?next=%2Fcheckout"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-orange-400"
            >
              Sign In
            </Link>
            <Link
              href="/register?next=%2Fcheckout"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-orange-500/45 px-5 text-[10px] font-bold uppercase tracking-wide text-white/85 transition hover:bg-orange-500/[0.08] hover:text-orange-300"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
