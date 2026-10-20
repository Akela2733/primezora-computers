"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Heart,
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";

import CustomerOrdersClient from "@/app/account/orders/CustomerOrdersClient";
import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";
import {
  ProfileEditor,
  type CustomerProfile,
} from "@/components/customer/ProfileEditor";
import { WebsitePreferencesEditor } from "@/components/customer/WebsitePreferencesEditor";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  PAYMENT_METHOD_CONFIGS,
  SUPPORTED_PAYMENT_METHODS,
} from "@/lib/payment";
import type { Product } from "@/types/product";

type AccountSection =
  | "account"
  | "wishlist"
  | "orders"
  | "addresses"
  | "payments"
  | "settings"
  | "logout";

type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

const ACCOUNT_SECTIONS: {
  id: AccountSection;
  label: string;
  icon: typeof UserRound;
}[] = [
  { id: "account", label: "My Account", icon: UserRound },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payments", label: "Payment Details", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "logout", label: "Logout", icon: LogOut },
];

const SECTION_TITLES: Record<AccountSection, string> = {
  account: "My Account",
  wishlist: "Wishlist",
  orders: "My Orders",
  addresses: "Addresses",
  payments: "Payment Details",
  settings: "Settings",
  logout: "Sign out",
};

function formatPrice(price: number) {
  return `LKR ${price.toLocaleString("en-LK")}`;
}

