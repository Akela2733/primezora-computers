"use client";

import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export default function ImageUpload({
  value,
  onChange,
  label = "Product Image",
  required = false,
}: ImageUploadProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError("");
    setUploadSuccess("");

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setUploadError(
        "Invalid file format. Please upload a JPEG, PNG, WebP, AVIF, or GIF image."
      );
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(
        `File size (${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB) exceeds the 5 MB limit.`
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      onChange(data.url);
      setUploadSuccess(
        `Uploaded successfully via ${
          data.provider === "supabase" ? "Supabase Storage" : "Local Storage"
        }!`
      );
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    onChange("");
    setUploadError("");
    setUploadSuccess("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
          {label} {required && <span className="text-orange-400">*</span>}
        </label>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 border border-white/[0.08] bg-[#05090f] p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${
              mode === "upload"
                ? "bg-orange-500/15 text-orange-400"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <UploadCloud size={12} />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${
              mode === "url"
                ? "bg-orange-500/15 text-orange-400"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <LinkIcon size={12} />
            Direct URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div>
          {/* Dropzone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? "border-orange-500 bg-orange-500/10"
                : "border-white/[0.1] bg-[#05090f] hover:border-white/20"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={onFileInputChange}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-orange-400" />
                <p className="font-display text-xs font-semibold text-white/75">
                  Uploading and processing image...
                </p>
                <p className="text-[10px] text-white/40">
                  Validating format and storing securely
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03] text-orange-400">
                  <UploadCloud size={20} />
                </div>
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-white/80">
                  Drag & Drop image here, or{" "}
                  <span className="text-orange-400 underline">browse</span>
                </p>
                <p className="text-[10px] text-white/35">
                  Supports JPEG, PNG, WebP, AVIF, GIF (Max {MAX_SIZE_MB}MB)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or /products/item.jpg"
            className="w-full border border-white/[0.08] bg-[#05090f] px-4 py-3 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
          />
          <p className="text-[9px] text-white/30">
            Paste a public image URL or a local path within `/products/`.
          </p>
        </div>
      )}

      {/* Upload Feedback Messages */}
      {uploadError && (
        <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Image Preview & Details */}
      {value && (
        <div className="border border-white/[0.07] bg-[#05090f] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-white/[0.08] bg-black/40">
                <img
                  src={value}
                  alt="Product preview"
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <ImageIcon
                  size={24}
                  className="pointer-events-none absolute text-white/10"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400">
                  Active Image
                </p>
                <p className="break-all font-mono text-[10px] text-white/60">
                  {value}
                </p>
                <p className="text-[9px] text-white/30">
                  Will be displayed on shop listing, gallery, and cart.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 border border-white/[0.08] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              title="Remove image"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
