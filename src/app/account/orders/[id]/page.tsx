import type { Metadata } from "next";

import { requireCustomerPage } from "@/lib/customer-auth";
import CustomerOrderDetailClient from "./CustomerOrderDetailClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Details | Primezora Technologies",
  description: "View your Primezora order status, products, and delivery details.",
};

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCustomerPage("/account/orders");
  const { id } = await params;

  return <CustomerOrderDetailClient orderId={id} />;
}
