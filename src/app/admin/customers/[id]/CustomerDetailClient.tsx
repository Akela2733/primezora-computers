"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag, UserRound } from "lucide-react";

type CustomerDetailResponse = {
  error?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    province: string | null;
    createdAt: string;
  };
  summary: {
    totalOrders: number;
    totalSpending: number;
  };
  orders: {
    id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    status: string;
    paymentMethod: string;
    deliveryMethod: string;
  }[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

export default function CustomerDetailClient({
  customerId,
}: {
  customerId: string;
}) {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch(
      `/api/admin/customers/${encodeURIComponent(customerId)}?page=${page}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const result =
          (await response.json()) as CustomerDetailResponse;
        if (!response.ok) {
          throw new Error(result.error || "Unable to load customer details.");
        }
        return result;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load customer details."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [customerId, page, reloadKey]);

  if (isLoading && !data) {
    return <CustomerDetailLoading />;
  }

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Customers
          </Link>
          <div className="mt-7">
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
              Customer Profile
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              {data?.customer.name ?? "Customer"}
            </h1>
            {data && (
              <p className="mt-2 text-xs text-white/35">
                Registered {new Date(data.customer.createdAt).toLocaleDateString("en-LK")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-primezora py-8">
        {error ? (
          <div role="alert" className="border border-red-500/20 bg-[#080d13] p-8 text-center">
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
        ) : data ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Total Orders" value={data.summary.totalOrders.toLocaleString()} />
              <Metric label="Total Spending" value={`LKR ${data.summary.totalSpending.toLocaleString("en-LK")}`} />
              <Metric label="Customer Since" value={new Date(data.customer.createdAt).toLocaleDateString("en-LK")} />
            </div>

            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] p-5">
                <UserRound size={16} className="text-orange-400" />
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                  Profile Information
                </h2>
              </div>
              <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Name" value={data.customer.name} />
                <Detail label="Email" value={data.customer.email} />
                <Detail label="Phone" value={data.customer.phone || "—"} />
                <Detail label="City" value={data.customer.city || "—"} />
                <Detail label="Province" value={data.customer.province || "—"} />
              </dl>
            </section>

            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={16} className="text-orange-400" />
                  <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                    Order History
                  </h2>
                </div>
                <span className="text-[9px] text-white/35">
                  {data.summary.totalOrders} total
                </span>
              </div>

              {data.orders.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-display text-sm font-bold uppercase text-white/60">
                    No orders yet
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    Orders placed by this customer will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-left">
                          <Heading>Order</Heading>
                          <Heading>Date</Heading>
                          <Heading>Status</Heading>
                          <Heading>Payment</Heading>
                          <Heading>Total</Heading>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((order) => (
                          <tr key={order.id} className="border-b border-white/[0.05] last:border-0">
                            <td className="px-4 py-4">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="font-mono text-[9px] font-bold text-orange-300 hover:text-orange-200"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-4 text-[10px] text-white/40">
                              {new Date(order.createdAt).toLocaleDateString("en-LK")}
                            </td>
                            <td className="px-4 py-4 text-[9px] text-white/55">
                              {order.status.replaceAll("_", " ")}
                            </td>
                            <td className="px-4 py-4 text-[9px] text-white/45">
                              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-white/70">
                              LKR {order.total.toLocaleString("en-LK")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/[0.06] p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoading(true);
                          setPage((current) => current - 1);
                        }}
                        disabled={isLoading || page <= 1}
                        className="h-9 border border-white/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <span className="text-[9px] text-white/35">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoading(true);
                          setPage((current) => current + 1);
                        }}
                        disabled={isLoading || page >= data.pagination.totalPages}
                        className="h-9 border border-white/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/[0.07] bg-[#080d13] p-4">
      <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/35">{label}</p>
      <p className="mt-4 font-display text-xl font-bold text-orange-300">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">{label}</dt>
      <dd className="mt-1 break-words text-xs text-white/70">{value}</dd>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">
      {children}
    </th>
  );
}

function CustomerDetailLoading() {
  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="container-primezora py-8">
        <div className="h-3 w-24 animate-pulse bg-white/[0.06]" />
        <div className="mt-8 h-9 w-52 animate-pulse bg-white/[0.06]" />
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse border border-white/[0.07] bg-[#080d13]" />
          ))}
        </div>
        <div className="mt-5 h-72 animate-pulse border border-white/[0.07] bg-[#080d13]" />
      </section>
    </main>
  );
}