import { INPUT_LIMITS } from "@/lib/input-limits";

export type CategoryInput = {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
};

type CategoryValidation =
  | { success: true; data: CategoryInput }
  | { success: false; error: string };

type PartialCategoryValidation =
  | { success: true; data: Partial<CategoryInput> }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalText(
  value: unknown,
  label: string,
  maximum: number
): { success: true; value: string | null } | { success: false; error: string } {
  if (value === undefined || value === null) {
    return { success: true, value: null };
  }
  if (typeof value !== "string") {
    return { success: false, error: `${label} must be text.` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    return {
      success: false,
      error: `${label} must be ${maximum} characters or fewer.`,
    };
  }
  return { success: true, value: trimmed || null };
}

export function validateCategoryInput(
  value: unknown
): CategoryValidation;
export function validateCategoryInput(
  value: unknown,
  options: { partial: true }
): PartialCategoryValidation;
export function validateCategoryInput(
  value: unknown,
  options: { partial?: boolean } = {}
): CategoryValidation | PartialCategoryValidation {
  if (!isRecord(value)) {
    return { success: false, error: "Invalid category data." };
  }

  const { partial = false } = options;
  const name = value.name;
  const slug = value.slug;
  const hasName = name !== undefined;
  const hasSlug = slug !== undefined;

  if (partial && !hasName && !hasSlug &&
    value.description === undefined &&
    value.image === undefined &&
    value.isActive === undefined
  ) {
    return { success: false, error: "Provide category fields to update." };
  }

  if ((!partial || hasName) && typeof name !== "string") {
    return { success: false, error: "Category name is required." };
  }
  if ((!partial || hasSlug) && typeof slug !== "string") {
    return { success: false, error: "Category slug is required." };
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  if (
    trimmedName.length > INPUT_LIMITS.category.name ||
    trimmedSlug.length > INPUT_LIMITS.category.slug
  ) {
    return { success: false, error: "Category name or slug is too long." };
  }
  if (typeof name === "string" && !trimmedName) {
    return { success: false, error: "Category name is required." };
  }
  if (
    typeof slug === "string" &&
    (!trimmedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug))
  ) {
    return {
      success: false,
      error: "Slug must use lowercase letters, numbers and hyphens.",
    };
  }

  const description = parseOptionalText(
    value.description,
    "Description",
    INPUT_LIMITS.category.description
  );
  if (!description.success) return description;

  const image = parseOptionalText(
    value.image,
    "Image URL",
    INPUT_LIMITS.category.image
  );
  if (!image.success) return image;
  if (
    image.value &&
    !(
      (image.value.startsWith("/") && !image.value.startsWith("//")) ||
      /^https:\/\//i.test(image.value)
    )
  ) {
    return {
      success: false,
      error: "Image URL must be a site path or HTTPS URL.",
    };
  }

  if (value.isActive !== undefined && typeof value.isActive !== "boolean") {
    return { success: false, error: "Category status must be active or inactive." };
  }

  if (partial) {
    const data: Partial<CategoryInput> = {};
    if (typeof name === "string") data.name = trimmedName;
    if (typeof slug === "string") data.slug = trimmedSlug;
    if (value.description !== undefined) data.description = description.value;
    if (value.image !== undefined) data.image = image.value;
    if (value.isActive !== undefined) data.isActive = value.isActive;
    return { success: true, data };
  }

  if (typeof name !== "string" || typeof slug !== "string") {
    return { success: false, error: "Category name and slug are required." };
  }

  return {
    success: true,
    data: {
      name: trimmedName,
      slug: trimmedSlug,
      description: description.value,
      image: image.value,
      isActive: value.isActive ?? true,
    },
  };
}
