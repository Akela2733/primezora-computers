"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

type ImageField = {
  path: (string | number)[];
  value: string;
};

function collectImageFields(
  value: unknown,
  path: (string | number)[] = []
): ImageField[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectImageFields(item, [...path, index])
    );
  }

  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...path, key];
    if ((key === "image" || key === "logo") && typeof child === "string") {
      return [{ path: childPath, value: child }];
    }
    return collectImageFields(child, childPath);
  });
}

function formatImageFieldLabel(path: (string | number)[]): string {
  return path
    .map((part) =>
      typeof part === "number"
        ? `#${part + 1}`
        : part.replace(/([a-z])([A-Z])/g, "$1 $2")
    )
    .join(" / ");
}

function updateImageField(
  content: string,
  path: (string | number)[],
  image: string
): string {
  const parsed: unknown = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Storefront content must be a JSON object.");
  }

  let current: unknown = parsed;
  for (const segment of path.slice(0, -1)) {
    if (Array.isArray(current) && typeof segment === "number") {
      current = current[segment];
    } else if (
      typeof current === "object" &&
      current !== null &&
      typeof segment === "string"
    ) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error("Image field no longer exists in storefront content.");
    }
  }

  const lastSegment = path.at(-1);
  if (Array.isArray(current) && typeof lastSegment === "number") {
    current[lastSegment] = image;
  } else if (
    typeof current === "object" &&
    current !== null &&
    typeof lastSegment === "string"
  ) {
    (current as Record<string, unknown>)[lastSegment] = image;
  } else {
    throw new Error("Image field no longer exists in storefront content.");
  }

  return JSON.stringify(parsed, null, 2);
}

export default function ContentEditor({
  initialContent,
}: {
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const contentRef = useRef(initialContent);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  let imageFields: ImageField[] = [];
  let imageFieldsError = "";
  try {
    imageFields = collectImageFields(JSON.parse(content));
  } catch {
    imageFieldsError = "Enter valid JSON to manage the storefront images.";
  }

  const handleImageChange = (field: ImageField, image: string) => {
    try {
      const updatedContent = updateImageField(
        contentRef.current,
        field.path,
        image
      );
      contentRef.current = updatedContent;
      setContent(updatedContent);
      setSaved(false);
      setError("");
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Failed to update storefront image."
      );
    }
  };

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
      <section className="mb-8 border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-display text-sm font-bold uppercase text-white/85">
            Storefront Images
          </h2>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Upload or replace the logo, homepage hero, promotional banner, and
            other storefront images. Save the content after uploading to apply
            the image references.
          </p>
        </div>
        {imageFieldsError ? (
          <p role="status" className="text-xs text-amber-300">
            {imageFieldsError}
          </p>
        ) : imageFields.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {imageFields.map((field) => (
              <ImageUpload
                key={field.path.join(".")}
                label={formatImageFieldLabel(field.path)}
                value={field.value}
                onChange={(image) => handleImageChange(field, image)}
                allowUrlEntry={false}
                uploadScope="storefront"
                previewDescription="Saved with the storefront content."
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/40">
            No image fields found in the current storefront content.
          </p>
        )}
      </section>

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
          contentRef.current = event.target.value;
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
