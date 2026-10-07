import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomerPage } from "@/lib/customer-auth";
import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Calendar,
  Phone,
  Mail,
  Package,
  Shield,
  ArrowRight,
  ExternalLink,
  Settings,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account | Primezora Technologies",
  description: "View your profile details, recent orders, and shipping information.",
};

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------
const STATUS_STYLES: Record<string, string> = {
  PENDING:          "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  CONFIRMED:        "border-blue-500/20 bg-blue-500/10 text-blue-300",
  PROCESSING:       "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  SHIPPED:          "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  READY_FOR_PICKUP: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  COMPLETED:        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  CANCELLED:        "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

// ---------------------------------------------------------------------------
// Nav items – sidebar
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { label: "Profile", href: "/account/profile", icon: User, implemented: true },
  { label: "Orders", href: "/account/orders", icon: ShoppingBag, implemented: true },
  { label: "Wishlist", href: "/wishlist", icon: Heart, implemented: true },
  { label: "Addresses", href: "/account/addresses", icon: MapPin, implemented: false },
  { label: "Account Settings", href: "/account/settings", icon: Settings, implemented: false },
];

export default async function AccountPage() {
  const session = await requireCustomerPage("/account");
  const { customer } = session;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true },
  });

  const displayName =
    customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.name || customer.email.split("@")[0];

  const joinedDate = new Date(customer.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const hasAddress = customer.address || customer.city;

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] py-10">
      {/* ------------------------------------------------------------------ */}
      {/* ACCOUNT HEADER                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d13] p-6 md:p-8">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-500/[0.03] blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.18)]">
              <User size={30} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-white/35">
                Welcome back
              </p>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <Shield size={9} />
                  Verified
                </span>
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} className="text-white/35" />
                  {customer.email}
                </span>
                <span className="text-white/20 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/35" />
                  Member since {joinedDate}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition hover:border-amber-500/40 hover:bg-amber-500/20"
            >
              <User size={14} />
              Edit Profile
            </Link>
            <CustomerLogoutButton />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN GRID: Sidebar + Content                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* ---- SIDEBAR ---- */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 space-y-2">
            <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Navigation
            </p>
            {NAV_ITEMS.map(({ label, href, icon: Icon, implemented }) => (
              <Link
                key={label}
                href={href}
                className={`
                  group flex items-center justify-between rounded-xl border px-4 py-3
                  text-sm font-medium transition
                  ${implemented
                    ? "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-amber-500/30 hover:bg-white/[0.06] hover:text-white"
                    : "border-white/[0.04] bg-white/[0.01] text-white/35 cursor-default pointer-events-none"
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <Icon size={15} className={implemented ? "text-amber-400" : "text-white/25"} />
                  {label}
                </span>
                {implemented ? (
                  <ChevronRight size={14} className="text-white/25 transition group-hover:text-white/60 group-hover:translate-x-0.5" />
                ) : (
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase text-white/25">Soon</span>
                )}
              </Link>
            ))}
          </div>
        </aside>

        {/* ---- MAIN CONTENT ---- */}
        <div className="space-y-6 lg:col-span-3">

          {/* ---- Quick Stats ---- */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag },
              {
                label: "Phone",
                value: customer.phone || "Not set",
                icon: Phone,
                muted: !customer.phone,
              },
              {
                label: "Default Address",
                value: hasAddress ? (customer.city || "Set") : "Not set",
                icon: MapPin,
                muted: !hasAddress,
              },
            ].map(({ label, value, icon: Icon, muted }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-[#080d13] p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/8 text-amber-400">
                  <Icon size={15} />
                </div>
                <p className="font-display text-lg font-bold text-white">{value}</p>
                <p className={`mt-0.5 text-[11px] ${muted ? "text-white/25" : "text-white/40"}`}>{label}</p>
              </div>
            ))}
          </div>

          {/* ---- Profile Card ---- */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                <User size={17} className="text-amber-400" />
                Customer Profile
              </h2>
              <Link
                href="/account/profile"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/50 transition hover:border-white/15 hover:text-white/80"
              >
                <Settings size={11} />
                Edit
              </Link>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              {[
                { label: "First Name", value: customer.firstName },
                { label: "Last Name", value: customer.lastName },
                { label: "Email", value: customer.email },
                { label: "Phone", value: customer.phone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="mb-0.5 text-white/35">{label}</dt>
                  <dd className={`font-medium ${value ? "text-white/90" : "text-white/25 italic"}`}>
                    {value || "Not provided"}
                  </dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="mb-0.5 text-white/35">Authentication</dt>
                <dd className="inline-flex items-center gap-1.5 font-medium text-amber-300/80">
                  <CheckCircle2 size={12} />
                  Supabase Auth (Secured)
                </dd>
              </div>
            </dl>

            {/* Address sub-section */}
            {hasAddress && (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  <MapPin size={11} />
                  Default Shipping Address
                </div>
                <div className="space-y-1 text-xs text-white/70">
                  {customer.address && <p className="font-medium text-white/85">{customer.address}</p>}
                  <p>
                    {[customer.city, customer.province, customer.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {customer.phone && (
                    <p className="flex items-center gap-1.5 pt-1 text-white/40">
                      <Phone size={11} />
                      {customer.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---- Recent Orders ---- */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                  <ShoppingBag size={17} className="text-amber-400" />
                  Recent Orders
                </h2>
                <p className="mt-0.5 text-xs text-white/35">
                  Track deliveries and review purchase history
                </p>
              </div>
              {orders.length > 0 && (
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-display text-[11px] font-semibold text-white/60 transition hover:border-amber-500/25 hover:text-amber-300"
                >
                  All Orders
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.10] hover:bg-white/[0.04]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
                      <div>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="font-mono text-xs font-semibold text-amber-400 hover:text-amber-300"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="ml-2 text-xs text-white/35">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider ${
                          STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-white/50">
                        <span>
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </span>
                        <span className="mx-2 text-white/20">•</span>
                        <span className="capitalize">
                          {order.paymentMethod.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="font-display font-bold text-white">
                        LKR {order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-white/25">
                  <Package size={22} />
                </div>
                <h3 className="font-display text-sm font-semibold text-white/60">
                  No orders placed yet
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-white/35">
                  When you purchase from Primezora, your orders and tracking details will appear here.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
                >
                  <span>Explore Products</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* ---- Quick Links ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/wishlist"
              className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#080d13] p-4 transition hover:border-amber-500/25 hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <Heart size={17} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white group-hover:text-amber-200">
                    My Wishlist
                  </p>
                  <p className="text-[11px] text-white/35">Saved components &amp; gear</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-white/25 transition group-hover:translate-x-1 group-hover:text-white/60" />
            </Link>

            <Link
              href="/shop"
              className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#080d13] p-4 transition hover:border-amber-500/25 hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <ShoppingBag size={17} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white group-hover:text-amber-200">
                    Continue Shopping
                  </p>
                  <p className="text-[11px] text-white/35">Browse all products</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-white/25 transition group-hover:translate-x-1 group-hover:text-white/60" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
