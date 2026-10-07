"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  /*
  |--------------------------------------------------------------------------
  | Empty Cart
  |--------------------------------------------------------------------------
  */

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#05090f] text-white">
        <section className="container-primezora flex min-h-[70vh] items-center justify-center py-16">
          <div className="w-full max-w-xl text-center">

            {/* Icon */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center border border-white/[0.08] bg-white/[0.02]">
              <ShoppingBag
                size={28}
                className="text-orange-400"
              />
            </div>

            {/* Label */}

            <p className="mt-8 text-[8px] font-bold uppercase tracking-[0.3em] text-orange-400">
              Your Shopping Cart
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Your cart is empty.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-white/35">
              Looks like you haven&apos;t added
              anything to your cart yet.
              Explore our latest computer
              components, gaming accessories
              and technology products.
            </p>

            <Link
              href="/shop"
              className="mx-auto mt-8 flex h-12 w-fit items-center gap-3 bg-orange-500 px-7 text-[9px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-orange-400"
            >
              Continue Shopping

              <ArrowRight size={14} />
            </Link>

          </div>
        </section>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cart
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#05090f] text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-white/[0.07]">

        <div className="container-primezora py-10 sm:py-14">

          <div className="flex flex-col gap-3">

            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-orange-400">
              Shopping Cart
            </p>

            <div className="flex flex-wrap items-end justify-between gap-5">

              <div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your Cart
                </h1>

                <p className="mt-2 text-xs text-white/35">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "item"
                    : "items"}{" "}
                  selected for checkout.
                </p>

              </div>

              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30 transition-colors hover:text-red-400"
              >
                <Trash2 size={12} />

                Clear Cart
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CART CONTENT
      ===================================================== */}

      <section className="container-primezora py-8 sm:py-12 lg:py-16">

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:gap-12">

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div>

            {/* Desktop heading */}

            <div className="mb-4 hidden border-b border-white/[0.07] pb-3 sm:grid sm:grid-cols-[1fr_120px_120px] sm:gap-5">

              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                Product
              </span>

              <span className="text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                Quantity
              </span>

              <span className="text-right text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                Total
              </span>

            </div>


            {/* Product list */}

            <div className="space-y-3">

              {items.map((item) => {

                const productTotal =
                  item.product.price *
                  item.quantity;

                return (
                  <article
                    key={item.product.id}
                    className="border border-white/[0.07] bg-white/[0.015] p-3 transition-colors hover:border-orange-500/20 sm:p-4"
                  >

                    <div className="grid gap-4 sm:grid-cols-[1fr_120px_120px] sm:items-center sm:gap-5">

                      {/* =====================================
                          PRODUCT
                      ===================================== */}

                      <div className="flex min-w-0 gap-4">

                        {/* Image */}

                        <Link
                          href={`/products/${item.product.slug}`}
                          className="relative h-24 w-24 shrink-0 overflow-hidden border border-white/[0.07] bg-[#080b0d] sm:h-28 sm:w-28"
                        >

                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_60%)]" />

                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="112px"
                            className="object-contain p-3"
                          />

                        </Link>


                        {/* Details */}

                        <div className="flex min-w-0 flex-1 flex-col justify-center">

                          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-orange-400">
                            {item.product.brand}
                          </p>

                          <Link
                            href={`/products/${item.product.slug}`}
                            className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/85 transition-colors hover:text-orange-400 sm:text-sm"
                          >
                            {item.product.name}
                          </Link>

                          <p className="mt-1 text-[9px] text-white/25">
                            {item.product.category}
                          </p>

                          <div className="mt-2 flex items-center gap-2 sm:hidden">

                            <span className="text-xs font-bold text-orange-400">
                              LKR{" "}
                              {item.product.price.toLocaleString(
                                "en-LK"
                              )}
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.product.id
                              )
                            }
                            className="mt-3 flex w-fit items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-red-400"
                          >
                            <Trash2 size={11} />

                            Remove
                          </button>

                        </div>

                      </div>


                      {/* =====================================
                          QUANTITY
                      ===================================== */}

                      <div className="flex items-center justify-between sm:justify-center">

                        <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/25 sm:hidden">
                          Quantity
                        </span>

                        <div className="flex h-9 border border-white/[0.09]">

                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            className="flex w-9 items-center justify-center text-white/35 transition-colors hover:text-orange-400"
                          >
                            <Minus size={12} />
                          </button>

                          <span className="flex w-9 items-center justify-center border-x border-white/[0.07] text-[10px] font-medium text-white/75">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="flex w-9 items-center justify-center text-white/35 transition-colors hover:text-orange-400"
                          >
                            <Plus size={12} />
                          </button>

                        </div>

                      </div>


                      {/* =====================================
                          TOTAL
                      ===================================== */}

                      <div className="hidden text-right sm:block">

                        <span className="text-sm font-bold text-orange-400">
                          LKR{" "}
                          {productTotal.toLocaleString(
                            "en-LK"
                          )}
                        </span>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>


            {/* Continue shopping */}

            <Link
              href="/shop"
              className="mt-6 flex w-fit items-center gap-2 text-[8px] font-bold uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-orange-400"
            >
              <ArrowLeft size={12} />

              Continue Shopping
            </Link>

          </div>


          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-24 lg:h-fit">

            <div className="border border-white/[0.08] bg-[#070c12]">

              {/* Summary header */}

              <div className="border-b border-white/[0.07] p-5 sm:p-6">

                <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-orange-400">
                  Order Summary
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Review your order
                </h2>

              </div>


              {/* Summary content */}

              <div className="p-5 sm:p-6">

                <div className="space-y-4">

                  <div className="flex items-center justify-between">

                    <span className="text-[10px] text-white/35">
                      Subtotal
                    </span>

                    <span className="text-xs font-semibold text-white/70">
                      LKR{" "}
                      {subtotal.toLocaleString(
                        "en-LK"
                      )}
                    </span>

                  </div>


                  <div className="flex items-center justify-between">

                    <span className="text-[10px] text-white/35">
                      Delivery
                    </span>

                    <span className="text-[9px] font-semibold uppercase tracking-wider text-orange-400">
                      Calculated at checkout
                    </span>

                  </div>

                </div>


                <div className="my-5 h-px bg-white/[0.07]" />


                {/* Total */}

                <div className="flex items-end justify-between">

                  <div>

                    <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/30">
                      Total
                    </p>

                    <p className="mt-1 text-[8px] text-white/20">
                      Before delivery
                    </p>

                  </div>

                  <span className="text-2xl font-bold tracking-tight text-orange-400">
                    LKR{" "}
                    {subtotal.toLocaleString(
                      "en-LK"
                    )}
                  </span>

                </div>


                {/* Checkout */}

                <Link
                  href="/checkout"
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-orange-500 text-[9px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-orange-400"
                >
                  Proceed to Checkout

                  <ArrowRight size={14} />
                </Link>


                {/* Delivery note */}

                <div className="mt-4 flex gap-3 border border-white/[0.07] bg-white/[0.015] p-3">

                  <Truck
                    size={15}
                    className="mt-0.5 shrink-0 text-orange-400"
                  />

                  <div>

                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/60">
                      Islandwide Delivery
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-white/25">
                      Delivery available across
                      Sri Lanka. Charges are
                      calculated based on your
                      delivery location.
                    </p>

                  </div>

                </div>


                {/* Secure shopping */}

                <div className="mt-3 flex items-center gap-2 text-[8px] text-white/20">

                  <ShieldCheck
                    size={12}
                    className="text-emerald-400/70"
                  />

                  Secure checkout experience

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}