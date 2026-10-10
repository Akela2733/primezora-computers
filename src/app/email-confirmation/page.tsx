import { redirect } from "next/navigation";

type EmailConfirmationPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    next?: string | string[];
    state?: string | string[];
  }>;
};

export default async function EmailConfirmationPage({
  searchParams,
}: EmailConfirmationPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["email", "next", "state"] as const) {
    const value = params[key];
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue) query.set(key, firstValue);
  }
  redirect(`/verify-email?${query.toString()}`);
}
