"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function NotificationBell({
  hasCustomerSession,
}: {
  hasCustomerSession: boolean;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const activeRequest = useRef<AbortController | null>(null);
  const visibleUnreadCount = hasCustomerSession ? unreadCount : 0;

  const refreshUnreadCount = useCallback(async () => {
    if (!hasCustomerSession) return;

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    try {
      const response = await fetch(
        "/api/customer/notifications?countOnly=1",
        { cache: "no-store", signal: controller.signal }
      );
      if (!response.ok) return;
      const data = (await response.json()) as { unreadCount?: number };
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Failed to refresh notification count:", error);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  }, [hasCustomerSession]);

  useEffect(() => {
    if (!hasCustomerSession) return;

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
      activeRequest.current?.abort();
    };
  }, [hasCustomerSession, refreshUnreadCount]);

  return (
    <Link
      href="/account/notifications"
      aria-label={
        visibleUnreadCount > 0
          ? `Notifications, ${visibleUnreadCount} unread`
          : "Notifications"
      }
      className="relative rounded-lg p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white/90"
    >
      <Bell size={19} />
      {visibleUnreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[9px] font-bold text-white">
          {visibleUnreadCount > 99 ? "99+" : visibleUnreadCount}
        </span>
      )}
    </Link>
  );
}
