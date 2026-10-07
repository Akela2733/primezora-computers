"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Star,
} from "lucide-react";

import type { Product } from "@/types/product";
import { useWishlist } from "@/context/WishlistContext";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({
  product,
}: ProductCardProps) {
  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const wishlisted = isInWishlist(product.id);
  const stockQuantity =
    product.stockQuantity ?? product.stock ?? 0;
  const isPurchasable =
    product.inStock && stockQuantity > 0;

  const badgeStyle =
    product.badge === "NEW"
      ? "border-emerald-300/30 bg-emerald-500/80 text-[#041109]"
      : product.badge === "BEST SELLER"
        ? "border-sky-300/30 bg-sky-400/80 text-[#041016]"
        : product.badge === "SALE"
          ? "border-red-300/30 bg-red-600/85 text-white"
          : "border-amber-300/30 bg-amber-500/85 text-[#160c02]";

  const handleWishlist = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);
  };

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden border border-white/10 bg-[#060809] transition-colors duration-300 hover:border-amber-500/40"
    >
      {/* Product Image */}
      <div className="relative aspect-[1.03] overflow-hidden border-b border-white/[0.06] bg-[#080b0c]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(216,126,29,0.12),transparent_58%),linear-gradient(145deg,#111719,#070909_65%)]" />

        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-0"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 42vw, (max-width: 1023px) 30vw, 18vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 sm:p-5"
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-b from-black/10 via-transparent to-black/25" />

        {/* Badge */}
        {!isPurchasable ? (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/80 px-2 py-1 font-display text-[7px] font-bold uppercase tracking-[0.08em] text-white/60">
            OUT OF STOCK
          </span>
        ) : product.badge ? (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full border px-2 py-1 font-display text-[7px] font-bold uppercase tracking-[0.08em] ${badgeStyle}`}
          >
            {product.badge}
          </span>
        ) : null}

        {/* Wishlist */}
        <button
          type="button"
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          onClick={handleWishlist}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-all duration-200 ${
            wishlisted
              ? "border-orange-500/40 bg-orange-500/15 text-orange-400"
              : "border-white/15 bg-black/40 text-white/65 hover:border-orange-400/40 hover:text-orange-300"
          }`}
        >
          <Heart
            size={14}
            className={
              wishlisted
                ? "fill-orange-400 text-orange-400"
                : ""
            }
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <Link
          href={`/products/${product.slug}`}
          className="min-h-10 text-[11px] font-medium leading-[1.4] text-white/85 transition hover:text-amber-300 sm:text-xs"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <Star
                  key={star}
                  size={10}
                  className={
                    star <=
                    Math.round(
                      product.rating
                    )
                      ? "fill-amber-500 text-amber-500"
                      : "text-white/15"
                  }
                />
              )
            )}
          </div>

          <span className="text-[9px] text-white/40">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-xs font-bold text-[#e9932e] sm:text-sm">
            LKR{" "}
            {product.price.toLocaleString(
              "en-LK"
            )}
          </span>

          {product.oldPrice && (
            <span className="text-[9px] text-white/30 line-through">
              LKR{" "}
              {product.oldPrice.toLocaleString(
                "en-LK"
              )}
            </span>
          )}
        </div>

        <div className="mt-2">
          {isPurchasable ? (
            <span className="text-[8px] uppercase tracking-[0.12em] text-emerald-400/70">
              In Stock · {stockQuantity} available
            </span>
          ) : (
            <span className="text-[8px] uppercase tracking-[0.12em] text-red-400/70">
              Currently Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}