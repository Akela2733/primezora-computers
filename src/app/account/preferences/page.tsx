import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";

import { WebsitePreferencesEditor } from "@/components/customer/WebsitePreferencesEditor";
import { requireCustomerPage } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website Preferences | Primezora Technologies",
  description: "Manage email and wishlist notification preferences.",
};

export default async function WebsitePreferencesPage() {
  await requireCustomerPage("/account/preferences");

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] pb-20 pt-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-white/55 transition hover:text-amber-600"
        >
          <ArrowLeft size={14} />
          Back to account
        </Link>
        <header className="mb-7">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-600/20 bg-amber-600/[0.08] text-amber-600">
            <Settings2 size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-white/90 sm:text-3xl">
            Website Preferences
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
            Choose which email updates you would like to receive. You can change
            these settings at any time.
          </p>
        </header>
        <WebsitePreferencesEditor />
      </div>
    </main>
  );
}
