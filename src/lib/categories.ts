type CategoryDefinition = {
  slug: string;
  displayName: string;
  productCategory: string | null;
  headerLabel?: string;
  homepage?: {
    label: string;
    image?: string;
  };
};

export const CATEGORY_CONFIG: readonly CategoryDefinition[] = [
  {
    slug: "accessories",
    displayName: "Accessories",
    productCategory: null,
  },
  {
    slug: "gaming",
    displayName: "Gaming",
    productCategory: "Gaming",
    headerLabel: "GAMING",
    homepage: {
      label: "Gaming Accessories",
      image: "/categories/gaming%20accessories.png",
    },
  },
  {
    slug: "pc-components",
    displayName: "PC Components",
    productCategory: "PC Components",
    headerLabel: "PC PARTS",
    homepage: {
      label: "PC Parts",
      image: "/categories/pc%20parts.png",
    },
  },
  {
    slug: "monitors",
    displayName: "Monitors",
    productCategory: null,
  },
  {
    slug: "networking",
    displayName: "Network & Storage",
    productCategory: null,
  },
  {
    slug: "keyboards",
    displayName: "Keyboards",
    productCategory: "Keyboards",
    headerLabel: "KEYBOARDS",
    homepage: {
      label: "Keyboards",
    },
  },
  {
    slug: "mice",
    displayName: "Mice",
    productCategory: "Mice",
    headerLabel: "MICE",
    homepage: {
      label: "Mice",
    },
  },
  {
    slug: "peripherals",
    displayName: "Peripherals",
    productCategory: null,
  },
] as const;

export type CategoryConfig = CategoryDefinition;
export type SupportedCategory = CategoryDefinition & {
  productCategory: string;
};

export function normalizeCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  const normalizedSlug = normalizeCategorySlug(slug);
  return CATEGORY_CONFIG.find((category) => category.slug === normalizedSlug);
}

export function isSupportedCategory(
  category: CategoryConfig
): category is SupportedCategory {
  return category.productCategory !== null;
}

export function getSupportedCategories(): SupportedCategory[] {
  return CATEGORY_CONFIG.filter(isSupportedCategory);
}

export function getHeaderCategories(): (SupportedCategory & {
  headerLabel: string;
})[] {
  return getSupportedCategories().filter(
    (category): category is SupportedCategory & { headerLabel: string } =>
      typeof category.headerLabel === "string"
  );
}

export function getSupportedCategoryBySlug(
  slug: string
): SupportedCategory {
  const category = getCategoryBySlug(slug);
  if (!category || !isSupportedCategory(category)) {
    throw new Error(`Category "${slug}" is not configured as supported.`);
  }
  return category;
}

export function getCategoryHref(category: SupportedCategory): string {
  return `/categories/${category.slug}`;
}

export function getSupportedCategoryHref(slug: string): string {
  return getCategoryHref(getSupportedCategoryBySlug(slug));
}
