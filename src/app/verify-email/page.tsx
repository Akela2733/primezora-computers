import type { Metadata } from "next";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verify your email | Primezora Technologies",
  description: "Verify your Primezora customer account email address.",
  robots: { index: false, follow: false },
};

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    next?: string | string[];
    token?: string | string[];
    state?: string | string[];
    cooldown?: string | string[];
  }>;
};

function first(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = first(params.token);
  const email = first(params.email).trim().slice(0, 254);
  const nextPath = getSafeCustomerRedirectPath(first(params.next));
  const rawCooldown = Number(first(params.cooldown));
  const cooldownSeconds =
    Number.isFinite(rawCooldown) && rawCooldown > 0
      ? Math.min(Math.floor(rawCooldown), 60)
      : 0;

  return (
    <VerifyEmailClient
      email={email}
      nextPath={nextPath}
      token={token}
      deliveryFailed={first(params.state) === "send-failed"}
      cooldownSeconds={cooldownSeconds}
    />
  );
}
