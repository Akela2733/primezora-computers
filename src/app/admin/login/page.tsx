import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Portal | Primezora Technologies",
  description: "Secure administrator authentication and credential management for Primezora Technologies.",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    loggedOut?: string | string[];
    tab?: string | string[];
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawLoggedOut = Array.isArray(params.loggedOut)
    ? params.loggedOut[0]
    : params.loggedOut;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  const nextPath =
    typeof rawNext === "string" &&
    rawNext.startsWith("/admin") &&
    rawNext !== "/admin/login"
      ? rawNext
      : "/admin";

  const isLoggedOut = rawLoggedOut === "true";
  const initialTab =
    rawTab === "register" || rawTab === "forgot" ? rawTab : "login";

  return (
    <main className="min-h-screen bg-[#05090f] text-white flex flex-col justify-center">
      <AdminLoginForm
        nextPath={nextPath}
        loggedOut={isLoggedOut}
        initialTab={initialTab}
      />
    </main>
  );
}
