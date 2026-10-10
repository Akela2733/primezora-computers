import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account | Primezora Technologies",
  description: "Create a Primezora customer account to track orders, save shipping addresses, and manage your technology purchases.",
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[]; email?: string | string[] }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const nextPath = getSafeCustomerRedirectPath(rawNext);
  const session = await getCustomerSession();
  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-12">
      <RegisterForm
        nextPath={nextPath}
        initialEmail={rawEmail?.trim().slice(0, 254) ?? ""}
      />
    </main>
  );
}
