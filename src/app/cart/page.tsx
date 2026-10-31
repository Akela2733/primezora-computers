"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Headphones,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

function formatPrice(price: number) {
  return `LKR ${price.toLocaleString("en-LK")}`;
}

function CartHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-orange-500/35 bg-[#030505]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-[58%_53%] md:bg-center"
        style={{
          backgroundImage:
            'url("/banners/hero%20section%20background%20image.png")',
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,5,5,0.97)_0%,rgba(3,5,5,0.85)_36%,rgba(3,5,5,0.18)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/55 via-transparent to-[#030505]/10" />
      <div className="container-primezora flex min-h-[240px] items-center py-9 sm:min-h-[270px] sm:py-12">
        <div className="max-w-lg">
          <p className="flex items-center gap-2 font-display text-[9px] font-bold uppercase tracking-[0.24em] text-orange-400">
            <span className="h-px w-6 bg-orange-500" />
            Your cart
          </p>
          <h1 className="mt-3 font-display text-3xl font-black uppercase leading-[0.98] tracking-tight text-white sm:text-5xl">
            Good choice,
            <br />
            <span className="text-orange-500">legend.</span>
          </h1>
          <p className="mt-3 max-w-sm text-[11px] leading-5 text-white/70 sm:text-xs">
            You&apos;re one step closer to upgrading your setup. Review your
            items, proceed to checkout, and get ready to experience the next
            level of performance.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 text-[10px] font-medium text-white/75 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} className="text-orange-500" />
            Continue shopping
          </Link>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
    </section>
  );
}

