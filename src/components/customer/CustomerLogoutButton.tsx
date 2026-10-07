"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestCustomerLogout } from "@/lib/customer-logout-client";

export function CustomerLogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestCustomerLogout();
      router.push("/login?loggedOut=true");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="customer-logout-btn"
        onClick={handleLogout}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:border-rose-500/40 hover:bg-rose-500/20 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin text-rose-400" />
        ) : (
          <LogOut size={15} className="text-rose-400" />
        )}
        <span>{loading ? "Signing out..." : "Sign Out"}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </>
  );
}
