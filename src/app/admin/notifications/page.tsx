import type { Metadata } from "next";
import { BellRing } from "lucide-react";

import { NotificationManager } from "./NotificationManager";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Notifications | Primezora Admin",
  description: "Send and review customer website notifications.",
};

export default async function AdminNotificationsPage() {
  await requireAdminPage("/admin/notifications");

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <header className="border-b border-white/[0.06]">
        <div className="container-primezora py-9 sm:py-12">
          <p className="font-display text-[9px] uppercase tracking-[0.32em] text-amber-600">
            Customer engagement
          </p>
          <div className="mt-3 flex items-center gap-3">
            <BellRing size={24} className="text-amber-600" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Notifications
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Send store announcements and opted-in promotions to customers. They
            can read and manage these messages from the notification bell on
            your website.
          </p>
        </div>
      </header>
      <section className="container-primezora py-8 sm:py-10">
        <NotificationManager />
      </section>
    </main>
  );
}
