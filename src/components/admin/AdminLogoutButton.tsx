"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminLogoutButton({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to sign out.");
      }

      // Hard redirect to clear router cache and ensure fresh session evaluation
      window.location.href = "/admin/login?loggedOut=true";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      alert("Unable to sign out. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Sign out of Admin Portal"
      className={`inline-flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/[0.05] text-[9px] font-bold uppercase tracking-[0.14em] text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-50 ${
        compact ? "h-9 px-3" : "h-10 px-4"
      } ${className}`}
    >
      <LogOut size={13} className={isLoggingOut ? "animate-pulse" : ""} />
      <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}

export default AdminLogoutButton;
