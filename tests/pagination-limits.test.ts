import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  PAGINATION_LIMITS,
  parsePagination,
} from "../src/lib/pagination-limits";

describe("pagination bounds", () => {
  test("uses the configured default page and size", () => {
    assert.deepEqual(
      parsePagination(new URLSearchParams(), {
        ...PAGINATION_LIMITS.catalog,
        pageSizeParam: "limit",
      }),
      { page: 1, pageSize: 24, skip: 0, take: 24 }
    );
  });

  test("accepts size 1 and the configured maximum with database bounds", () => {
    const config = {
      ...PAGINATION_LIMITS.catalog,
      pageSizeParam: "limit",
    };

    assert.deepEqual(
      parsePagination(new URLSearchParams("page=2&limit=1"), config),
      { page: 2, pageSize: 1, skip: 1, take: 1 }
    );
    assert.deepEqual(
      parsePagination(
        new URLSearchParams("page=3&limit=100"),
        config
      ),
      { page: 3, pageSize: 100, skip: 200, take: 100 }
    );
  });

  test("rejects sizes over the maximum, negative sizes, and malformed pages", () => {
    const config = {
      ...PAGINATION_LIMITS.catalog,
      pageSizeParam: "limit",
    };

    for (const query of [
      "limit=101",
      "limit=-1",
      "limit=0",
      "limit=1.5",
      "page=0",
      "page=-1",
      "page=invalid",
    ]) {
      assert.equal(parsePagination(new URLSearchParams(query), config), null);
    }
  });

  test("rejects pages beyond the configured offset", () => {
    assert.equal(
      parsePagination(
        new URLSearchParams("page=100002&limit=1"),
        {
          ...PAGINATION_LIMITS.catalog,
          pageSizeParam: "limit",
        }
      ),
      null
    );
  });

  test("preserves the admin order endpoint's supported page sizes", () => {
    const config = {
      ...PAGINATION_LIMITS.adminOrders,
      pageSizeParam: "pageSize",
    };

    for (const pageSize of [20, 50, 100]) {
      assert.equal(
        parsePagination(
          new URLSearchParams(`pageSize=${pageSize}`),
          config
        )?.take,
        pageSize
      );
    }
    assert.equal(
      parsePagination(new URLSearchParams("pageSize=1"), config),
      null
    );
  });
});
