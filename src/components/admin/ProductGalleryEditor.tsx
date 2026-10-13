"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AlertCircle, Loader2, Trash2, UploadCloud } from "lucide-react";

const MAX_PRODUCT_GALLERY_IMAGES = 20;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

type ProductGalleryEditorProps = {
  images: string[];
  onChange: (
    images: string[] | ((current: string[]) => string[])
  ) => void;
};

export default function ProductGalleryEditor({
  images,
  onChange,
}: ProductGalleryEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  const removeImage = (index: number) =>
    onChange((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setUploadError("");
    setUploadNotice("");

    if (images.length >= MAX_PRODUCT_GALLERY_IMAGES) {
      setUploadError(
        `The product gallery limit is ${MAX_PRODUCT_GALLERY_IMAGES} images. Remove an image before uploading another.`
      );
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setUploadError(
        "Unsupported image. Use JPEG, PNG, WebP, AVIF, or GIF."
      );
      return;
    }
    if (file.size === 0) {
      setUploadError("The selected image is empty.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError(`${file.name} exceeds the 5 MB limit.`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scope", "products");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(result.error || "Failed to upload gallery image.");
      }

      onChange((current) => [...current, result.url]);
      setUploadNotice("Gallery image uploaded successfully.");
    } catch (caught) {
      console.error("Product gallery upload error:", caught);
      setUploadError(
        caught instanceof Error ? caught.message : "Gallery upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-6 border-t border-white/[0.07] pt-6">
      <div className="mb-4">
        <h3 className="font-display text-xs font-bold uppercase text-white/80">
          Product Gallery
        </h3>
        <p className="mt-1 text-[10px] leading-5 text-white/35">
          Upload images one at a time. Each image appears below; use its delete
          button to remove it.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={Array.from(ALLOWED_IMAGE_TYPES).join(",")}
        onChange={uploadFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={
          isUploading || images.length >= MAX_PRODUCT_GALLERY_IMAGES
        }
        className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 bg-[#030505] p-5 text-center transition hover:border-amber-600/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 size={22} className="animate-spin text-amber-500" />
        ) : (
          <UploadCloud size={22} className="text-amber-500" />
        )}
        <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-white/75">
          {isUploading ? "Uploading image..." : "Click to upload gallery image"}
        </span>
        <span className="text-[9px] text-white/35">
          JPEG, PNG, WebP, AVIF, or GIF · Max 5 MB · Up to{" "}
          {MAX_PRODUCT_GALLERY_IMAGES} images
        </span>
      </button>

      {uploadError && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-2 border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[10px] leading-5 text-red-300"
        >
          <AlertCircle size={14} className="shrink-0" />
          {uploadError}
        </p>
      )}
      {uploadNotice && (
        <p
          role="status"
          className="mt-3 border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] text-emerald-300"
        >
          {uploadNotice}
        </p>
      )}

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="group relative aspect-square overflow-hidden border border-white/10 bg-[#030505]"
            >
              <img
                src={image}
                alt={`Product gallery image ${index + 1}`}
                className="h-full w-full object-contain p-1.5"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Delete gallery image ${index + 1}`}
                title="Delete image"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-red-600/90 text-white opacity-100 transition hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <Trash2 size={14} />
              </button>
              <span className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1.5 py-1 text-center text-[8px] text-white/70">
                Image {index + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 border border-dashed border-white/10 px-4 py-4 text-center text-[10px] text-white/30">
          No additional gallery images yet.
        </p>
      )}
    </section>
  );
}
