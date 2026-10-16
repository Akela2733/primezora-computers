"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  Heart,
  X,
  Check,
} from "lucide-react";

import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useCart } from "@/context/CartContext";
import type { CatalogCategory } from "@/lib/categories";
import type { StorefrontContent } from "@/lib/storefront-content";

type HeaderProps = {
  categories: Pick<CatalogCategory, "id" | "name" | "slug">[];
  brand: StorefrontContent["brand"] | null;
  navigation: StorefrontContent["navigation"] | null;
  searchPlaceholder: string;
};

export function Header({
  categories,
  brand,
  navigation,
  searchPlaceholder,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const { itemCount, lastAddedProduct } = useCart();
  const [dismissedCartEventId, setDismissedCartEventId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!lastAddedProduct) return;

    const timeoutId = window.setTimeout(() => {
      setDismissedCartEventId(lastAddedProduct.eventId);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [lastAddedProduct]);
  const cartConfirmation =
    lastAddedProduct?.eventId !== dismissedCartEventId
      ? lastAddedProduct
      : null;

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-amber-600/[0.14] bg-[#030505]/95 backdrop-blur-xl">

      {/* ================================
          MAIN HEADER
      ================================= */}

      <div className="container-primezora">

        <div className="flex h-[76px] items-center gap-5">

          {/* LOGO */}

          {brand && (
            <Link
              href="/"
              aria-label={brand.name}
              className="flex shrink-0 items-center"
            >
              <Image
                src={brand.logo}
                alt={brand.logoAlt}
                width={210}
                height={100}
                priority
                unoptimized
                className="h-40 w-auto object-contain"
              />
            </Link>
          )}


          {/* SEARCH */}

          <div className="hidden flex-1 md:block">

            <form
              action="/search"
              method="GET"
              role="search"
              className="relative mx-auto max-w-[570px]"
            >

              <Search
                size={17}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-white/30
                "
              />

              <input
                type="search"
                name="q"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-white/[0.08]
                  bg-white/[0.04]
                  pl-11
                  pr-12
                  text-sm
                  text-white/90
                  outline-none

                  placeholder:text-white/25

                  focus:border-amber-600/50
                  focus:bg-white/[0.055]
                "
              />

              <button
                type="submit"
                aria-label="Search products"
                className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-amber-600"
              >
                <Search size={16} />
              </button>

            </form>

          </div>


          {/* RIGHT ACTIONS */}

          <div className="ml-auto flex items-center gap-1">

            {/* Delivery */}

            {/* <details className="group relative hidden lg:block">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg border border-amber-600/15 bg-amber-600/[0.04] px-3 py-2 text-white/75 transition hover:border-amber-600/30 hover:bg-amber-600/[0.08] [&::-webkit-details-marker]:hidden">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-amber-600/20 bg-amber-600/10 text-amber-600">
                  <MapPin size={15} />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#030505] bg-emerald-400" />
                </span>
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-display text-[8px] font-medium tracking-[0.1em] text-white/40">
                    Islandwide Delivery
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.02em] text-white/90">
                    Sri Lanka
                  </span>
                </span>
                <ChevronDown
                  size={13}
                  className="ml-1 text-white/45 transition-transform group-open:rotate-180"
                />
              </summary>

              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[288px] overflow-hidden rounded-lg border border-amber-600/20 bg-[#030505]/[0.98] shadow-[0_18px_55px_rgba(3,5,5,0.55)] backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-600/70 to-transparent" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[9px] font-medium tracking-[0.12em] text-amber-600/65">
                      SHIPPING COVERAGE
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 font-display text-[8px] tracking-[0.06em] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      ISLANDWIDE
                    </span>
                  </div>
                  <div className="mt-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-600/10 text-amber-600">
                      <Truck size={17} />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-white/90">
                        Sri Lanka
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/50">
                        Islandwide delivery is available for your order.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[0.07] p-3">
                  <Link
                    href="/contact"
                    className="flex items-center justify-between rounded-md px-2 py-2 text-xs text-white/65 transition hover:bg-white/[0.04] hover:text-white/90"
                  >
                    <span>Delivery questions?</span>
                    <span className="font-display inline-flex items-center gap-1.5 font-medium text-amber-600">
                      Contact us <ArrowRight size={13} />
                    </span>
                  </Link>
                </div>
              </div>
            </details> */}


            {/* Wishlist */}

            <Link
              href="/wishlist"
              className="
                hidden
                rounded-lg
                p-2
                text-white/55
                transition

                hover:bg-white/[0.05]
                hover:text-white/90

                sm:block
              "
            >

              <Heart size={19} />

            </Link>


            {/* Account */}

            <NotificationBell />

            <Link
              href="/account"
              className="
                rounded-lg
                p-2
                text-white/55
                transition

                hover:bg-white/[0.05]
                hover:text-white/90
              "
            >

              <UserRound size={19} />

            </Link>


            {/* Cart */}

            <Link
              href="/cart"
              aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              className="
                relative
                rounded-lg
                p-2
                text-white/55
                transition

                hover:bg-white/[0.05]
                hover:text-white/90
              "
            >

              <ShoppingCart size={19} />

              <span
                aria-hidden="true"
                className="
                  absolute
                  -right-0.5
                  -top-0.5

                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center

                  rounded-full

                  bg-amber-600

                  px-1

                  text-[9px]
                  font-bold
                  text-white/90
                "
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>

            </Link>


            {/* Mobile menu */}

            <button
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="
                rounded-lg
                p-2
                text-white/60

                hover:bg-white/[0.05]
                hover:text-white/90

                md:hidden
              "
              aria-label="Open menu"
            >

              {mobileMenuOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}

            </button>

          </div>

        </div>

      </div>


      {/* ================================
          DESKTOP NAVIGATION
      ================================= */}

      <nav
        aria-label="Main navigation"
        className="hidden border-t border-white/[0.05] md:block"
      >
        <div className="container-primezora">
          <div className="flex min-h-11 flex-wrap items-center gap-x-8 gap-y-2 py-2">
            {navigation && (
              <>
                <NavLink href="/" label={navigation.homeLabel} />
                <NavLink href="/shop" label={navigation.shopLabel} />
              </>
            )}

            <NavLink href="/about" label="About" />
            <NavLink href="/contact" label="Contact" />

            {navigation && (
              <Link
                href={navigation.dealsHref}
                className="font-display text-xs font-semibold tracking-[0.04em] text-amber-600 transition hover:text-amber-500"
              >
                {navigation.dealsLabel}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {categories.length > 0 && (
        <nav
          aria-label="Shop by category"
          className="hidden border-t border-white/[0.05] bg-white/[0.02] md:block"
        >
          <div className="container-primezora overflow-x-auto">
            <div className="flex min-h-10 w-max min-w-full items-center gap-x-7 py-2">
              <span className="shrink-0 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600/75">
                Categories
              </span>
              {categories.map((category) => (
                <NavLink
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  label={category.name}
                />
              ))}
            </div>
          </div>
        </nav>
      )}


      {/* ================================
          MOBILE NAVIGATION
      ================================= */}

      {mobileMenuOpen && (

        <div
          className="
            border-t
            border-white/[0.07]
            bg-[#030505]
            md:hidden
          "
        >

          <div className="container-primezora py-4">

            {/* Mobile search */}

            <form
              action="/search"
              method="GET"
              role="search"
              className="relative mb-4"
            >

              <Search
                size={17}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-white/30
                "
              />

              <input
                type="search"
                name="q"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-white/[0.08]
                  bg-white/[0.04]
                  pl-10
                  pr-12
                  text-sm
                  outline-none
                  text-white/90
                  focus:border-amber-600/50
                  focus:bg-white/[0.06]

                  placeholder:text-white/25
                "
              />

              <button
                type="submit"
                aria-label="Search products"
                className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-amber-600"
              >
                <Search size={16} />
              </button>

            </form>


            {/* Links */}

            <div className="grid gap-1">
              {navigation && (
                <>
                  <MobileLink
                    href="/"
                    label={navigation.homeLabel}
                    closeMenu={() => setMobileMenuOpen(false)}
                  />
                  <MobileLink
                    href="/shop"
                    label={navigation.shopLabel}
                    closeMenu={() => setMobileMenuOpen(false)}
                  />
                </>
              )}

              <MobileLink
                href="/about"
                label="About"
                closeMenu={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/contact"
                label="Contact"
                closeMenu={() => setMobileMenuOpen(false)}
              />
            </div>

            {categories.length > 0 && (
              <div className="mt-3 border-t border-white/[0.07] pt-3">
                <p className="px-3 pb-1 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600/75">
                  Categories
                </p>
                <div className="grid gap-1">
                  {categories.map((category) => (
                    <MobileLink
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      label={category.name}
                      closeMenu={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      )}

    </header>

      {cartConfirmation && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed right-4 top-24 z-60 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-emerald-400/25 bg-[#080d0b] p-4 text-white shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <Check size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/90">
              {cartConfirmation.quantity > 0
                ? "Added to your cart"
                : "Already in your cart"}
            </p>
            <p className="mt-1 truncate text-xs text-white/55">
              {cartConfirmation.name}
              {cartConfirmation.quantity > 1
                ? ` · ${cartConfirmation.quantity} items`
                : ""}
            </p>
            <Link
              href="/cart"
              onClick={() =>
                setDismissedCartEventId(cartConfirmation.eventId)
              }
              className="mt-2 inline-flex text-xs font-semibold text-amber-500 transition hover:text-amber-400"
            >
              View cart
            </Link>
          </div>
          <button
            type="button"
            aria-label="Dismiss cart confirmation"
            onClick={() =>
              setDismissedCartEventId(cartConfirmation.eventId)
            }
            className="rounded p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
          >
            <X size={15} />
          </button>
        </aside>
      )}
    </>
  );
}


/* ======================================
   DESKTOP NAV LINK
====================================== */

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="
        font-display
        text-xs
        font-semibold
        tracking-[0.04em]
        text-white/55

        transition

        hover:text-white/90
      "
    >
      {label}
    </Link>
  );
}


/* ======================================
   MOBILE LINK
====================================== */

function MobileLink({
  href,
  label,
  closeMenu,
}: {
  href: string;
  label: string;
  closeMenu: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={closeMenu}
      className="
        rounded-lg
        px-3
        py-3

        font-display
        text-sm
        font-medium
        tracking-[0.02em]
        text-white/65

        transition

        hover:bg-white/[0.05]
        hover:text-white/90
      "
    >
      {label}
    </Link>
  );
}