function WishlistSection() {
  const {
    items,
    itemCount,
    availabilityStatus,
    removeFromWishlist,
  } = useWishlist();
  const { addToCart } = useCart();
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function addProductToCart(product: Product) {
    setPendingProductId(product.id);
    setMessage("");
    setError("");

    try {
      const result = await addToCart(product, 1);
      if (result === "added") {
        removeFromWishlist(product.id);
        setMessage(`${product.name} was added to your cart.`);
      } else if (result === "unavailable") {
        removeFromWishlist(product.id);
        setError(`${product.name} is no longer available.`);
      } else {
        setError(`Could not confirm ${product.name} is available. Try again.`);
      }
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Unable to add this product to your cart."
      );
    } finally {
      setPendingProductId(null);
    }
  }

  if (availabilityStatus !== "current") {
    return (
      <div
        className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#030505] px-5 text-center"
        role={availabilityStatus === "error" ? "alert" : "status"}
      >
        {availabilityStatus === "checking" ? (
          <>
            <LoaderCircle size={23} className="animate-spin text-amber-500" />
            <p className="mt-3 text-sm text-white/60">Loading your wishlist…</p>
          </>
        ) : (
          <>
            <Heart size={23} className="text-amber-500" />
            <p className="mt-3 text-sm text-white/70">
              Your wishlist is temporarily unavailable. Your saved items are safe;
              try again shortly.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-white/50">
          {itemCount} saved {itemCount === 1 ? "product" : "products"}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400"
        >
          Continue shopping <ArrowRight size={13} />
        </Link>
      </div>

      {message && (
        <p role="status" className="mb-3 text-xs text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((product) => {
            const available =
              product.inStock && (product.stockQuantity ?? product.stock ?? 0) > 0;
            const pending = pendingProductId === product.id;

            return (
              <article
                key={product.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:flex-nowrap sm:gap-4"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-contain p-2"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">
                    {product.brand}
                  </p>
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-1 block text-sm font-semibold text-white/85 transition hover:text-amber-400"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 font-display text-sm font-bold text-amber-500">
                    {formatPrice(product.price)}
                  </p>
                  <p className={`mt-1 text-[10px] ${available ? "text-emerald-300" : "text-white/40"}`}>
                    {available ? "In stock" : "Currently unavailable"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:border-rose-400/30 hover:text-rose-300"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!available || pending}
                    onClick={() => void addProductToCart(product)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-500 px-3 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {pending ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <ShoppingBag size={14} />
                    )}
                    Add to cart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center">
          <Heart size={25} className="mx-auto text-amber-500/70" />
          <h3 className="mt-3 font-display text-sm font-semibold text-white/80">
            Your wishlist is empty
          </h3>
          <p className="mt-1 text-xs text-white/45">
            Save products you love and they&apos;ll appear here.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10"
          >
            Browse products <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function AccountDashboard({
  profile,
  displayName,
  recentOrders,
}: {
  profile: CustomerProfile;
  displayName: string;
  recentOrders: AccountOrder[];
}) {
  const [section, setSection] = useState<AccountSection>("account");
  const { itemCount: wishlistItemCount } = useWishlist();

  function renderSection() {
    switch (section) {
      case "account":
        return (
          <div className="space-y-7">
            <div>
              <p className="text-xs text-white/50">
                Signed in as <span className="text-white/80">{profile.email}</span>
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-white/90">
                Welcome, {displayName}
              </h3>
            </div>

            <section>
              <h3 className="mb-4 font-display text-sm font-semibold text-white/85">
                Personal information
              </h3>
              <ProfileEditor initialProfile={profile} sections={["personal"]} />
            </section>

            <section className="border-t border-white/[0.08] pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-white/85">
                    Recent orders
                  </h3>
                  <p className="mt-1 text-xs text-white/45">
                    Your latest purchases and their current status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection("orders")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400"
                >
                  View all <ArrowRight size={13} />
                </button>
              </div>
              {recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {recentOrders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-3 transition hover:border-amber-500/25"
                    >
                      <span>
                        <span className="block font-mono text-xs font-semibold text-amber-400">
                          {order.orderNumber}
                        </span>
                        <span className="mt-1 block text-[10px] text-white/40">
                          {new Date(order.createdAt).toLocaleDateString("en-LK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-3 text-xs">
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase text-white/60">
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-white/85">
                          {formatPrice(order.total)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-7 text-center">
                  <p className="text-xs text-white/50">You haven&apos;t placed an order yet.</p>
                  <Link
                    href="/shop"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500"
                  >
                    Explore products <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </section>
          </div>
        );
      case "wishlist":
        return <WishlistSection />;
      case "orders":
        return <CustomerOrdersClient embedded />;
      case "addresses":
        return (
          <div>
            <p className="mb-5 text-xs leading-5 text-white/50">
              Manage the shipping address used for your account orders.
            </p>
            <ProfileEditor initialProfile={profile} sections={["address"]} />
          </div>
        );
      case "payments":
        return (
          <div>
            <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <p className="text-sm font-semibold text-white/85">
                No saved payment cards
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                For your security, card details are not stored in your account.
                Choose a payment method when you check out.
              </p>
            </div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Available at checkout
            </h3>
            <div className="space-y-3">
              {SUPPORTED_PAYMENT_METHODS.map((method) => {
                const config = PAYMENT_METHOD_CONFIGS[method];
                return (
                  <div
                    key={method}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/[0.08] text-amber-400">
                      <CreditCard size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white/85">
                        {config.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/45">
                        {config.shortDescription}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "settings":
        return <WebsitePreferencesEditor />;
      case "logout":
        return (
          <div className="max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/[0.08] text-rose-300">
              <LogOut size={19} />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-white/90">
              Sign out of Primezora?
            </h3>
            <p className="mt-2 text-xs leading-5 text-white/50">
              You can sign back in at any time to manage your account and orders.
            </p>
            <CustomerLogoutButton className="mt-5" />
          </div>
        );
    }
  }

  const selectedSection = ACCOUNT_SECTIONS.find((item) => item.id === section);
  const SelectedIcon = selectedSection?.icon ?? UserRound;

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] py-7 text-white/90 sm:py-10">
      <header className="relative mb-6 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#030505] px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_95%_0%,rgba(249,115,22,0.16),transparent_48%),linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.025))]" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-500">
            Primezora customer
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
            My Account
          </h1>
          <p className="mt-2 text-xs text-white/50">
            Manage your profile, saved products, orders, and preferences.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        <aside className="h-fit rounded-xl border border-white/[0.09] bg-[#030505] p-2 md:p-3">
          <div className="hidden border-b border-white/[0.07] px-3 pb-3 md:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Account menu
            </p>
            <p className="mt-1 truncate text-xs font-medium text-white/75">
              {displayName}
            </p>
          </div>
          <nav
            aria-label="Account sections"
            className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible md:pt-2"
          >
            {ACCOUNT_SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSection(id)}
                  className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition md:w-full ${
                    active
                      ? id === "logout"
                        ? "bg-rose-500/10 text-rose-300"
                        : "bg-amber-500/[0.12] text-amber-400"
                      : id === "logout"
                        ? "text-rose-300/70 hover:bg-rose-500/[0.06] hover:text-rose-300"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{label}</span>
                  {id === "wishlist" && wishlistItemCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-black">
                      {wishlistItemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section
          aria-labelledby="account-section-title"
          className="min-h-[420px] rounded-xl border border-white/[0.09] bg-[#030505] p-4 sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3 border-b border-white/[0.07] pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/[0.08] text-amber-400">
              <SelectedIcon size={17} />
            </span>
            <h2
              id="account-section-title"
              className="font-display text-base font-semibold text-white/90"
            >
              {SECTION_TITLES[section]}
            </h2>
          </div>
          {renderSection()}
        </section>
      </div>
    </main>
  );
}
