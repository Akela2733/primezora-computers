"use client";

import { useEffect, useState } from "react";
import { Bell, LoaderCircle, Mail, Megaphone } from "lucide-react";

type Preferences = {
  restockAlertsEnabled: boolean;
  orderUpdateEmailsEnabled: boolean;
  promotionalEmailsEnabled: boolean;
};

const PREFERENCE_OPTIONS: {
  key: keyof Preferences;
  title: string;
  description: string;
  icon: typeof Bell;
}[] = [
  {
    key: "restockAlertsEnabled",
    title: "Wishlist restock alerts",
    description:
      "Get an email when a product saved to your account wishlist is available again.",
    icon: Bell,
  },
  {
    key: "orderUpdateEmailsEnabled",
    title: "Order update emails",
    description:
      "Receive confirmation and status updates for orders placed on your account.",
    icon: Mail,
  },
  {
    key: "promotionalEmailsEnabled",
    title: "Promotional emails",
    description:
      "Opt in to occasional offers, new-product news and store announcements.",
    icon: Megaphone,
  },
];

export function WebsitePreferencesEditor() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/customer/preferences", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          preferences?: Preferences;
          error?: string;
        };
        if (!response.ok || !data.preferences) {
          throw new Error(data.error || "Unable to load your preferences.");
        }
        if (!cancelled) setPreferences(data.preferences);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your preferences."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updatePreference(key: keyof Preferences) {
    if (!preferences || savingKey) return;

    const nextValue = !preferences[key];
    setPreferences({ ...preferences, [key]: nextValue });
    setSavingKey(key);
    setMessage("");

    try {
      const response = await fetch("/api/customer/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      const data = (await response.json()) as {
        preferences?: Preferences;
        error?: string;
      };
      if (!response.ok || !data.preferences) {
        throw new Error(data.error || "Unable to save your preference.");
      }
      setPreferences(data.preferences);
      setMessage("Your preferences have been saved.");
    } catch (error) {
      setPreferences((current) =>
        current ? { ...current, [key]: !nextValue } : current
      );
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your preference."
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-white/[0.09] bg-[#030505] text-sm text-white/55">
          <LoaderCircle size={18} className="mr-2 animate-spin text-amber-600" />
          Loading your preferences…
        </div>
      ) : preferences ? (
        <div className="space-y-3">
          {PREFERENCE_OPTIONS.map(({ key, title, description, icon: Icon }) => {
            const checked = preferences[key];
            const saving = savingKey === key;
            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-xl border border-white/[0.09] bg-[#030505] p-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-600/20 bg-amber-600/[0.08] text-amber-600">
                  <Icon size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-white/90">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={title}
                  disabled={Boolean(savingKey)}
                  onClick={() => void updatePreference(key)}
                  className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
                    checked
                      ? "border-amber-600 bg-amber-600"
                      : "border-white/20 bg-white/[0.06]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      checked ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
                {saving && (
                  <LoaderCircle
                    size={15}
                    className="shrink-0 animate-spin text-amber-600"
                    aria-label={`Saving ${title}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200"
        >
          {message}
        </div>
      )}
      {message && preferences && (
        <p
          role="status"
          className={`text-xs ${
            message.includes("saved") ? "text-emerald-300" : "text-rose-200"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
