"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileUp } from "lucide-react";

type BankTransferReceiptUploadProps = {
  orderId: string;
  paymentStatus: string;
  rejectionReason?: string | null;
  onUploaded?: () => void;
};

export default function BankTransferReceiptUpload({
  orderId,
  paymentStatus,
  rejectionReason,
  onUploaded,
}: BankTransferReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a receipt image or PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Receipt files must be 10 MB or smaller.");
      return;
    }

    const body = new FormData();
    body.set("file", file);
    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/customer/orders/${encodeURIComponent(orderId)}/receipt`,
        { method: "POST", body }
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to upload the receipt.");
      }
      if (inputRef.current) inputRef.current.value = "";
      setSuccess(
        "Receipt received. Your order is awaiting payment verification; upload does not confirm payment."
      );
      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the receipt. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-6 border-t border-white/[0.08] pt-6 text-left">
      <div className="flex items-center gap-2 text-orange-400">
        <FileUp size={16} />
        <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.16em]">
          Transfer receipt
        </h3>
      </div>
      {paymentStatus === "PAYMENT_VERIFICATION_PENDING" ? (
        <p className="mt-3 text-xs leading-6 text-amber-300">
          Awaiting payment verification. A receipt is not proof that the bank
          transfer cleared, and your order is not paid until Primezora verifies
          the credit.
        </p>
      ) : paymentStatus === "PAID" ? (
        <p className="mt-3 text-xs leading-6 text-emerald-300">
          Payment verified by Primezora.
        </p>
      ) : paymentStatus === "CANCELLED" ? (
        <p className="mt-3 text-xs leading-6 text-white/45">
          This order was cancelled.
        </p>
      ) : (
        <>
          {paymentStatus === "PAYMENT_REJECTED" && (
            <p className="mt-3 text-xs leading-6 text-rose-300">
              {rejectionReason ||
                "The submitted receipt was not accepted. Review the payment instructions and upload a new receipt."}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-white/45">
              JPEG, PNG, WebP, or PDF · up to 10 MB
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={isUploading}
                className="mt-2 block w-full text-xs text-white/60 file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:text-[9px] file:font-bold file:uppercase file:text-white/75 disabled:opacity-50"
              />
            </label>
            <p className="text-[10px] leading-5 text-white/40">
              Uploading only submits the receipt for review. An administrator
              must independently verify the actual bank credit before payment
              is confirmed.
            </p>
            <button
              type="submit"
              disabled={isUploading}
              className="min-h-10 rounded-md bg-orange-500 px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-black transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload receipt"}
            </button>
          </form>
        </>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs leading-5 text-emerald-300">
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
