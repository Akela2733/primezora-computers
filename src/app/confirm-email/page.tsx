import { redirect } from "next/navigation";

type ConfirmEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  redirect(
    token
      ? `/verify-email?token=${encodeURIComponent(token)}`
      : "/verify-email"
  );
}
