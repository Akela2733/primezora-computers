import Link from "next/link";

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
    <main className="min-h-screen bg-[#05090f] px-4 py-20 text-white">
      <section className="container-primezora mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
        <div className="w-full border border-white/[0.08] bg-[#080d13] p-8 text-center">
          <p className="font-display text-[9px] uppercase tracking-[0.25em] text-orange-400">
            Secure Checkout
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold uppercase">
            Sign in to continue
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
            Checkout is available to Primezora customers. Sign in or create an
            account to continue; your cart will be waiting for you.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?next=%2Fcheckout"
              className="border border-amber-500 bg-amber-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-amber-400"
            >
              Sign In
            </Link>
            <Link
              href="/register?next=%2Fcheckout"
              className="border border-white/15 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:border-white/35"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
