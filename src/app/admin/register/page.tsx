import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLoginForm from "../login/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Registration | Primezora Technologies",
  description: "Generate and configure administrator credentials for Primezora Technologies.",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminRegisterPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function AdminRegisterPage({
  searchParams,
}: AdminRegisterPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath =
    typeof rawNext === "string" &&
    rawNext.startsWith("/admin") &&
    rawNext !== "/admin/login"
      ? rawNext
      : "/admin";

  return (
    <main className="min-h-screen bg-[#05090f] text-white flex flex-col justify-center">
      <AdminLoginForm nextPath={nextPath} initialTab="register" />
    </main>
  );
}
