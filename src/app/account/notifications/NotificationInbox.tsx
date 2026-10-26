"use client";

import Link from "next/link";
import { Bell, BellRing, Check, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  readAt: string | null;
  notification: {
    id: string;
    title: string;
    message: string;
    type: "ANNOUNCEMENT" | "PROMOTION" | "RESTOCK" | "ORDER_UPDATE";
    href: string | null;
    createdAt: string;
  };
};

const TYPE_LABELS: Record<NotificationItem["notification"]["type"], string> = {
  ANNOUNCEMENT: "Announcement",
  PROMOTION: "Promotion",
  RESTOCK: "Back in stock",
  ORDER_UPDATE: "Order update",
};

type ReadFilter = "all" | "unread" | "read";

function getLocalDateKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        const matchesReadStatus =
          readFilter === "all" ||
          (readFilter === "unread" ? !item.readAt : Boolean(item.readAt));
        const matchesDate =
          !dateFilter ||
          getLocalDateKey(item.notification.createdAt) === dateFilter;

        return matchesReadStatus && matchesDate;
      }),
    [dateFilter, notifications, readFilter]
  );

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/customer/notifications", {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      notifications?: NotificationItem[];
      unreadCount?: number;
      error?: string;
    };
    if (
      !response.ok ||
      !Array.isArray(data.notifications) ||
      typeof data.unreadCount !== "number"
    ) {
      throw new Error(data.error || "Unable to load your notifications.");
    }
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await loadNotifications();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your notifications."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadNotifications]);

  async function markRead(id?: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    const previous = notifications;
    setNotifications((current) =>
      current.map((item) =>
        !id || item.id === id
          ? { ...item, readAt: new Date().toISOString() }
          : item
      )
    );
    setUnreadCount((count) =>
      id
        ? Math.max(0, count - (previous.some((item) => item.id === id && !item.readAt) ? 1 : 0))
        : 0
    );

    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { markAllRead: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to update your notifications.");
      }
      window.dispatchEvent(new Event("primezora:notifications-updated"));
    } catch (updateError) {
      setNotifications(previous);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update your notifications."
      );
      try {
        await loadNotifications();
      } catch (reloadError) {
        console.error("Failed to reload customer notifications:", reloadError);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-white/[0.09] bg-[#030505] text-sm text-white/50">
          <LoaderCircle size={18} className="mr-2 animate-spin text-amber-600" />
          Loading notifications…
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                aria-label="Filter notifications by read status"
                className="flex flex-wrap gap-2"
              >
                {([
                  ["all", "All"],
                  ["unread", "Unread"],
                  ["read", "Read"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={readFilter === value}
                    onClick={() => setReadFilter(value)}
                    className={`min-h-9 rounded-lg border px-3 text-[11px] font-semibold transition ${
                      readFilter === value
                        ? "border-amber-600/40 bg-amber-600/[0.1] text-amber-500"
                        : "border-white/[0.08] text-white/55 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="flex min-h-9 items-center gap-2 text-[11px] text-white/45">
                <span>On date</span>
                <input
                  type="date"
                  aria-label="Filter notifications by date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="min-h-9 rounded-lg border border-white/[0.1] bg-[#030505] px-2 text-[11px] text-white/75 [color-scheme:dark] focus:border-amber-600/40 focus:outline-none"
                />
                {dateFilter && (
                  <button
                    type="button"
                    aria-label="Clear date filter"
                    onClick={() => setDateFilter("")}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#030505] px-5 py-12 text-center">
              <Bell size={24} className="mx-auto text-white/35" />
              <h2 className="mt-4 font-display text-base font-semibold text-white/80">
                No notifications yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
                Store announcements, wishlist restock alerts and order updates will
                appear here.
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#030505] px-5 py-10 text-center">
              <Bell size={22} className="mx-auto text-white/35" />
              <h2 className="mt-3 font-display text-sm font-semibold text-white/80">
                No matching notifications
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/45">
                Try a different read status or date.
              </p>
            </div>
          ) : (
            <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-white/45">
              Showing {filteredNotifications.length} of {notifications.length}
              {" · "}
              {unreadCount
                ? `${unreadCount} unread`
                : "You’re all caught up."}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void markRead()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 text-[11px] font-semibold text-white/65 transition hover:border-amber-600/30 hover:text-amber-600 disabled:opacity-50"
              >
                <Check size={13} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const content = (
                <>
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        item.readAt
                          ? "border border-white/[0.08] bg-white/[0.03] text-white/45"
                          : "border border-amber-600/25 bg-amber-600/[0.08] text-amber-600"
                      }`}
                    >
                      {item.notification.type === "ANNOUNCEMENT" ||
                      item.notification.type === "PROMOTION" ? (
                        <BellRing size={16} />
                      ) : (
                        <Bell size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-white/90">
                          {item.notification.title}
                        </h2>
                        <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/45">
                          {TYPE_LABELS[item.notification.type]}
                        </span>
                        {!item.readAt && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/55">
                        {item.notification.message}
                      </p>
                      <p className="mt-2 text-[10px] text-white/35">
                        {new Date(item.notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {item.notification.href && (
                    <span className="ml-12 mt-3 inline-flex text-[11px] font-semibold text-amber-600">
                      View details
                    </span>
                  )}
                </>
              );

              return (
                <article
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    item.readAt
                      ? "border-white/[0.08] bg-[#030505]"
                      : "border-amber-600/20 bg-amber-600/[0.025]"
                  }`}
                >
                  {item.notification.href ? (
                    <Link
                      href={item.notification.href}
                      onClick={() => {
                        if (!item.readAt) void markRead(item.id);
                      }}
                      className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-600/70"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                  {!item.readAt && !item.notification.href && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void markRead(item.id)}
                      className="ml-12 mt-3 text-[11px] font-semibold text-amber-600 hover:text-amber-500 disabled:opacity-50"
                    >
                      Mark as read
                    </button>
                  )}
                </article>
              );
            })}
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
