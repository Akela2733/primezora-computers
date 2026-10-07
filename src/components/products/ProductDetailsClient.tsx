"use client";

import ProductGallery from "@/components/shop/ProductGallery";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/context/WishlistContext";

import type { Product } from "@/types/product";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";

type ProductDetailsClientProps = {
  product: Product;
  relatedProducts: Product[];
};

export default function ProductDetailsClient({
  product,
  relatedProducts,
}: ProductDetailsClientProps) {
  const [quantity, setQuantity] = useState(1);
const {
  toggleWishlist,
  isInWishlist,
} = useWishlist();

const isWishlisted = isInWishlist(
  product.id
);
  const { addToCart } = useCart();

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) /
            product.oldPrice) *
            100
        )
      : null;

  const stockQuantity =
    product.stockQuantity ?? product.stock ?? 0;
  const isPurchasable =
    product.inStock && stockQuantity > 0;

  const increaseQuantity = () => {
    setQuantity((current) =>
      Math.min(stockQuantity, current + 1)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  };

  return (
    <main className="min-h-screen bg-[#05090f] text-white">

      {/* =====================================================
          BREADCRUMB + PRODUCT
      ===================================================== */}

      <section className="container-primezora py-7 sm:py-10 lg:py-14">

        {/* Breadcrumb */}

        <div className="mb-8 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/30">

          <Link
            href="/"
            className="transition-colors hover:text-orange-400"
          >
            Home
          </Link>

          <ChevronRight size={11} />

          <Link
            href="/shop"
            className="transition-colors hover:text-orange-400"
          >
            Shop
          </Link>

          <ChevronRight size={11} />

          <Link
            href={`/shop?category=${encodeURIComponent(
              product.category
            )}`}
            className="transition-colors hover:text-orange-400"
          >
            {product.category}
          </Link>

          <ChevronRight size={11} />

          <span className="max-w-[220px] truncate text-orange-400/70">
            {product.name}
          </span>

        </div>


        {/* =====================================================
            PRODUCT GRID
        ===================================================== */}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">

          {/* =================================================
              LEFT - PRODUCT GALLERY
          ================================================= */}

          <div>
            <ProductGallery
              image={product.image}
              images={product.images ?? []}
              productName={product.name}
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-[0.2em] text-white/20">
                Primezora Technologies
              </span>

              <span className="text-[8px] uppercase tracking-[0.2em] text-white/20">
                {product.category}
              </span>
            </div>
          </div>


          {/* =================================================
              RIGHT - PRODUCT INFORMATION
          ================================================= */}

          <div className="flex flex-col">

            {/* Brand */}

            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-orange-400">
              {product.brand}
            </p>


            {/* Product name */}

            <h1 className="mt-3 max-w-xl text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl xl:text-[42px]">
              {product.name}
            </h1>


            {/* Rating */}

            <div className="mt-5 flex flex-wrap items-center gap-3">

              <div className="flex items-center gap-1">

                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={13}
                    className={
                      star <=
                      Math.round(product.rating)
                        ? "fill-orange-400 text-orange-400"
                        : "text-white/15"
                    }
                  />
                ))}

              </div>

              <span className="text-[10px] font-medium text-white/60">
                {product.rating}
              </span>

              <span className="h-3 w-px bg-white/10" />

              <span className="text-[10px] text-white/35">
                {product.reviews} Reviews
              </span>

            </div>


            {/* Divider */}

            <div className="my-6 h-px bg-white/[0.07]" />


            {/* Price */}

            <div className="flex flex-wrap items-center gap-3">

              <span className="text-3xl font-bold tracking-tight text-orange-400 sm:text-[34px]">
                LKR{" "}
                {product.price.toLocaleString(
                  "en-LK"
                )}
              </span>

              {product.oldPrice && (
                <span className="text-sm text-white/25 line-through">
                  LKR{" "}
                  {product.oldPrice.toLocaleString(
                    "en-LK"
                  )}
                </span>
              )}

              {discount && (
                <span className="border border-red-500/20 bg-red-500/[0.06] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-red-400">
                  -{discount}%
                </span>
              )}

            </div>


            {/* Stock */}

            <div className="mt-4 flex items-center gap-2">

              <span
                className={`h-2 w-2 rounded-full ${
                  isPurchasable
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
              />

              <span
                className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                  isPurchasable
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {isPurchasable
                  ? "In Stock — Ready to Ship"
                  : stockQuantity <= 0
                    ? "Currently Out of Stock"
                    : "Unavailable"}
              </span>

            </div>

            {product.sku && (
              <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-white/25">
              <span>SKU</span>

              <span className="text-white/50">
                {product.sku}
              </span>
              </div>
            )}


            {/* Description */}

            <p className="mt-6 max-w-xl text-[12px] leading-6 text-white/40">
              {product.description}
            </p>

            {product.shortDescription && (
              <p className="mt-3 text-[10px] text-white/25">
                {product.shortDescription}
              </p>
            )}


            {/* =================================================
                PURCHASE AREA
            ================================================= */}

            {isPurchasable && (
              <div className="mt-7">

                <div className="flex gap-2">

                  {/* Quantity */}

                  <div className="flex h-12 shrink-0 border border-white/[0.1] bg-white/[0.015]">

                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={decreaseQuantity}
                      className="flex w-10 items-center justify-center text-white/40 transition-colors hover:text-orange-400"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="flex w-10 items-center justify-center border-x border-white/[0.08] text-xs font-medium text-white/80">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={increaseQuantity}
                      className="flex w-10 items-center justify-center text-white/40 transition-colors hover:text-orange-400"
                    >
                      <Plus size={14} />
                    </button>

                  </div>


                  {/* Add to cart */}

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, quantity);
                    }}
                    disabled={
                      !isPurchasable ||
                      quantity > stockQuantity
                    }
                    className="flex h-12 flex-1 items-center justify-center gap-2 bg-orange-500 px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  >
                    <ShoppingCart size={14} />

                    Add to Cart
                  </button>
                </div>


                {/* Wishlist */}

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`flex h-12 w-12 items-center justify-center border transition ${
                    isWishlisted
                      ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-orange-500/30 hover:text-orange-400"
                  }`}
                >
                  <Heart
                    size={18}
                    className={
                      isWishlisted
                        ? "fill-orange-400 text-orange-400"
                        : ""
                    }
                  />

                  {isWishlisted
                    ? "Added to Wishlist"
                    : "Add to Wishlist"}
                </button>

              </div>
            )}


            {/* =================================================
                SERVICE BENEFITS
            ================================================= */}

            <div className="mt-8 grid grid-cols-1 border border-white/[0.07] bg-white/[0.02] sm:grid-cols-3">

              <ServiceFeature
                icon={<Truck size={16} />}
                title="Islandwide Delivery"
                description="Fast & reliable delivery"
              />

              <ServiceFeature
                icon={<ShieldCheck size={16} />}
                title="Genuine Products"
                description="Trusted technology brands"
              />

              <ServiceFeature
                icon={<RotateCcw size={16} />}
                title="Easy Support"
                description="We're here to help"
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

      <section className="border-y border-white/[0.07] bg-[#060a0f]">

        <div className="container-primezora py-12 sm:py-16">

          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">

            {/* Left */}

            <div>

              <p className="text-[8px] uppercase tracking-[0.28em] text-orange-400">
                Product information
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Built for your setup.
              </h2>

              <p className="mt-4 max-w-md text-xs leading-6 text-white/35">
                Everything you need to know about
                this product before adding it to
                your Primezora setup.
              </p>

            </div>


            {/* Specifications */}

            <div className="border border-white/[0.07]">

              {product.sku && (
                <Specification
                  label="SKU"
                  value={product.sku}
                />
              )}

              <Specification
                label="Brand"
                value={product.brand}
              />

              <Specification
                label="Category"
                value={product.category}
              />

              {product.subcategory && (
                <Specification
                  label="Subcategory"
                  value={product.subcategory}
                />
              )}

              {(product.specifications ?? []).map(
                (specification, index) => (
                  <Specification
                    key={`${specification.label}-${index}`}
                    label={specification.label}
                    value={specification.value}
                  />
                )
              )}

              <Specification
                label="Rating"
                value={`${product.rating} / 5`}
              />

              <Specification
                label="Reviews"
                value={`${product.reviews} customer reviews`}
              />

              <Specification
                label="Availability"
                value={
                  stockQuantity <= 0
                    ? "Out of Stock"
                    : product.inStock
                      ? `${stockQuantity} units available`
                      : "Disabled"
                }
                last
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          TRUST STRIP
      ===================================================== */}

      <section className="container-primezora py-10 sm:py-14">

        <div className="grid grid-cols-2 border border-white/[0.07] sm:grid-cols-4">

          <TrustItem
            icon={<Truck size={17} />}
            title="Islandwide Delivery"
            text="We deliver across Sri Lanka"
          />

          <TrustItem
            icon={<ShieldCheck size={17} />}
            title="Genuine Products"
            text="Trusted brands only"
          />

          <TrustItem
            icon={<Check size={17} />}
            title="Secure Shopping"
            text="Safe checkout experience"
          />

          <TrustItem
            icon={<RotateCcw size={17} />}
            title="Customer Support"
            text="We're here when you need us"
          />

        </div>

      </section>


      {/* =====================================================
          RELATED PRODUCTS
      ===================================================== */}

      {relatedProducts.length > 0 && (
        <section className="border-t border-white/[0.07]">

          <div className="container-primezora py-14 sm:py-20">

            <div className="mb-8 flex items-end justify-between">

              <div>

                <p className="text-[8px] uppercase tracking-[0.28em] text-orange-400">
                  Explore more
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  You May Also Like
                </h2>

              </div>

              <Link
                href="/shop"
                className="hidden items-center gap-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-orange-400 sm:flex"
              >
                View All Products

                <ChevronRight size={12} />
              </Link>

            </div>


            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              {relatedProducts.map(
                (relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                )
              )}

            </div>

          </div>

        </section>
      )}

    </main>
  );
}


/* ============================================================
   SERVICE FEATURE
============================================================ */

function ServiceFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/[0.07] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">

      <div className="text-orange-400">
        {icon}
      </div>

      <p className="mt-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/65">
        {title}
      </p>

      <p className="mt-1 text-[8px] leading-4 text-white/25">
        {description}
      </p>

    </div>
  );
}


/* ============================================================
   SPECIFICATION
============================================================ */

function Specification({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-6 px-5 py-4 ${
        !last
          ? "border-b border-white/[0.07]"
          : ""
      }`}
    >

      <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">
        {label}
      </span>

      <span className="text-right text-[10px] font-medium text-white/65">
        {value}
      </span>

    </div>
  );
}


/* ============================================================
   TRUST ITEM
============================================================ */

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-b border-white/[0.07] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">

      <div className="text-orange-400">
        {icon}
      </div>

      <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.1em] text-white/70">
        {title}
      </p>

      <p className="mt-1 text-[8px] leading-4 text-white/25">
        {text}
      </p>

    </div>
  );
}