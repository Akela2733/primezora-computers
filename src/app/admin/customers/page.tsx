import { requireAdminPage } from "@/lib/admin-auth";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  await requireAdminPage("/admin/customers");
  return <CustomersClient />;
}