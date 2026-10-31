"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/types/product";

function isPurchasable(product: Product): boolean {
  return product.inStock && (product.stockQuantity ?? product.stock ?? 0) > 0;
}

function formatPrice(price: number): string {
  return `LKR ${price.toLocaleString("en-LK")}`;
}

export default function WishlistPage() {
  const {
    items,
    itemCount,
    availabilityStatus,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();
  const { addToCart } = useCart();
  const [search, setSearch] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const catalogProducts = useMemo(
    () =>
      availabilityStatus === "current"
        ? items
        : [],
    [availabilityStatus, items]
  );
  const catalogSubtotal = useMemo(
    () => catalogProducts.reduce((total, product) => total + product.price, 0),
    [catalogProducts]
  );
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalogProducts;

    return catalogProducts.filter((product) =>
      [product.name, product.brand, product.category].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [catalogProducts, search]);

  const handleAddToCart = async (product: Product) => {
    setNotice("");
    setError("");
    setBusyProductId(product.id);

    try {
      const result = await addToCart(product, 1);
      if (result === "added") {
        removeFromWishlist(product.id);
        setNotice(`${product.name} was added to your cart.`);
      } else if (result === "unavailable") {
        removeFromWishlist(product.id);
        setError(`${product.name} is no longer available in the catalog.`);
      } else {
        setError(
          `We couldn't confirm ${product.name} is still in the catalog. It remains in your wishlist.`
        );
      }
    } finally {
      setBusyProductId(null);
    }
  };

  const handleAddAvailableToCart = async () => {
    if (addingAll || catalogProducts.length === 0) return;

    setNotice("");
    setError("");
    setAddingAll(true);
    let addedCount = 0;
    let unavailableCount = 0;
    let failedCount = 0;
    const addedProductIds: string[] = [];

    try {
      for (const product of catalogProducts) {
        const result = await addToCart(product, 1);
        if (result === "added") {
          addedCount += 1;
          addedProductIds.push(product.id);
        } else if (result === "unavailable") {
          unavailableCount += 1;
          removeFromWishlist(product.id);
        }
        else failedCount += 1;
      }

      for (const productId of addedProductIds) {
        removeFromWishlist(productId);
      }

      if (addedCount > 0) {
        setNotice(
          `${addedCount} ${addedCount === 1 ? "item was" : "items were"} added to your cart.`
        );
      }
      if (unavailableCount > 0 || failedCount > 0) {
        setError(
          [
            unavailableCount > 0
              ? `${unavailableCount} item${unavailableCount === 1 ? "" : "s"} became unavailable.`
              : "",
            failedCount > 0
              ? `Couldn't confirm ${failedCount} item${failedCount === 1 ? "" : "s"} are still in the catalog; they remain in your wishlist.`
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        );
      }
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="relative overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_-35%,rgba(217,119,6,0.17),transparent_65%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
        <div className="container-primezora relative py-12 sm:py-16">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-amber-500"
          >
            <ArrowRight size={14} className="rotate-180" />
            Continue shopping
          </Link>

          <div className="mt-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-500">
                <Heart size={13} className="fill-amber-500/20" />
                Your saved picks
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Wishlist
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                Keep the products you&apos;re considering in one place. Stock and
                prices are kept up to date as you browse.
              </p>
            </div>

            {itemCount > 0 && (
              <div className="flex items-center gap-3 self-start rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:self-auto">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Heart size={17} />
                </span>
                <span>
                  <span className="block text-lg font-semibold leading-none text-white">
                    {itemCount}
                  </span>
                  <span className="mt-1 block text-[10px] text-white/40">
                    saved {itemCount === 1 ? "product" : "products"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {availabilityStatus !== "current" ? (
        <section className="container-primezora py-16 sm:py-24">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] text-amber-500">
              <Heart size={25} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              {availabilityStatus === "checking"
                ? "Loading your wishlist"
                : "Wishlist temporarily unavailable"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              {availabilityStatus === "checking"
                ? "Checking your saved products against the current catalog."
                : "We couldn't reach the product catalog. Your saved items are kept safe and will be checked again automatically."}
            </p>
          </div>
        </section>
      ) : itemCount === 0 ? (
        <section className="container-primezora py-16 sm:py-24">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
            {notice && (
              <p
                className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300"
                role="status"
              >
                {notice}
              </p>
            )}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] text-amber-500">
              <Heart size={25} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              Your wishlist is ready for a favorite
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              Save products using the heart button while browsing, then come
              back here when you&apos;re ready.
            </p>
            <Link
              href="/shop"
              className="primezora-button mt-7"
            >
              <span>Explore products</span>
              <span className="primezora-button__icon"><ArrowRight size={13} /></span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="container-primezora py-8 sm:py-12">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Saved products
                  </h2>
                  <p className="mt-1 text-xs text-white/40">
                    {catalogProducts.length} saved products are in the catalog
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {catalogProducts.length > 1 && (
                    <button
                      type="button"
                      onClick={clearWishlist}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs text-white/55 transition hover:border-red-400/30 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                      Clear wishlist
                    </button>
                  )}
                </div>
              </div>

              {itemCount > 3 && (
                <label className="mb-4 flex h-11 items-center gap-3 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3 text-white/35 focus-within:border-amber-500/40">
                  <Search size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a saved product..."
                    aria-label="Find a saved product"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="text-white/35 transition hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </label>
              )}

              {notice && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300" role="status">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {notice}
                </div>
              )}
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-200" role="alert">
                  <X size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {filteredItems.length > 0 ? (
                <ul className="space-y-3">
                  {filteredItems.map((product) => {
                    const purchasable = isPurchasable(product);
                    const stockQuantity =
                      product.stockQuantity ?? product.stock ?? 0;
                    const busy = busyProductId === product.id || addingAll;

                    return (
                      <li
                        key={product.id}
                        className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 transition hover:border-white/[0.14] sm:p-4"
                      >
                        <div className="flex gap-4">
                          <Link
                            href={`/products/${product.slug}`}
                            aria-label={`View ${product.name}`}
                            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-white/[0.07] bg-[#080b0b] sm:h-36 sm:w-36"
                          >
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="(max-width: 639px) 112px, 144px"
                              className="object-contain p-3 transition duration-300 group-hover:scale-105"
                            />
                          </Link>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500">
                                  {product.brand}
                                </p>
                                <Link
                                  href={`/products/${product.slug}`}
                                  className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-white transition hover:text-amber-400 sm:text-base"
                                >
                                  {product.name}
                                </Link>
                                <p className="mt-1 text-xs text-white/40">
                                  {product.category}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNotice("");
                                  setError("");
                                  removeFromWishlist(product.id);
                                }}
                                aria-label={`Remove ${product.name} from wishlist`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-red-400/[0.08] hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                              <div>
                                <p className="text-base font-semibold text-amber-400">
                                  {formatPrice(product.price)}
                                </p>
                                {purchasable ? (
                                  <p className="mt-1 text-[11px] text-emerald-300/80">
                                    {stockQuantity} in stock
                                  </p>
                                ) : (
                                  <p className="mt-1 text-[11px] text-red-300/80">
                                    In catalog · unavailable for purchase
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => void handleAddToCart(product)}
                                disabled={busy}
                                className="primezora-button min-h-10 px-3 sm:px-4"
                              >
                                {busy ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <span>Add to cart</span>
                                )}
                                {!busy && <span className="primezora-button__icon"><ArrowRight size={13} /></span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-12 text-center">
                  <Search size={22} className="mx-auto text-white/30" />
                  <p className="mt-3 text-sm font-medium text-white/75">
                    No saved products match “{search}”
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-3 text-xs font-medium text-amber-400 hover:text-amber-300"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <ShoppingBag size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Ready when you are
                    </h2>
                    <p className="mt-1 text-xs text-white/40">
                      {catalogProducts.length} in the catalog
                    </p>
                  </div>
                </div>

                <div className="my-5 border-t border-white/[0.07]" />

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">
                    Catalog items
                  </span>
                  <span className="font-medium text-white">
                    {catalogProducts.length}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Estimated value</span>
                  <span className="font-semibold text-amber-400">
                    {formatPrice(catalogSubtotal)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/35">
                  One of each product. Current product details are confirmed
                  when added to your cart.
                </p>

                <button
                  type="button"
                  onClick={() => void handleAddAvailableToCart()}
                  disabled={catalogProducts.length === 0 || addingAll}
                  className="primezora-button mt-5 w-full"
                >
                  {addingAll ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Adding products...
                    </>
                  ) : (
                    <>
                      <span>Add to cart</span>
                      <span className="primezora-button__icon"><ArrowRight size={13} /></span>
                    </>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="primezora-button mt-3 w-full"
                >
                  <span>View cart</span>
                  <span className="primezora-button__icon"><ArrowRight size={13} /></span>
                </Link>

                <div className="mt-5 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-white/40">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  Products are confirmed against the database when added.
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-8 flex justify-center sm:justify-start">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-amber-400"
            >
              <ArrowRight size={15} className="rotate-180" />
              Keep browsing products
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
