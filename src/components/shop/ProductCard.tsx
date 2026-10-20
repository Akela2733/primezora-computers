"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Heart,
  Star,
} from "lucide-react";
import { useState } from "react";

import type { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

type ProductCardProps = {
  product: Product;
  showAddToCart?: boolean;
};

export function ProductCard({
  product,
  showAddToCart = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const wishlisted = isInWishlist(product.id);
  const [cartMessage, setCartMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const stockQuantity =
    product.stockQuantity ?? product.stock ?? 0;
  const isPurchasable =
    product.inStock && stockQuantity > 0;

  const badgeStyle =
    product.badge === "NEW"
      ? "border-emerald-300/30 bg-emerald-500/80 text-[#030505]"
      : product.badge === "BEST SELLER"
        ? "border-amber-600/30 bg-amber-600/80 text-[#030505]"
        : product.badge === "SALE"
          ? "border-red-300/30 bg-red-600/85 text-white/90"
          : "border-amber-600/30 bg-amber-600/85 text-[#030505]";

  const handleWishlist = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);
  };

  const handleAddToCart = async () => {
    setCartMessage("");
    setIsAdding(true);
    try {
      const result = await addToCart(product, 1);
      setCartMessage(
        result === "added"
          ? "Added to cart"
          : result === "unavailable"
            ? "No longer available"
            : "Please try again"
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-white/10 bg-[#050707] transition-colors duration-300 hover:border-amber-600/50"
    >
      {/* Product Image */}
      <div
        className={`relative overflow-hidden border-b border-white/[0.06] bg-[#030505] ${
          showAddToCart ? "aspect-[1.18]" : "aspect-[1.03]"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(217,119,6,0.12),transparent_58%),linear-gradient(145deg,#030505,#070909_65%)]" />

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
          <span className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-[#030505]/80 px-2 py-1 font-display text-[7px] font-bold uppercase tracking-[0.08em] text-white/60">
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
              ? "border-amber-600/40 bg-amber-600/15 text-amber-600"
              : "border-white/15 bg-[#030505]/40 text-white/65 hover:border-amber-600/40 hover:text-amber-600"
          }`}
        >
          <Heart
            size={14}
            className={
              wishlisted
                ? "fill-amber-600 text-amber-600"
                : ""
            }
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <Link
          href={`/products/${product.slug}`}
          className="min-h-10 text-[11px] font-medium leading-[1.4] text-white/85 transition hover:text-amber-600 sm:text-xs"
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
                      ? "fill-amber-600 text-amber-600"
                      : "text-white/15"
                  }
                />
              )
            )}
          </div>

          <span className="text-[9px] text-white/40">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[9px] text-white/40">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-xs font-bold text-amber-600 sm:text-sm">
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
        {showAddToCart && (
          <div className="mt-3">
            <button
              type="button"
              disabled={!isPurchasable || isAdding}
              onClick={handleAddToCart}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-orange-500 px-2 font-display text-[8px] font-bold uppercase tracking-[0.1em] text-[#090909] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cartMessage === "Added to cart" && <Check size={12} />}
              {isAdding ? "Adding..." : cartMessage || "Add to cart"}
            </button>
            {cartMessage && cartMessage !== "Added to cart" && (
              <p role="status" className="mt-1 text-center text-[9px] text-red-400">
                {cartMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}