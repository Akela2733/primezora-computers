import type { Metadata } from "next";

import { requireCustomerPage } from "@/lib/customer-auth";
import CustomerOrdersClient from "./CustomerOrdersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders | Primezora Technologies",
  description: "View your Primezora order history and current order status.",
};

export default async function CustomerOrdersPage() {
  await requireCustomerPage("/account/orders");

  return <CustomerOrdersClient />;
}
