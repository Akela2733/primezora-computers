"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Image as ImageIcon,
  Package,
  Save,
  Star,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

type ProductForm = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  price: string;
  oldPrice: string;
  image: string;
  badge: string;
  stockQuantity: string;
  featured: boolean;
  inStock: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  brand: "",
  category: "",
  description: "",
  price: "",
  oldPrice: "",
  image: "",
  badge: "",
  stockQuantity: "0",
  featured: false,
  inStock: false,
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id as string;

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/products/${productId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load product."
          );
        }

        const product = data.product ?? data;

        setForm({
          name: product.name ?? "",
          slug: product.slug ?? "",
          brand: product.brand ?? "",
          category: product.category ?? "",
          description: product.description ?? "",
          price: String(product.price ?? ""),
          oldPrice:
            product.oldPrice !== null &&
            product.oldPrice !== undefined
              ? String(product.oldPrice)
              : "",
          image: product.image ?? "",
          badge: product.badge ?? "",
          stockQuantity: String(
            product.stockQuantity ?? 0
          ),
          featured: Boolean(product.featured),
          inStock: Boolean(product.inStock),
        });
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const updateField = (
    field: keyof ProductForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Product slug is required.");
      return;
    }

    if (!form.brand.trim()) {
      setError("Brand is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!form.image.trim()) {
      setError("Product image URL is required.");
      return;
    }

    const price = Number(form.price);
    const oldPrice = form.oldPrice.trim()
      ? Number(form.oldPrice)
      : null;
    const stockQuantity = Number(
      form.stockQuantity
    );

    if (!Number.isInteger(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      oldPrice !== null &&
      (!Number.isInteger(oldPrice) || oldPrice < 0)
    ) {
      setError("Old price must be a non-negative integer.");
      return;
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            brand: form.brand,
            category: form.category,
            description: form.description,
            price,
            oldPrice,
            image: form.image,
            badge: form.badge,
            stockQuantity,
            featured: form.featured,
            inStock: form.inStock,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update product."
        );
      }

      router.push("/admin/products?notice=updated");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product."
      );

      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05090f] text-white">
        <div className="container-primezora py-20">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-orange-400">
            Loading Product...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05090f] text-white">

      {/* Header */}

      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Products
          </Link>

          <div className="mt-7">

            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
              Product Management
            </p>

            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              Edit Product
            </h1>

            <p className="mt-2 text-sm text-white/35">
              Update product information and inventory.
            </p>

          </div>

        </div>
      </section>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="container-primezora py-10"
      >

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* MAIN */}

          <div className="space-y-6">

            {/* Basic Information */}

            <section className="border border-white/[0.07] bg-[#080d13]">

              <div className="border-b border-white/[0.06] p-5 sm:p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
                    <Package size={16} />
                  </div>

                  <div>

                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                      Product
                    </p>

                    <h2 className="mt-1 font-display text-sm font-bold uppercase">
                      Basic Information
                    </h2>

                  </div>

                </div>

              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

                <Field
                  label="Product Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField("name", value)
                  }
                />

                <Field
                  label="Slug"
                  required
                  value={form.slug}
                  onChange={(value) =>
                    updateField("slug", value)
                  }
                />

                <Field
                  label="Brand"
                  required
                  value={form.brand}
                  onChange={(value) =>
                    updateField("brand", value)
                  }
                />

                <Field
                  label="Category"
                  required
                  value={form.category}
                  onChange={(value) =>
                    updateField("category", value)
                  }
                />

                <div className="sm:col-span-2">

                  <label className="block">

                    <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                      Description
                    </span>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                      rows={6}
                      className="w-full resize-none border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/15 focus:border-orange-500/50"
                    />

                  </label>

                </div>

              </div>

            </section>

            {/* Pricing */}

            <section className="border border-white/[0.07] bg-[#080d13]">

              <div className="border-b border-white/[0.06] p-5 sm:p-6">

                <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                  Pricing
                </p>

                <h2 className="mt-1 font-display text-sm font-bold uppercase">
                  Product Pricing
                </h2>

              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

                <Field
                  label="Price (LKR)"
                  required
                  type="number"
                  value={form.price}
                  onChange={(value) =>
                    updateField("price", value)
                  }
                />

                <Field
                  label="Old Price (LKR)"
                  type="number"
                  value={form.oldPrice}
                  onChange={(value) =>
                    updateField("oldPrice", value)
                  }
                />

                <Field
                  label="Badge"
                  value={form.badge}
                  onChange={(value) =>
                    updateField("badge", value)
                  }
                />

                <Field
                  label="Stock Quantity"
                  required
                  type="number"
                  value={form.stockQuantity}
                  onChange={(value) =>
                    updateField(
                      "stockQuantity",
                      value
                    )
                  }
                />

              </div>

            </section>

            {/* Image */}

            <section className="border border-white/[0.07] bg-[#080d13]">

              <div className="border-b border-white/[0.06] p-5 sm:p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
                    <ImageIcon size={16} />
                  </div>

                  <div>

                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                      Media
                    </p>

                    <h2 className="mt-1 font-display text-sm font-bold uppercase">
                      Product Image
                    </h2>

                  </div>

                </div>

              </div>

              <div className="p-5 sm:p-6">
                <ImageUpload
                  value={form.image}
                  onChange={(value) => updateField("image", value)}
                  required
                />
              </div>

            </section>

          </div>

          {/* SIDEBAR */}

          <aside className="lg:sticky lg:top-24 lg:h-fit">

            <section className="border border-white/[0.07] bg-[#080d13]">

              <div className="border-b border-white/[0.06] p-5">

                <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                  Settings
                </p>

                <h2 className="mt-1 font-display text-sm font-bold uppercase">
                  Product Status
                </h2>

              </div>

              <div className="space-y-5 p-5">

                {/* Featured */}

                <label className="flex cursor-pointer items-center justify-between gap-4 border border-white/[0.07] p-4">

                  <div className="flex items-center gap-3">

                    <Star
                      size={16}
                      className="text-orange-400"
                    />

                    <div>

                      <p className="text-xs font-semibold text-white/70">
                        Featured Product
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-white/30">
                        Show this product in featured
                        sections.
                      </p>

                    </div>

                  </div>

                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField(
                        "featured",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-orange-500"
                  />

                </label>

                {/* Stock */}

                <label className="flex cursor-pointer items-center justify-between gap-4 border border-white/[0.07] p-4">

                  <div>

                    <p className="text-xs font-semibold text-white/70">
                      Available for Sale
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-white/30">
                      Customers can purchase this
                      product.
                    </p>

                  </div>

                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(event) =>
                      updateField(
                        "inStock",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-orange-500"
                  />

                </label>

                {error && (
                  <div className="border border-red-500/20 bg-red-500/[0.06] p-4 text-xs leading-6 text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex h-13 w-full items-center justify-center gap-2 bg-orange-500 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Save size={15} />

                  {isSaving
                    ? "Saving Changes..."
                    : "Save Changes"}

                </button>

                <Link
                  href="/admin/products"
                  className="flex h-12 items-center justify-center border border-white/[0.08] text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </Link>

              </div>

            </section>

          </aside>

        </div>

      </form>

    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">

        {label}

        {required && (
          <span className="ml-1 text-orange-400">
            *
          </span>
        )}

      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/15 focus:border-orange-500/50"
      />

    </label>
  );
}