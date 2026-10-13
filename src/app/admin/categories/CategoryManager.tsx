"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

type ManagedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  productCount: number;
};

type CategoryForm = Pick<
  ManagedCategory,
  "name" | "slug" | "description" | "image"
>;

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
};

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: ManagedCategory[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const updateField = (field: keyof CategoryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleEdit = (category: ManagedCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/categories/${encodeURIComponent(editingId)}`
          : "/api/admin/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description,
            image: form.image,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save category.");
      }

      if (editingId) {
        setCategories((current) =>
          current.map((category) =>
            category.id === editingId
              ? {
                  ...category,
                  ...data.category,
                  description: data.category.description ?? "",
                  image: data.category.image ?? "",
                }
              : category
          )
        );
      } else {
        setCategories((current) => [
          ...current,
          {
            ...data.category,
            description: data.category.description ?? "",
            image: data.category.image ?? "",
            productCount: 0,
          },
        ].sort((left, right) => left.name.localeCompare(right.name)));
      }

      setNotice(editingId ? "Category updated." : "Category created.");
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save category."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = async (category: ManagedCategory) => {
    if (pendingId) return;
    setError("");
    setNotice("");
    setPendingId(category.id);

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !category.isActive }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update category.");
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? { ...item, isActive: data.category.isActive }
            : item
        )
      );
      setNotice(
        data.category.isActive
          ? "Category activated."
          : "Category deactivated and hidden from the storefront."
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to update category."
      );
    } finally {
      setPendingId(null);
    }
  };

  const deleteCategory = async (category: ManagedCategory) => {
    if (pendingId || isSaving) return;

    const confirmed = window.confirm(
      `Delete "${category.name}"? Categories with matching products cannot be deleted.`
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    setPendingId(category.id);

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete category.");
      }

      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );
      if (editingId === category.id) resetForm();
      setNotice(`Category "${category.name}" deleted.`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to delete category."
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`mb-6 border px-4 py-3 text-xs leading-5 ${
            error
              ? "border-red-500/20 bg-red-500/[0.06] text-red-300"
              : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
          }`}
        >
          {error || notice}
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
      <section className="h-fit border border-white/[0.07] bg-[#030505] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-amber-600/20 bg-amber-600/10 text-amber-600">
            {editingId ? <Edit2 size={16} /> : <Plus size={17} />}
          </div>
          <div>
            <h2 className="font-display text-sm font-bold uppercase">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>
            <p className="mt-1 text-[10px] text-white/35">
              Category details are stored in the database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field
            label="Name"
            value={form.name}
            maxLength={100}
            required
            onChange={(value) => {
              updateField("name", value);
              if (!editingId || !form.slug) {
                updateField("slug", slugify(value));
              }
            }}
          />
          <Field
            label="Slug"
            value={form.slug}
            maxLength={100}
            required
            onChange={(value) => updateField("slug", slugify(value))}
          />
          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">
              Description
            </span>
            <textarea
              value={form.description}
              maxLength={1000}
              rows={3}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="w-full resize-y border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs text-white/85 outline-none focus:border-amber-600/50"
            />
          </label>
          <ImageUpload
            label="Category Image (optional)"
            value={form.image}
            onChange={(value) => updateField("image", value)}
            allowUrlEntry={false}
            uploadScope="categories"
            previewDescription="Shown on category cards in the storefront."
          />

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 bg-amber-600 px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60"
            >
              <Check size={14} />
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Category"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-2 border border-white/10 px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55 transition hover:border-white/20 hover:text-white/90"
              >
                <X size={13} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="border border-white/[0.07] bg-[#030505]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-bold uppercase">
              All Categories
            </h2>
            <p className="mt-1 text-[10px] text-white/35">
              {categories.length} categories ·{" "}
              {categories.filter((category) => category.isActive).length} active
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.12em] text-white/65">
              No categories yet
            </p>
            <p className="mt-2 text-xs leading-5 text-white/35">
              Add the first category to make it available in the storefront.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xs font-bold uppercase text-white/85">
                      {category.name}
                    </h3>
                    <span
                      className={`border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${
                        category.isActive
                          ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300"
                          : "border-white/10 text-white/35"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-white/35">
                    /categories/{category.slug}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {category.productCount} matching products
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    disabled={pendingId !== null || isSaving}
                    className="h-8 border border-white/[0.08] px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/55 transition hover:border-amber-600/40 hover:text-amber-500 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    disabled={pendingId !== null || isSaving}
                    className={`h-8 border px-3 text-[8px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50 ${
                      category.isActive
                        ? "border-amber-600/20 text-amber-500 hover:border-amber-600/50"
                        : "border-emerald-500/20 text-emerald-300 hover:border-emerald-500/50"
                    }`}
                  >
                    {pendingId === category.id
                      ? "Updating..."
                      : category.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={pendingId !== null || isSaving}
                    className="inline-flex h-8 items-center gap-1.5 border border-red-500/20 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-red-300 transition hover:border-red-500/45 hover:bg-red-500/[0.06] disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {pendingId === category.id ? "Working..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  maxLength,
  required = false,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">
        {label}
      </span>
      <input
        value={value}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full border border-white/10 bg-white/[0.025] px-3 text-xs text-white/85 outline-none placeholder:text-white/20 focus:border-amber-600/50"
      />
    </label>
  );
}
