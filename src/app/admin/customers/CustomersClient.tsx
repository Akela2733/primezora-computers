"use client";

import Link from "next/link";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { INPUT_LIMITS } from "@/lib/input-limits";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  orderCount: number;
  totalSpending: number;
  createdAt: string;
};

type CustomerListResponse = {
  error?: string;
  customers: CustomerSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function CustomersClient() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<CustomerListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);

    fetch(`/api/admin/customers?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as CustomerListResponse;
        if (!response.ok) {
          throw new Error(data.error || "Unable to load customers.");
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load customers."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, reloadKey, search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setPage(1);
    setSearch(searchDraft.trim());
    setReloadKey((current) => current + 1);
  };

  const changePage = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Admin Dashboard
          </Link>
          <div className="mt-7">
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
              Store Management
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              Customers
            </h1>
            <p className="mt-2 text-sm text-white/35">
              {result?.pagination.total.toLocaleString() ?? "—"} registered customers
            </p>
          </div>
        </div>
      </section>

      <section className="container-primezora py-8">
        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearch}
              className="flex h-11 w-full max-w-xl items-center gap-3 border border-white/[0.07] bg-black/20 px-4"
            >
              <Search size={15} className="shrink-0 text-white/25" />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                maxLength={INPUT_LIMITS.customer.search}
                aria-label="Search customers by name, email or phone"
                placeholder="Search name, email or phone..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              />
              <button
                type="submit"
                className="text-[8px] font-bold uppercase tracking-[0.12em] text-orange-400"
              >
                Search
              </button>
            </form>
            {result && (
              <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                Page {result.pagination.page} of {result.pagination.totalPages}
              </p>
            )}
          </div>

          {error ? (
            <div role="alert" className="p-12 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setReloadKey((current) => current + 1);
                }}
                className="mt-4 border border-white/10 px-4 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 hover:text-white"
              >
                Try Again
              </button>
            </div>
          ) : isLoading && !result ? (
            <CustomersLoading />
          ) : !isLoading && result?.customers.length === 0 ? (
            <div className="p-14 text-center">
              <Users size={30} className="mx-auto text-white/20" />
              <p className="mt-4 font-display text-sm font-bold uppercase text-white/70">
                No customers found
              </p>
              <p className="mt-2 text-xs text-white/35">
                {search
                  ? "Try another name, email address or phone number."
                  : "Customers will appear here after placing an order."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <Heading>Customer</Heading>
                      <Heading>Phone</Heading>
                      <Heading>City</Heading>
                      <Heading>Orders</Heading>
                      <Heading>Total Spending</Heading>
                      <Heading>Registered</Heading>
                    </tr>
                  </thead>
                  <tbody>
                    {result?.customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.015]"
                      >
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-xs font-semibold text-orange-300 transition hover:text-orange-200"
                          >
                            {customer.name}
                          </Link>
                          <p className="mt-1 text-[9px] text-white/35">
                            {customer.email}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs text-white/55">
                          {customer.phone || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-white/55">
                          {customer.city || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-white/70">
                          {customer.orderCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-white/70">
                          LKR {customer.totalSpending.toLocaleString("en-LK")}
                        </td>
                        <td className="px-4 py-4 text-[10px] text-white/40">
                          {new Date(customer.createdAt).toLocaleDateString("en-LK")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.06] p-4">
                  <button
                    type="button"
                    onClick={() => changePage(result.pagination.page - 1)}
                    disabled={isLoading || page <= 1}
                    className="inline-flex h-9 items-center border border-white/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-[9px] text-white/35">
                    {result.pagination.total.toLocaleString()} customers
                  </span>
                  <button
                    type="button"
                    onClick={() => changePage(result.pagination.page + 1)}
                    disabled={isLoading || page >= result.pagination.totalPages}
                    className="inline-flex h-9 items-center border border-white/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">
      {children}
    </th>
  );
}

function CustomersLoading() {
  return (
    <div aria-label="Loading customers" className="divide-y divide-white/[0.05]">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex h-[72px] items-center gap-5 px-4">
          <div className="h-3 w-40 animate-pulse bg-white/[0.05]" />
          <div className="h-3 w-28 animate-pulse bg-white/[0.04]" />
          <div className="ml-auto h-3 w-16 animate-pulse bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}