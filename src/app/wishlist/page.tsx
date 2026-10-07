"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistPage() {
    const handleAddAllToCart = () => {
  items.forEach((product) => {
    addToCart(product, 1);
  });
};
  const {
    items,
    itemCount,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const handleAddToCart = (
    product: (typeof items)[number]
  ) => {
    addToCart(product, 1);
  };

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.10),transparent_45%)]" />

        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

        <div className="container-primezora relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-orange-500/20 bg-orange-500/[0.05]">
              <Heart
                size={20}
                className="text-orange-400"
              />
            </div>

            <p className="mt-5 text-[8px] font-bold uppercase tracking-[0.3em] text-orange-400">
              Primezora Technologies
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
              My Wishlist
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-xs leading-6 text-white/35 sm:text-sm">
              Keep the products you love in one place
              and come back whenever you&apos;re ready.
            </p>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {items.length === 0 && (
        <section className="container-primezora py-16 sm:py-24">
          <div className="mx-auto max-w-xl border border-white/[0.08] bg-[#080d13] px-6 py-14 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/[0.05]">
              <Heart
                size={24}
                className="text-orange-400/70"
              />
            </div>

            <p className="mt-7 text-[8px] font-bold uppercase tracking-[0.25em] text-orange-400">
              Your Wishlist
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Nothing saved yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-white/30">
              When you find something you like,
              tap the heart icon to save it here.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex h-11 items-center gap-2 bg-orange-500 px-6 text-[8px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
            >
              Explore Products
              <ShoppingCart size={13} />
            </Link>
          </div>
        </section>
      )}

      {/* Wishlist */}
      {items.length > 0 && (
        <section className="container-primezora py-10 sm:py-14">
          {/* Top controls */}
          <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                Saved Products
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {itemCount}{" "}
                {itemCount === 1
                  ? "Product"
                  : "Products"}
              </h2>
            </div>

            <button
              type="button"
              onClick={clearWishlist}
              className="inline-flex h-9 items-center gap-2 self-start border border-red-500/15 px-4 text-[8px] font-bold uppercase tracking-[0.14em] text-red-400/70 transition hover:border-red-500/30 hover:bg-red-500/[0.05] hover:text-red-400 sm:self-auto"
            >
              <Trash2 size={12} />
              Clear Wishlist
            </button>
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((product) => (
              <div
                key={product.id}
                className="relative"
              >
                <ProductCard
                  product={product}
                />
              </div>
            ))}
          </div>

          {/* Saved product actions */}
          <div className="mt-10 border border-white/[0.08] bg-[#080d13] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-orange-400">
                  Ready to Buy?
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Add your saved products to the cart
                </h3>

                <p className="mt-1 text-[9px] text-white/25">
                  Your wishlist stays saved on this
                  device.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {items.slice(0, 3).map(
                  (product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        handleAddToCart(
                          product
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 border border-white/[0.1] px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/60 transition hover:border-orange-500/30 hover:text-orange-400"
                    >
                      <ShoppingCart
                        size={11}
                      />
                      Add
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-orange-500 px-5 text-[8px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-orange-400"
                >
                  <ShoppingCart size={12} />
                  Add All to Cart
                </button>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30 transition hover:text-orange-400"
            >
              <ArrowLeft size={12} />
              Continue Shopping
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}