"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContentEditor({
  initialContent,
}: {
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError("");
    setSaved(false);

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      setError("Enter valid JSON before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/storefront-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: parsedContent }),
      });
      const result = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to save storefront content.");
      }

      setSaved(true);
      router.refresh();
    } catch (saveError) {
      console.error("STOREFRONT CONTENT SAVE ERROR:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save storefront content."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label
        htmlFor="storefront-content"
        className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
      >
        Storefront content JSON
      </label>
      <textarea
        id="storefront-content"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setSaved(false);
        }}
        spellCheck={false}
        className="min-h-[70vh] w-full border border-white/10 bg-white/[0.02] p-4 font-mono text-xs leading-6 text-white/80 outline-none focus:border-amber-600/50"
      />
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-3 text-xs text-emerald-300">
          Storefront content saved.
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 inline-flex h-11 items-center justify-center bg-amber-600 px-6 text-[9px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-amber-500 disabled:cursor-wait disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save content"}
      </button>
    </div>
  );
}
