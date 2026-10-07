export const PAGINATION_LIMITS = {
  catalog: {
    defaultPageSize: 24,
    maxPageSize: 100,
    maxOffset: 100_000,
  },
  adminProducts: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxOffset: 100_000,
  },
  adminOrders: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxOffset: 100_000,
    allowedPageSizes: [20, 50, 100],
  },
  customerOrders: {
    defaultPageSize: 10,
    maxPageSize: 50,
    maxOffset: 100_000,
  },
  adminCustomers: {
    defaultPageSize: 50,
    maxPageSize: 50,
    maxOffset: 100_000,
  },
  adminCustomerOrders: {
    defaultPageSize: 20,
    maxPageSize: 20,
    maxOffset: 100_000,
  },
} as const;

export type PaginationConfig = {
  defaultPageSize: number;
  maxPageSize: number;
  maxOffset: number;
  pageParam?: string;
  pageSizeParam?: string | null;
  allowedPageSizes?: readonly number[];
};

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

function parsePositiveInteger(
  value: string | null,
  fallback: number
): number | null {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parsePagination(
  searchParams: URLSearchParams,
  config: PaginationConfig
): Pagination | null {
  const page = parsePositiveInteger(
    searchParams.get(config.pageParam ?? "page"),
    1
  );
  const pageSize = parsePositiveInteger(
    config.pageSizeParam === null
      ? null
      : searchParams.get(config.pageSizeParam ?? "pageSize"),
    config.defaultPageSize
  );

  if (
    page === null ||
    pageSize === null ||
    pageSize > config.maxPageSize ||
    (config.allowedPageSizes &&
      !config.allowedPageSizes.includes(pageSize))
  ) {
    return null;
  }

  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip) || skip > config.maxOffset) {
    return null;
  }

  return { page, pageSize, skip, take: pageSize };
}
