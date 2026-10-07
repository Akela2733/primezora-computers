import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLoginForm from "../login/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Account Recovery | Primezora Technologies",
  description: "Instructions for recovering administrator access.",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminForgotPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function AdminForgotPage({
  searchParams,
}: AdminForgotPageProps) {
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
      <AdminLoginForm nextPath={nextPath} initialTab="forgot" />
    </main>
  );
}