function CartLoading({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  return (
    <main className="min-h-[65vh] bg-[#030505] text-white/90">
      <CartHero />
      <div className="container-primezora flex min-h-64 items-center justify-center py-14">
        <div
          role={unavailable ? "alert" : "status"}
          className="max-w-md text-center"
        >
          {unavailable ? (
            <ShoppingBag size={27} className="mx-auto text-orange-500" />
          ) : (
            <LoaderCircle
              size={27}
              className="mx-auto animate-spin text-orange-500"
            />
          )}
          <h2 className="mt-4 font-display text-lg font-semibold text-white/90">
            {unavailable ? "Cart temporarily unavailable" : "Checking your cart"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-white/50">
            {unavailable
              ? "We couldn't reach the product catalog. Your cart is saved and will be checked again automatically."
              : "Confirming your saved products are still available."}
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-orange-500/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-orange-400 transition hover:bg-orange-500/10"
          >
            Continue shopping <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function EmptyCart() {
  return (
    <main className="min-h-[65vh] bg-[#030505] text-white/90">
      <CartHero />
      <section className="container-primezora flex min-h-[360px] items-center justify-center py-14">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/[0.07] text-orange-400">
            <ShoppingBag size={25} />
          </span>
          <p className="mt-5 font-display text-[9px] font-bold uppercase tracking-[0.25em] text-orange-500">
            Your cart
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold uppercase text-white">
            Your cart is empty
          </h2>
          <p className="mt-2 text-xs leading-5 text-white/50">
            Your next upgrade is waiting. Explore our gaming gear and computer
            components to get started.
          </p>
          <Link
            href="/shop"
            className="primezora-button mt-5"
          >
            <span>Explore products</span>
            <span className="primezora-button__icon">
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    validationStatus,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (validationStatus === "checking") return <CartLoading />;
  if (validationStatus === "error") return <CartLoading unavailable />;
  if (items.length === 0) return <EmptyCart />;

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <CartHero />

      <section className="container-primezora py-5 sm:py-7">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
          <section className="rounded-xl border border-white/[0.1] bg-[#030505] p-3 sm:p-5">
            <header className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <h2 className="font-display text-xs font-bold uppercase tracking-wide text-white/90">
                Your cart{" "}
                <span className="font-sans font-normal tracking-normal text-white/45">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              </h2>
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-[9px] text-white/45 transition hover:bg-white/[0.04] hover:text-orange-400"
              >
                <Trash2 size={12} />
                Clear cart
              </button>
            </header>

            <div className="divide-y divide-white/[0.08]">
              {items.map(({ product, quantity }) => {
                const productTotal = product.price * quantity;
                const available =
                  product.inStock &&
                  (product.stockQuantity ?? product.stock ?? 0) > 0;
                const wishlisted = isInWishlist(product.id);
                const maximum = product.stockQuantity ?? product.stock ?? 0;

                return (
                  <article
                    key={product.id}
                    className="grid gap-x-3 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_118px_96px] sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Link
                        href={`/products/${product.slug}`}
                        className="relative h-[82px] w-[88px] shrink-0 overflow-hidden rounded-md border border-white/[0.07] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_65%),#060808] sm:h-[96px] sm:w-[108px]"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="108px"
                          className="object-contain p-2.5"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">
                          {product.brand}
                        </p>
                        <Link
                          href={`/products/${product.slug}`}
                          className="mt-1 line-clamp-2 block text-[11px] font-medium leading-4 text-white/85 transition hover:text-orange-400 sm:text-xs"
                        >
                          {product.name}
                        </Link>
                        <p
                          className={`mt-1.5 flex items-center gap-1 text-[9px] ${
                            available ? "text-emerald-400" : "text-rose-300"
                          }`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {available ? "In stock" : "Out of stock"}
                        </p>
                        <p className="mt-1 font-display text-[11px] font-bold text-orange-500 sm:hidden">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-center">
                      <span className="text-[9px] text-white/40 sm:hidden">
                        Quantity
                      </span>
                      <div className="inline-flex h-8 items-center overflow-hidden rounded border border-white/[0.13]">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name} quantity`}
                          onClick={() =>
                            updateQuantity(product.id, quantity - 1)
                          }
                          className="flex h-full w-7 items-center justify-center text-white/55 transition hover:bg-white/[0.06] hover:text-orange-400"
                        >
                          <Minus size={11} />
                        </button>
                        <span
                          aria-label={`Quantity ${quantity}`}
                          className="flex h-full min-w-8 items-center justify-center border-x border-white/[0.1] px-1 text-[10px] text-white/85"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name} quantity`}
                          disabled={maximum > 0 && quantity >= maximum}
                          onClick={() =>
                            updateQuantity(product.id, quantity + 1)
                          }
                          className="flex h-full w-7 items-center justify-center text-white/55 transition hover:bg-white/[0.06] hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="text-[9px] text-white/40 sm:hidden">
                        Item total
                      </span>
                      <span className="font-display text-[10px] font-bold text-white/85">
                        {formatPrice(productTotal)}
                      </span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          aria-label={
                            wishlisted
                              ? `Remove ${product.name} from wishlist`
                              : `Add ${product.name} to wishlist`
                          }
                          className={`rounded p-1.5 transition hover:bg-white/[0.05] ${
                            wishlisted
                              ? "text-orange-500"
                              : "text-white/40 hover:text-orange-400"
                          }`}
                        >
                          <Heart
                            size={13}
                            fill={wishlisted ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          aria-label={`Remove ${product.name} from cart`}
                          className="rounded p-1.5 text-white/40 transition hover:bg-white/[0.05] hover:text-rose-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-[9px] font-semibold text-white/55 transition hover:text-orange-400"
              >
                <ArrowLeft size={12} className="text-orange-500" />
                Continue shopping
              </Link>
              <span className="text-[9px] text-white/40">
                {items.length} {items.length === 1 ? "product" : "products"} ·{" "}
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 border-t border-white/[0.08] pt-4 sm:grid-cols-3">
              <TrustBadge
                icon={ShieldCheck}
                title="Secure checkout"
                detail="Your data is safe with us."
              />
              <TrustBadge
                icon={Truck}
                title="Islandwide delivery"
                detail="Delivery options at checkout."
              />
              <TrustBadge
                icon={Headphones}
                title="24/7 support"
                detail="We're here to help."
              />
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-xl border border-orange-500/35 bg-[#030505]">
              <header className="border-b border-white/[0.08] px-4 py-3.5">
                <h2 className="font-display text-[11px] font-bold uppercase tracking-wide text-white/90">
                  Order summary
                </h2>
              </header>
              <div className="p-4">
                <div className="space-y-3">
                  <SummaryRow
                    label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
                    value={formatPrice(subtotal)}
                  />
                  <SummaryRow
                    label="Delivery"
                    value="Calculated at checkout"
                    detail="Based on delivery method"
                  />
                  <SummaryRow label="Estimated tax" value="LKR 0" />
                </div>

                <div className="my-4 border-t border-white/[0.1]" />

                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-orange-500">
                    Total
                  </span>
                  <span className="font-display text-base font-bold text-orange-500">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-[9px] text-white/40">
                  Delivery charges are confirmed at checkout.
                </p>

                <Link
                  href="/checkout"
                  className="primezora-button mt-4 w-full"
                >
                  <span>Proceed to checkout</span>
                  <span className="primezora-button__icon"><ArrowRight size={13} /></span>
                </Link>
                <Link
                  href="/shop"
                  className="primezora-button mt-2.5 w-full"
                >
                  <span>Continue shopping</span>
                  <span className="primezora-button__icon"><ArrowRight size={13} /></span>
                </Link>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-emerald-300/80">
                  <Check size={11} />
                  Secure checkout experience
                </p>
              </div>
            </section>

            <Link
              href="/shop"
              className="group relative isolate flex min-h-[142px] items-end overflow-hidden rounded-xl border border-orange-500/25 bg-[#050707] p-4"
            >
              <Image
                src="/banners/build%20your%20pc.png"
                alt=""
                fill
                sizes="300px"
                className="-z-20 object-cover object-center opacity-65 transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030505]/95 via-[#030505]/65 to-transparent" />
              <span className="relative max-w-[190px]">
                <span className="block font-display text-[9px] font-semibold uppercase tracking-[0.15em] text-white/85">
                  Build your
                </span>
                <span className="block font-display text-lg font-black uppercase leading-tight text-orange-500">
                  Dream PC
                </span>
                <span className="mt-1 block text-[9px] text-white/65">
                  Custom PC builds tailored to your needs.
                </span>
                <span className="mt-3 inline-flex items-center gap-2 rounded border border-orange-500/50 px-3 py-1.5 text-[9px] font-semibold text-white/90 transition group-hover:bg-orange-500/15">
                  Start building <ArrowRight size={11} />
                </span>
              </span>
            </Link>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-orange-400">
                Shopping with Primezora
              </h2>
              <div className="space-y-3">
                <TrustBadge
                  icon={ShieldCheck}
                  title="Genuine products"
                  detail="Quality gear you can trust."
                />
                <TrustBadge
                  icon={CreditCard}
                  title="Flexible payment"
                  detail="Choose your method at checkout."
                />
              </div>
            </div>
          </aside>
        </div>

        <section className="relative isolate mt-5 overflow-hidden rounded-xl border border-orange-500/25 bg-[#030505] px-5 py-5 sm:px-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                'url("/banners/hero%20section%20background%20image.png")',
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030505] via-[#030505]/90 to-[#030505]/65" />
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-orange-400">
            Exclusive offer
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="mt-1 font-display text-lg font-bold uppercase text-white sm:text-xl">
                Upgrade your setup{" "}
                <span className="text-orange-500">&amp; save more</span>
              </h2>
              <p className="mt-1 text-[10px] text-white/55">
                Discover more gear and complete your dream setup.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-orange-500/45 px-4 text-[9px] font-bold uppercase tracking-wide text-white/85 transition hover:bg-orange-500/10 hover:text-orange-300"
            >
              Shop now <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>
        <span className="block text-[10px] text-white/55">{label}</span>
        {detail && (
          <span className="mt-0.5 block text-[8px] text-emerald-400/80">
            {detail}
          </span>
        )}
      </span>
      <span className="text-right text-[9px] font-medium text-white/80">
        {value}
      </span>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-orange-500">
        <Icon size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold text-white/80">
          {title}
        </span>
        <span className="mt-0.5 block text-[8px] leading-4 text-white/45">
          {detail}
        </span>
      </span>
    </div>
  );
}
