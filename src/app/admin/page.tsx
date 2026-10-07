import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  Banknote,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminPage("/admin");

  const [
    productCount,
    orderCount,
    customerCount,
    lowStockCount,
    pendingOrders,
    processingOrders,
    shippedOrders,
    completedOrders,
    cancelledOrders,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.order.count(),

    prisma.customer.count(),

    prisma.product.count({
      where: {
        stockQuantity: {
          gt: 0,
          lte: LOW_STOCK_THRESHOLD,
        },
      },
    }),

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.order.count({
      where: {
        status: "PROCESSING",
      },
    }),
    prisma.order.count({
      where: {
        status: "SHIPPED",
      },
    }),
    prisma.order.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      {/* Header */}

      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-10">
          <p className="font-display text-[9px] uppercase tracking-[0.32em] text-orange-400">
            Primezora Technologies
          </p>

          <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
            Manage products, orders, customers and
            inventory from one place.
          </p>
        </div>
      </section>

      <section className="container-primezora py-10 lg:py-14">

        {/* Stats */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Products"
            value={productCount.toLocaleString()}
            icon={<Package size={18} />}
          />

          <StatCard
            label="Orders"
            value={orderCount.toLocaleString()}
            icon={<ShoppingBag size={18} />}
          />

          <StatCard
            label="Customers"
            value={customerCount.toLocaleString()}
            icon={<Users size={18} />}
          />

          <StatCard
            label="Revenue"
            value="Not tracked"
            icon={<Banknote size={18} />}
          />

        </div>

        <section className="mt-8" aria-labelledby="order-stats-heading">
          <p className="font-display text-[9px] uppercase tracking-[0.28em] text-orange-400">
            Order Overview
          </p>
          <h2 id="order-stats-heading" className="mt-3 font-display text-xl font-bold uppercase">
            Fulfillment Statistics
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Orders" value={orderCount.toLocaleString()} icon={<ShoppingBag size={18} />} />
            <StatCard label="Pending" value={pendingOrders.toLocaleString()} icon={<ShoppingBag size={18} />} />
            <StatCard label="Processing" value={processingOrders.toLocaleString()} icon={<ShoppingBag size={18} />} />
            <StatCard label="Shipped" value={shippedOrders.toLocaleString()} icon={<ShoppingBag size={18} />} />
            <StatCard label="Completed" value={completedOrders.toLocaleString()} icon={<ShoppingBag size={18} />} />
            <StatCard label="Cancelled" value={cancelledOrders.toLocaleString()} icon={<ShoppingBag size={18} />} />
          </div>
          <p className="mt-3 text-[10px] leading-5 text-white/35">
            Verified revenue is not available yet: the current COD/bank-transfer flow does not persist payment settlement confirmation. Order totals are not counted as paid revenue.
          </p>
        </section>

        {/* Alerts */}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">

          <div className="border border-orange-500/20 bg-orange-500/[0.04] p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
                <AlertTriangle size={18} />
              </div>

              <div className="flex-1">

                <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                  Inventory Alert
                </p>

                <h2 className="mt-2 font-display text-lg font-bold uppercase">
                  {lowStockCount} Low Stock
                </h2>

                <p className="mt-2 text-xs leading-6 text-white/40">
                  Products with {LOW_STOCK_THRESHOLD} or fewer units
                  remaining.
                </p>

                <Link
                  href="/admin/inventory?status=low-stock"
                  className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-orange-400 transition hover:text-orange-300"
                >
                  Manage Inventory
                  <ArrowRight size={12} />
                </Link>

              </div>

            </div>

          </div>

          <div className="border border-blue-500/20 bg-blue-500/[0.04] p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <ShoppingBag size={18} />
              </div>

              <div className="flex-1">

                <p className="font-display text-[9px] uppercase tracking-[0.2em] text-blue-400">
                  Orders
                </p>

                <h2 className="mt-2 font-display text-lg font-bold uppercase">
                  {pendingOrders} Pending
                </h2>

                <p className="mt-2 text-xs leading-6 text-white/40">
                  Orders waiting for confirmation.
                </p>

                <Link
                  href="/admin/orders"
                  className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-blue-400 transition hover:text-blue-300"
                >
                  View Orders
                  <ArrowRight size={12} />
                </Link>

              </div>

            </div>

          </div>

        </div>

        {/* Management */}

        <div className="mt-8">

          <p className="font-display text-[9px] uppercase tracking-[0.28em] text-orange-400">
            Management
          </p>

          <h2 className="mt-3 font-display text-2xl font-bold uppercase">
            Store Operations
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <AdminLink
              href="/admin/products"
              icon={<Package size={20} />}
              title="Products"
              description="Add, edit, remove and manage product inventory."
            />

            <AdminLink
              href="/admin/inventory"
              icon={<Package size={20} />}
              title="Inventory"
              description="Review stock levels and adjust quantities safely."
            />

            <AdminLink
              href="/admin/customers"
              icon={<Users size={20} />}
              title="Customers"
              description="Review customer profiles and order history."
            />

            <AdminLink
              href="/admin/orders"
              icon={<ShoppingBag size={20} />}
              title="Orders"
              description="View customer orders and update order status."
            />

          </div>

        </div>

      </section>
    </main>
  );
}


/* -------------------------------------------------------------------------- */
/* Stat Card */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-white/[0.07] bg-[#080d13] p-5">

      <div className="flex items-center justify-between">

        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
          {label}
        </p>

        <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
          {icon}
        </div>

      </div>

      <p className="mt-6 font-display text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Admin Link */
/* -------------------------------------------------------------------------- */

function AdminLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group border border-white/[0.07] bg-[#080d13] p-6 transition hover:border-orange-500/30 hover:bg-orange-500/[0.03]"
    >

      <div className="flex h-11 w-11 items-center justify-center border border-white/[0.08] text-orange-400 transition group-hover:border-orange-500/30 group-hover:bg-orange-500/10">
        {icon}
      </div>

      <h3 className="mt-5 font-display text-sm font-bold uppercase">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-6 text-white/35">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-orange-400">
        Open
        <ArrowRight size={12} />
      </div>

    </Link>
  );
}