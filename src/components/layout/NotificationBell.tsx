"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/customer/notifications?countOnly=1",
        { cache: "no-store" }
      );
      if (!response.ok) return;
      const data = (await response.json()) as { unreadCount?: number };
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to refresh notification count:", error);
    }
  }, []);

  useEffect(() => {
    const initialTimeout = window.setTimeout(
      () => void refreshUnreadCount(),
      0
    );
    const intervalId = window.setInterval(refreshUnreadCount, 60_000);
    const onFocus = () => void refreshUnreadCount();
    const onNotificationsUpdated = () => void refreshUnreadCount();
    window.addEventListener("focus", onFocus);
    window.addEventListener(
      "primezora:notifications-updated",
      onNotificationsUpdated
    );
    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(
        "primezora:notifications-updated",
        onNotificationsUpdated
      );
    };
  }, [refreshUnreadCount]);

  return (
    <Link
      href="/account/notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className="relative rounded-lg p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white/90"
    >
      <Bell size={19} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[9px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
