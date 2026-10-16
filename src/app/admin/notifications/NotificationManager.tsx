"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, LoaderCircle, Send } from "lucide-react";

type Audience = "ALL_CUSTOMERS" | "PROMOTIONAL_SUBSCRIBERS";
type NotificationType = "ANNOUNCEMENT" | "PROMOTION";

type SentNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  href: string | null;
  createdAt: string;
  recipientCount: number;
};

export function NotificationManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [type, setType] = useState<NotificationType>("ANNOUNCEMENT");
  const [audience, setAudience] = useState<Audience>("ALL_CUSTOMERS");
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  const loadHistory = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      notifications?: SentNotification[];
      error?: string;
    };
    if (!response.ok || !Array.isArray(data.notifications)) {
      throw new Error(data.error || "Unable to load sent notifications.");
    }
    setHistory(data.notifications);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/notifications", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          notifications?: SentNotification[];
          error?: string;
        };
        if (!response.ok || !Array.isArray(data.notifications)) {
          throw new Error(data.error || "Unable to load sent notifications.");
        }
        if (!cancelled) setHistory(data.notifications);
      } catch (error) {
        if (!cancelled) {
          setFeedback(
            error instanceof Error
              ? error.message
              : "Unable to load sent notifications."
          );
          setFeedbackIsError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, href, type, audience }),
      });
      const data = (await response.json()) as {
        recipientCount?: number;
        error?: string;
      };
      if (!response.ok || typeof data.recipientCount !== "number") {
        throw new Error(data.error || "Unable to send this notification.");
      }

      setTitle("");
      setMessage("");
      setHref("");
      setFeedback(`Notification sent to ${data.recipientCount} customers.`);
      setFeedbackIsError(false);
      try {
        await loadHistory();
      } catch (historyError) {
        console.error("Failed to refresh notification history:", historyError);
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to send this notification."
      );
      setFeedbackIsError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
      <section className="rounded-xl border border-white/[0.09] bg-[#030505] p-5 sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.08] text-amber-600">
            <BellRing size={18} />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-white/90">
              Compose notification
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Notifications appear in selected customers&apos; website inboxes.
            </p>
          </div>
        </div>

        <form onSubmit={sendNotification} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Notification type
            </span>
            <select
              value={type}
              onChange={(event) => {
                const nextType = event.target.value as NotificationType;
                setType(nextType);
                if (nextType === "PROMOTION") {
                  setAudience("PROMOTIONAL_SUBSCRIBERS");
                }
              }}
              className="min-h-11 w-full rounded-lg border border-white/[0.12] bg-[#080a0a] px-3 text-sm text-white/85 outline-none focus:border-amber-600/50"
            >
              <option value="ANNOUNCEMENT">Store announcement</option>
              <option value="PROMOTION">Promotion</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Send to
            </span>
            <select
              value={audience}
              disabled={type === "PROMOTION"}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="min-h-11 w-full rounded-lg border border-white/[0.12] bg-[#080a0a] px-3 text-sm text-white/85 outline-none focus:border-amber-600/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="ALL_CUSTOMERS">All registered customers</option>
              <option value="PROMOTIONAL_SUBSCRIBERS">
                Customers opted in to promotional emails
              </option>
            </select>
            <span className="mt-2 block text-[11px] leading-5 text-white/40">
              Promotions are always restricted to customers who opted in to
              promotional emails. Notifications are delivered in the website
              inbox.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Title
            </span>
            <input
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A short, clear notification title"
              className="min-h-11 w-full rounded-lg border border-white/[0.12] bg-[#080a0a] px-3 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-amber-600/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Message
            </span>
            <textarea
              required
              maxLength={2_000}
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the details customers need to know."
              className="w-full resize-y rounded-lg border border-white/[0.12] bg-[#080a0a] px-3 py-3 text-sm leading-6 text-white/85 outline-none placeholder:text-white/30 focus:border-amber-600/50"
            />
            <span className="mt-1 block text-right text-[10px] text-white/35">
              {message.length}/2,000
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Optional in-site link
            </span>
            <input
              type="text"
              maxLength={500}
              value={href}
              onChange={(event) => setHref(event.target.value)}
              placeholder="/shop or /deals"
              className="min-h-11 w-full rounded-lg border border-white/[0.12] bg-[#080a0a] px-3 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-amber-600/50"
            />
          </label>

          {feedback && (
            <p
              role={feedbackIsError ? "alert" : "status"}
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                feedbackIsError
                  ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-200"
                  : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
              }`}
            >
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={sending || !title.trim() || !message.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {sending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {sending ? "Sending…" : "Send notification"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/[0.09] bg-[#030505] p-5 sm:p-7">
        <h2 className="font-display text-base font-semibold text-white/90">
          Recent broadcasts
        </h2>
        <p className="mt-1 text-xs text-white/45">
          Review recent admin announcements and promotions.
        </p>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-white/45">
            <LoaderCircle size={17} className="mr-2 animate-spin" />
            Loading history…
          </div>
        ) : history.length ? (
          <div className="mt-5 divide-y divide-white/[0.07]">
            {history.map((notification) => (
              <article key={notification.id} className="py-4 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white/85">
                    {notification.title}
                  </h3>
                  <span className="shrink-0 rounded-full border border-amber-600/20 bg-amber-600/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-600">
                    {notification.type === "PROMOTION"
                      ? "Promotion"
                      : "Announcement"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-white/50">
                  {notification.message}
                </p>
                <p className="mt-3 text-[10px] text-white/35">
                  {notification.recipientCount} recipients
                  <span className="mx-2 text-white/20">·</span>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-dashed border-white/[0.1] px-4 py-8 text-center text-xs text-white/40">
            No notifications have been sent yet.
          </p>
        )}
      </section>
    </div>
  );
}
