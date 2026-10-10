import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Sign In | Primezora Technologies",
  description: "Sign in to your Primezora customer account to view your orders, saved addresses, and profile details.",
};

type CustomerLoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    email?: string | string[];
    registered?: string | string[];
    loggedOut?: string | string[];
  }>;
};

export default async function CustomerLoginPage({
  searchParams,
}: CustomerLoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawRegistered = Array.isArray(params.registered)
    ? params.registered[0]
    : params.registered;
  const rawLoggedOut = Array.isArray(params.loggedOut)
    ? params.loggedOut[0]
    : params.loggedOut;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const nextPath = getSafeCustomerRedirectPath(rawNext);

  const session = await getCustomerSession();
  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-12">
      <LoginForm
        nextPath={nextPath}
        initialEmail={rawEmail?.trim().slice(0, 254) ?? ""}
        registered={rawRegistered === "true"}
        loggedOut={rawLoggedOut === "true"}
      />
    </main>
  );
}
