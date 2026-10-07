export const INPUT_LIMITS = {
  customer: {
    firstName: 50,
    lastName: 50,
    phone: 30,
    email: 254,
    address: 200,
    city: 100,
    province: 100,
    postalCode: 20,
    search: 100,
  },
  checkout: {
    district: 100,
    productId: 191,
    itemLines: 100,
    databaseInteger: 2_147_483_647,
  },
  order: {
    id: 191,
    adminSearch: 100,
  },
  orderTracking: {
    orderNumber: 64,
  },
  product: {
    id: 191,
    name: 200,
    slug: 200,
    brand: 100,
    category: 100,
    description: 5_000,
    image: 2_048,
    badge: 100,
    search: 100,
  },
  catalog: {
    search: 100,
    category: 100,
    brand: 100,
    featured: 5,
    inStock: 5,
  },
} as const;

export function exceedsTextLimit(value: string, maximum: number): boolean {
  return value.length > maximum;
}

export function findOverLimitQueryParameter(
  searchParams: URLSearchParams,
  limits: Readonly<Record<string, number>>
): string | null {
  for (const [parameter, maximum] of Object.entries(limits)) {
    const value = searchParams.get(parameter);
    if (value !== null && exceedsTextLimit(value, maximum)) {
      return parameter;
    }
  }

  return null;
}
