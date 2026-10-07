import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerPage } from "@/lib/customer-auth";
import { ProfileEditor } from "@/components/customer/ProfileEditor";
import { ArrowLeft, User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Profile | My Account | Primezora Technologies",
  description: "Update your personal information, phone number, and shipping address.",
};

export default async function ProfilePage() {
  const session = await requireCustomerPage("/account/profile");
  const { customer } = session;

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] py-10">
      {/* Back link */}
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-white/70"
      >
        <ArrowLeft size={14} />
        Back to Account
      </Link>

      <div className="mx-auto max-w-2xl">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <User size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Edit Profile
            </h1>
            <p className="mt-0.5 text-xs text-white/40">
              Update your personal information and shipping address
            </p>
          </div>
        </div>

        {/* Editor card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-6 md:p-8 backdrop-blur-xl">
          <ProfileEditor
            initialProfile={{
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              address: customer.address,
              city: customer.city,
              province: customer.province,
              postalCode: customer.postalCode,
            }}
          />
        </div>
      </div>
    </main>
  );
}
