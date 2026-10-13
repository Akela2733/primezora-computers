"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type ProductCategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export default function ProductCategorySelect({
  value,
  onChange,
  required = false,
}: ProductCategorySelectProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/categories", {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load categories.");
        }
        if (!Array.isArray(data.categories)) {
          throw new Error("The category list response is invalid.");
        }
        setCategories(data.categories);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to load categories."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadCategories();
    return () => controller.abort();
  }, [reloadKey]);

  const activeCategories = categories.filter((category) => category.isActive);
  const currentCategory = categories.find(
    (category) =>
      !category.isActive &&
      category.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()
  );

  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
        Category
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || Boolean(error)}
        className="h-13 w-full border border-white/[0.08] bg-[#030505] px-4 text-sm text-white/90 outline-none focus:border-amber-600/50 disabled:cursor-wait disabled:opacity-60"
      >
        <option value="">
          {isLoading
            ? "Loading categories..."
            : activeCategories.length > 0
              ? "Select a category"
              : "No active categories"}
        </option>
        {currentCategory && (
          <option value={currentCategory.name} disabled>
            {currentCategory.name} (inactive — select an active category)
          </option>
        )}
        {activeCategories.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="mt-2 block text-[10px] text-red-300">
          {error}{" "}
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="underline underline-offset-2"
          >
            Retry
          </button>
        </span>
      ) : !isLoading && activeCategories.length === 0 ? (
        <span className="mt-2 block text-[10px] text-amber-300/80">
          Create or activate a category before adding a product.{" "}
          <Link
            href="/admin/categories"
            className="underline underline-offset-2"
          >
            Manage categories
          </Link>
        </span>
      ) : null}
    </label>
  );
}
