import type { Metadata } from "next";

import { AccountDashboard } from "@/components/customer/AccountDashboard";
import { requireCustomerPage } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account | Primezora Technologies",
  description: "Manage your profile, wishlist, orders, addresses, and settings.",
};

export default async function AccountPage() {
  const { customer } = await requireCustomerPage("/account");
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
    },
  });

  return (
    <AccountDashboard
      profile={{
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        province: customer.province,
        postalCode: customer.postalCode,
      }}
      displayName={
        customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : customer.name || customer.email.split("@")[0]
      }
      recentOrders={orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      }))}
    />
  );
}
