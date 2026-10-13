"use client";

import ImageUpload from "@/components/admin/ImageUpload";
import { ChangeEvent, useRef, useState } from "react";
import { AlertCircle, Loader2, UploadCloud } from "lucide-react";

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

  const addImage = () => onChange((current) => [...current, ""]);
  const updateImage = (index: number, image: string) => {
    onChange((current) =>
      current.map((currentImage, currentIndex) =>
        currentIndex === index ? image : currentImage
      )
    );
  };
  const removeImage = (index: number) =>
    onChange((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;

    setUploadError("");
    setUploadNotice("");

    const availableSlots = MAX_PRODUCT_GALLERY_IMAGES - images.length;
    if (files.length > availableSlots) {
      setUploadError(
        `You can add ${availableSlots} more image${availableSlots === 1 ? "" : "s"}. The product gallery limit is ${MAX_PRODUCT_GALLERY_IMAGES}.`
      );
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()) ||
        file.size === 0 ||
        file.size > MAX_IMAGE_SIZE_BYTES
    );
    if (invalidFile) {
      setUploadError(
        !ALLOWED_IMAGE_TYPES.has(invalidFile.type.toLowerCase())
          ? `${invalidFile.name} is not a supported image. Use JPEG, PNG, WebP, AVIF, or GIF.`
          : invalidFile.size === 0
            ? `${invalidFile.name} is empty. Select a different image.`
            : `${invalidFile.name} exceeds the 5 MB limit.`
      );
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scope", "products");
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok || typeof result.url !== "string") {
          throw new Error(
            `${file.name}: ${result.error || "Failed to upload image."}`
          );
        }
        uploadedUrls.push(result.url);
      }

      onChange((current) => [...current, ...uploadedUrls]);
      setUploadNotice(
        `${uploadedUrls.length} gallery image${uploadedUrls.length === 1 ? "" : "s"} uploaded successfully.`
      );
    } catch (caught) {
      if (uploadedUrls.length > 0) {
        onChange((current) => [...current, ...uploadedUrls]);
      }
      const message =
        caught instanceof Error ? caught.message : "Gallery upload failed.";
      console.error("Product gallery upload error:", caught);
      setUploadError(
        uploadedUrls.length > 0
          ? `${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded; the rest failed. ${message}`
          : message
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-6 border-t border-white/[0.07] pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xs font-bold uppercase text-white/80">
            Product Gallery
          </h3>
          <p className="mt-1 text-[10px] leading-5 text-white/35">
            Upload additional product photos shown in the product gallery.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={Array.from(ALLOWED_IMAGE_TYPES).join(",")}
            multiple
            onChange={uploadFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= MAX_PRODUCT_GALLERY_IMAGES}
            className="inline-flex items-center gap-2 border border-amber-600/35 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-amber-500 transition hover:border-amber-600/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <UploadCloud size={13} />
            )}
            {isUploading ? "Uploading..." : "Upload Multiple"}
          </button>
          <button
            type="button"
            onClick={addImage}
            disabled={
              isUploading || images.length >= MAX_PRODUCT_GALLERY_IMAGES
            }
            className="border border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white/60 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add One
          </button>
        </div>
      </div>
      <p className="mb-4 text-[9px] text-white/30">
        Select multiple images at once. JPEG, PNG, WebP, AVIF or GIF; maximum
        5 MB each and {MAX_PRODUCT_GALLERY_IMAGES} gallery images per product.
      </p>

      {uploadError && (
        <p
          role="alert"
          className="mb-4 flex items-center gap-2 border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[10px] leading-5 text-red-300"
        >
          <AlertCircle size={14} className="shrink-0" />
          {uploadError}
        </p>
      )}
      {uploadNotice && (
        <p
          role="status"
          className="mb-4 border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] text-emerald-300"
        >
          {uploadNotice}
        </p>
      )}

      {images.length > 0 ? (
        <div className="space-y-5">
          {images.map((image, index) => (
            <div
              key={`gallery-${index}`}
              className="border border-white/[0.06] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">
                  Gallery Image {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-[9px] font-bold uppercase tracking-wider text-red-300/70 transition hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <ImageUpload
                label={`Gallery Image ${index + 1}`}
                value={image}
                onChange={(value) => updateImage(index, value)}
                allowUrlEntry={false}
                previewDescription="Additional product gallery image."
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-white/10 px-4 py-5 text-center text-[10px] text-white/30">
          No additional gallery images.
        </p>
      )}
    </section>
  );
}
