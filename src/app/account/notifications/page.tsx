import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { NotificationInbox } from "./NotificationInbox";
import { requireCustomerPage } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | Primezora Technologies",
  description: "View your store announcements, order updates and alerts.",
};

export default async function CustomerNotificationsPage() {
  await requireCustomerPage("/account/notifications");

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
            <Bell size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-white/90 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
            Your store announcements, order updates and wishlist alerts in one
            place.
          </p>
        </header>
        <NotificationInbox />
      </div>
    </main>
  );
}
