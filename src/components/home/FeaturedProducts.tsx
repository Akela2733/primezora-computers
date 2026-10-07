"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { products } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";

const featuredIds = [
  "gaming-keyboard",
  "gaming-headset",
  "rtx-4060",
  "ryzen-5-7600",
  "corsair-vengeance-32gb",
  "gaming-mouse",
];

export function FeaturedProducts() {
  const trackRef = useRef<HTMLDivElement>(null);
  const featuredProducts = featuredIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product) => product !== undefined);

  return (
    <section className="relative overflow-hidden border-y border-amber-500/10 bg-[#040607] py-10 sm:py-12">
      <div className="container-primezora relative">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.24em] text-white/45">
              Featured Products
            </p>
            <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-none text-white sm:text-[34px]">
              Top Picks
            </h2>
          </div>
          <Link
            href="/shop"
            className="group mb-1 inline-flex items-center gap-2 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:text-amber-300"
          >
            View all products
            <ArrowRight size={13} className="text-amber-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_24px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_32px]">
          <div ref={trackRef} className="featured-products-track">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Show more featured products"
            onClick={() =>
              trackRef.current?.scrollBy({
                left: trackRef.current.clientWidth,
                behavior: "smooth",
              })
            }
            className="flex h-10 w-6 items-center justify-center text-amber-500 transition hover:text-amber-300 sm:w-8"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
