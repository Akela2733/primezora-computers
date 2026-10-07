import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, MapPin, Package, UserRound } from "lucide-react";

import OrderStatusControl from "./OrderStatusControl";
import { prisma } from "@/lib/prisma";
import { getOrderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/orders");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      deliveryMethod: true,
      address: true,
      city: true,
      province: true,
      postalCode: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          productPrice: true,
          quantity: true,
          product: {
            select: { image: true },
          },
        },
      },
      statusHistory: {
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          changedBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Orders
          </Link>
          <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
                Order Management
              </p>
              <h1 className="mt-3 break-all font-display text-2xl font-bold uppercase sm:text-3xl">
                {order.orderNumber}
              </h1>
              <p className="mt-2 text-xs text-white/35">
                Placed {order.createdAt.toLocaleString("en-LK")}
              </p>
            </div>
            <div id="status-controls">
              <OrderStatusControl
                key={`${order.id}-${order.status}`}
                orderId={order.id}
                orderNumber={order.orderNumber}
                status={order.status}
                deliveryMethod={order.deliveryMethod}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-primezora py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="border border-white/[0.07] bg-[#080d13]">
              <SectionHeading icon={<UserRound size={15} />} title="Customer" />
              <dl className="grid gap-5 p-5 sm:grid-cols-2">
                <Detail label="Name" value={order.customerName} />
                <Detail label="Phone" value={order.customerPhone || "—"} />
                <Detail label="Email" value={order.customerEmail || "—"} />
              </dl>
            </section>

            <section className="border border-white/[0.07] bg-[#080d13]">
              <SectionHeading icon={<MapPin size={15} />} title="Delivery" />
              <dl className="grid gap-5 p-5 sm:grid-cols-2">
                <Detail
                  label="Method"
                  value={order.deliveryMethod === "delivery" ? "Delivery" : "Store Pickup"}
                />
                <Detail
                  label="Address"
                  value={
                    order.deliveryMethod === "delivery"
                      ? [order.address, order.city, order.province, order.postalCode]
                          .filter(Boolean)
                          .join(", ") || "Address not provided"
                      : "Customer will collect the order."
                  }
                />
                <Detail
                  label="Payment"
                  value={order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
                />
              </dl>
            </section>

            <section className="border border-white/[0.07] bg-[#080d13]">
              <SectionHeading icon={<Package size={15} />} title="Order Items" />
              {order.items.length === 0 ? (
                <p className="p-5 text-xs text-white/40">This order has no item records.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left">
                        <th className="px-5 py-3 text-[8px] uppercase tracking-[0.14em] text-white/30">Product</th>
                        <th className="px-5 py-3 text-right text-[8px] uppercase tracking-[0.14em] text-white/30">Unit Price</th>
                        <th className="px-5 py-3 text-right text-[8px] uppercase tracking-[0.14em] text-white/30">Qty</th>
                        <th className="px-5 py-3 text-right text-[8px] uppercase tracking-[0.14em] text-white/30">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {item.product.image ? (
                                <Image
                                  src={item.product.image}
                                  alt=""
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className="h-12 w-12 shrink-0 border border-white/[0.07] bg-black/30 object-contain p-1"
                                />
                              ) : (
                                <div className="h-12 w-12 shrink-0 border border-white/[0.07] bg-black/30" />
                              )}
                              <div>
                                <p className="text-xs font-semibold text-white/75">{item.productName}</p>
                                <p className="mt-1 font-mono text-[8px] text-white/25">{item.productId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-white/55">
                            LKR {item.productPrice.toLocaleString("en-LK")}
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-white/55">{item.quantity}</td>
                          <td className="px-5 py-4 text-right text-xs font-semibold text-white/75">
                            LKR {(item.productPrice * item.quantity).toLocaleString("en-LK")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="border border-white/[0.07] bg-[#080d13]">
              <SectionHeading icon={<Package size={15} />} title="Order Timeline" />
              <ol className="space-y-0 px-5 py-4">
                <TimelineItem
                  status="PENDING"
                  date={order.createdAt}
                  description="Order placed"
                  isLast={order.statusHistory.length === 0}
                />
                {order.statusHistory.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    status={entry.toStatus}
                    date={entry.createdAt}
                    description={`Updated by ${entry.changedBy}`}
                    isLast={index === order.statusHistory.length - 1}
                  />
                ))}
              </ol>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <section className="border border-white/[0.07] bg-[#080d13]">
              <SectionHeading icon={<Banknote size={15} />} title="Summary" />
              <div className="space-y-4 p-5">
                <SummaryRow label="Subtotal" value={order.subtotal} />
                <SummaryRow label="Delivery Fee" value={order.deliveryFee} />
                <div className="border-t border-white/[0.07] pt-4">
                  <SummaryRow label="Total" value={order.total} emphasized />
                </div>
                <Detail
                  label="Current Status"
                  value={getOrderStatusLabel(order.status)}
                />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] p-5">
      <span className="text-orange-400">{icon}</span>
      <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white/75">
        {title}
      </h2>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">{label}</dt>
      <dd className="mt-1 break-words text-xs leading-5 text-white/70">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</span>
      <span className={`text-xs font-bold ${emphasized ? "text-orange-400" : "text-white/70"}`}>
        LKR {value.toLocaleString("en-LK")}
      </span>
    </div>
  );
}

function TimelineItem({
  status,
  date,
  description,
  isLast,
}: {
  status: OrderStatus;
  date: Date;
  description: string;
  isLast: boolean;
}) {
  const color =
    status === "CANCELLED"
      ? "bg-red-400"
      : status === "COMPLETED"
        ? "bg-emerald-400"
        : "bg-orange-400";

  return (
    <li className="flex gap-4">
      <div className="flex w-3 shrink-0 flex-col items-center">
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
        {!isLast && <span className="my-1 w-px flex-1 bg-white/[0.12]" />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-5"}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
            {getOrderStatusLabel(status)}
          </p>
          <time className="text-[9px] text-white/35">
            {date.toLocaleString("en-LK")}
          </time>
        </div>
        <p className="mt-1 text-[9px] text-white/35">{description}</p>
      </div>
    </li>
  );
}