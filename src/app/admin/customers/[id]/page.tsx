import { requireAdminPage } from "@/lib/admin-auth";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/customers");
  const { id } = await params;
  return <CustomerDetailClient customerId={id} />;
}