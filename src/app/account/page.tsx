import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomerPage } from "@/lib/customer-auth";
import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account | Primezora Technologies",
  description: "View your profile details, recent orders, and shipping information.",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  CONFIRMED: "border-white/15 bg-white/[0.06] text-white/70",
  PROCESSING: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  SHIPPED: "border-white/15 bg-white/[0.06] text-white/70",
  READY_FOR_PICKUP: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  COMPLETED: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

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

  const accountLinks = [
    {
      title: "My Orders",
      description: "View your order history, track deliveries and purchase details.",
      action: "View All Orders",
      href: "/account/orders",
      icon: Package,
      iconClass: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },
    {
      title: "Wishlist",
      description: "Your saved items and products you are interested in.",
      action: "View Wishlist",
      href: "/wishlist",
      icon: Heart,
      iconClass: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },
    {
      title: "Addresses",
      description: hasAddress
        ? `Default address${customer.city ? ` in ${customer.city}` : ""}.`
        : "Add or update your shipping and billing address.",
      action: "Manage Addresses",
      href: "/account/profile",
      icon: MapPin,
      iconClass: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },
    {
      title: "Account Settings",
      description: "Update your personal information and contact details.",
      action: "Edit Settings",
      href: "/account/profile",
      icon: Settings,
      iconClass: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },
  ];

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] pb-28 pt-6 sm:pt-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative isolate mb-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#070a0e] px-5 py-6 sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(245,158,11,0.09),transparent_45%),linear-gradient(120deg,transparent_45%,rgba(255,255,255,0.025))]" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-400/70 bg-amber-400/[0.06] text-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.1)] sm:h-20 sm:w-20">
                <User size={32} strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Welcome back
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/[0.08] px-2.5 py-1 text-[9px] font-semibold tracking-wide text-amber-200">
                    <ShieldCheck size={11} />
                    Verified
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 text-xs text-white/55 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail size={12} className="shrink-0 text-white/40" />
                    <span className="truncate">{customer.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-white/40" />
                    Member since {joinedDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              <Link
                href="/account/profile"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-400/[0.08] px-3.5 text-xs font-semibold text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-400/[0.14]"
              >
                <User size={14} />
                Edit Profile
              </Link>
              <CustomerLogoutButton />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section aria-label="Account shortcuts" className="grid gap-3 sm:grid-cols-2">
              {accountLinks.map(({ title, description, action, href, icon: Icon, iconClass }) => (
                <Link
                  key={title}
                  href={href}
                  className="group relative flex min-h-44 flex-col overflow-hidden rounded-xl border border-white/[0.09] bg-[#080b0f] p-4 transition hover:border-amber-400/35 hover:bg-[#0b0e12] sm:p-5"
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-400/[0.035] blur-3xl transition group-hover:bg-amber-400/[0.07]" />
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}>
                      <Icon size={21} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h2 className="font-display text-base font-semibold text-white">
                        {title}
                      </h2>
                      <p className="mt-1.5 max-w-xs text-xs leading-5 text-white/50">
                        {description}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="mt-3 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-amber-200"
                    />
                  </div>
                  <span className="relative mt-auto inline-flex items-center gap-2 pt-5 text-[11px] font-medium text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    {action}
                    <ArrowRight size={12} className="transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </section>

            <section className="rounded-xl border border-white/[0.09] bg-[#080b0f] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                    <ShoppingBag size={17} className="text-amber-300" />
                    Recent Orders
                  </h2>
                  <p className="mt-1 text-xs text-white/45">
                    Track deliveries and review your purchase history
                  </p>
                </div>
                <Link
                  href="/account/orders"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/[0.08]"
                >
                  All Orders <ArrowRight size={13} />
                </Link>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-2.5">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 transition hover:border-amber-400/20 hover:bg-white/[0.035]"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-amber-300 group-hover:text-amber-200">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-[11px] text-white/40">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          <span className="mx-2 text-white/20">·</span>
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${
                            STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <span className="whitespace-nowrap font-display text-xs font-bold text-white">
                          LKR {order.total.toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/[0.09] px-4 py-8 text-center">
                  <Package size={22} className="mx-auto text-white/30" />
                  <h3 className="mt-3 font-display text-sm font-semibold text-white/75">
                    No orders placed yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/45">
                    Your order history and delivery updates will appear here after your first purchase.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.08] px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/[0.14]"
                  >
                    Explore Products <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-white/[0.09] bg-[#080b0f] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
                  <User size={15} className="text-amber-300" />
                  Profile Details
                </h2>
                <Link
                  href="/account/profile"
                  aria-label="Edit profile details"
                  className="rounded-md p-1.5 text-white/50 transition hover:bg-white/[0.06] hover:text-amber-200"
                >
                  <Settings size={14} />
                </Link>
              </div>

              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-white/40">Name</dt>
                  <dd className="mt-0.5 font-medium text-white/85">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Email</dt>
                  <dd className="mt-0.5 break-all font-medium text-white/85">{customer.email}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Phone</dt>
                  <dd className={`mt-0.5 font-medium ${customer.phone ? "text-white/85" : "text-white/35"}`}>
                    {customer.phone || "Not provided"}
                  </dd>
                </div>
                <div className="border-t border-white/[0.07] pt-3">
                  <dt className="flex items-center gap-1.5 text-white/40">
                    <MapPin size={11} />
                    Default Shipping Address
                  </dt>
                  <dd className={`mt-1 leading-5 ${hasAddress ? "text-white/70" : "text-white/35"}`}>
                    {hasAddress
                      ? [customer.address, customer.city, customer.province, customer.postalCode]
                          .filter(Boolean)
                          .join(", ")
                      : "No address saved"}
                  </dd>
                </div>
                <div className="border-t border-white/[0.07] pt-3">
                  <dt className="text-white/40">Account security</dt>
                  <dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-amber-200/85">
                    <CheckCircle2 size={12} />
                    Supabase Auth secured
                  </dd>
                </div>
              </dl>

              <Link
                href="/account/profile"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-white/75 transition hover:border-amber-400/25 hover:text-amber-200"
              >
                Edit Profile <ArrowRight size={13} />
              </Link>
            </section>

            <Link
              href="/contact"
              className="group flex items-center gap-3 rounded-xl border border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.07),rgba(8,11,15,0.95)_55%)] p-4 transition hover:border-amber-400/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-black/20 text-amber-300">
                <Phone size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-semibold text-white">Need Help?</h2>
                <p className="mt-1 text-[11px] text-white/50">Our support team is here to help.</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-amber-200" />
            </Link>
          </aside>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.1] bg-[#05070a]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[
            { label: "Home", href: "/", icon: Home },
            { label: "Shop", href: "/shop", icon: ShoppingBag },
            { label: "Categories", href: "/shop", icon: LayoutGrid },
            { label: "Wishlist", href: "/wishlist", icon: Heart },
            { label: "Profile", href: "/account", icon: User },
          ].map(({ label, href, icon: Icon }) => {
            const active = label === "Profile";

            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] font-medium transition ${
                  active ? "text-amber-300" : "text-white/50 hover:text-white/80"
                }`}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-7 rounded-full bg-amber-400" />
                )}
                <Icon size={17} strokeWidth={active ? 2 : 1.7} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
