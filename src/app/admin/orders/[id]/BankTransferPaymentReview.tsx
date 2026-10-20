"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Receipt = {
  id: string;
  contentType: string;
  sizeBytes: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
};

type AuditEvent = {
  action: string;
  changedBy: string;
  reason: string | null;
  transactionId: string | null;
  transactionReference: string | null;
  transactionDate: Date | null;
  createdAt: Date;
};

export default function BankTransferPaymentReview({
  orderId,
  paymentStatus,
  paymentReference,
  total,
  receipts,
  auditEvents,
}: {
  orderId: string;
  paymentStatus: string | null;
  paymentReference: string | null;
  total: number;
  receipts: Receipt[];
  auditEvents: AuditEvent[];
}) {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pendingReceipt = receipts.find((receipt) => receipt.status === "PENDING");

  const submitReview = async (
    event: FormEvent<HTMLFormElement>,
    body: Record<string, unknown>
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to update this payment.");
      }
      setMessage(
        body.action === "approve"
          ? "Bank payment verified; the order is now confirmed."
          : "Receipt rejected. The customer may submit a new receipt."
      );
      setTransactionId("");
      setTransactionReference("");
      setTransactionDate("");
      setRejectionReason("");
      setVerificationConfirmed(false);
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to update this payment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="border border-white/[0.07] bg-[#030505]">
      <div className="border-b border-white/[0.06] p-5">
        <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white/75">
          Bank transfer verification
        </p>
        <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-3">
          <Detail label="Payment status" value={paymentStatus ?? "PAYMENT_PENDING"} />
          <Detail label="Expected amount" value={`LKR ${total.toLocaleString("en-LK")}`} />
          <Detail label="Payment reference" value={paymentReference ?? "—"} />
        </dl>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
            Submitted receipts
          </h3>
          {receipts.length ? (
            <ul className="mt-3 space-y-3">
              {receipts.map((receipt) => (
                <li
                  key={receipt.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-white/[0.07] p-3"
                >
                  <div>
                    <p className="text-xs text-white/75">
                      {receipt.contentType} · {(receipt.sizeBytes / 1024).toFixed(0)} KB ·{" "}
                      {receipt.status}
                    </p>
                    <p className="mt-1 text-[10px] text-white/40">
                      Submitted {new Date(receipt.submittedAt).toLocaleString("en-LK")}
                    </p>
                    {receipt.rejectionReason && (
                      <p className="mt-1 text-[10px] text-rose-300">
                        Rejection: {receipt.rejectionReason}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/api/admin/orders/${encodeURIComponent(orderId)}/receipt?receiptId=${encodeURIComponent(receipt.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold uppercase tracking-wide text-orange-400 underline underline-offset-4 hover:text-orange-300"
                  >
                    Open private receipt
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-white/40">No receipts submitted yet.</p>
          )}
        </div>

        {paymentStatus === "PAYMENT_VERIFICATION_PENDING" && pendingReceipt && (
          <div className="grid gap-5 border-t border-white/[0.07] pt-5 lg:grid-cols-2">
            <form
              onSubmit={(event) =>
                submitReview(event, {
                  action: "approve",
                  receiptId: pendingReceipt.id,
                  transactionId,
                  transactionReference,
                  transactionDate,
                  confirmBankVerification: verificationConfirmed,
                })
              }
              className="space-y-3"
            >
              <h3 className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Approve verified payment
              </h3>
              <p className="text-[10px] leading-5 text-white/45">
                First verify the incoming credit in the bank&apos;s official app,
                statement, or another bank-approved source. Match the expected
                amount, bank reference, date, and transaction ID.
              </p>
              <ReviewInput
                label="Bank transaction ID"
                value={transactionId}
                onChange={setTransactionId}
                required
              />
              <ReviewInput
                label="Bank transaction reference"
                value={transactionReference}
                onChange={setTransactionReference}
                required
              />
              <ReviewInput
                label="Transaction date"
                type="date"
                value={transactionDate}
                onChange={setTransactionDate}
                required
              />
              <label className="flex gap-2 text-[10px] leading-5 text-white/60">
                <input
                  type="checkbox"
                  checked={verificationConfirmed}
                  onChange={(event) => setVerificationConfirmed(event.target.checked)}
                  required
                />
                I independently verified the actual bank credit and confirmed
                the amount matches LKR {total.toLocaleString("en-LK")}.
              </label>
              <button
                type="submit"
                disabled={isSaving || !verificationConfirmed}
                className="min-h-10 rounded-md bg-emerald-600 px-4 text-[9px] font-bold uppercase tracking-wide text-white disabled:cursor-wait disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Approve bank payment"}
              </button>
            </form>

            <form
              onSubmit={(event) =>
                submitReview(event, {
                  action: "reject",
                  receiptId: pendingReceipt.id,
                  reason: rejectionReason,
                })
              }
              className="space-y-3"
            >
              <h3 className="text-[9px] font-bold uppercase tracking-[0.14em] text-rose-300">
                Reject receipt
              </h3>
              <label className="block text-[9px] font-semibold uppercase tracking-wide text-white/40">
                Reason (customer can resubmit)
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  maxLength={500}
                  required
                  rows={3}
                  className="mt-2 w-full border border-white/[0.1] bg-white/[0.03] p-3 text-xs text-white/80 outline-none focus:border-orange-500/50"
                />
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-10 rounded-md border border-rose-500/30 px-4 text-[9px] font-bold uppercase tracking-wide text-rose-300 disabled:cursor-wait disabled:opacity-50"
              >
                Reject receipt
              </button>
            </form>
          </div>
        )}

        {(message || error) && (
          <p role={error ? "alert" : "status"} className={`text-xs ${error ? "text-rose-300" : "text-emerald-300"}`}>
            {error || message}
          </p>
        )}

        <div className="border-t border-white/[0.07] pt-4">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
            Payment audit history
          </h3>
          {auditEvents.length ? (
            <ol className="mt-3 space-y-3">
              {auditEvents.map((event, index) => (
                <li key={`${event.createdAt}-${index}`} className="text-[10px] leading-5 text-white/50">
                  <strong className="text-white/75">{event.action.replaceAll("_", " ")}</strong>
                  {" · "}{event.changedBy}
                  {" · "}{new Date(event.createdAt).toLocaleString("en-LK")}
                  {event.reason && <span> · {event.reason}</span>}
                  {event.transactionId && <span> · Bank transaction {event.transactionId}</span>}
                  {event.transactionReference && <span> · Reference {event.transactionReference}</span>}
                  {event.transactionDate && <span> · Date {new Date(event.transactionDate).toLocaleDateString("en-LK")}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-white/40">No payment reviews recorded.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">{label}</dt>
      <dd className="mt-1 break-words text-xs text-white/70">{value}</dd>
    </div>
  );
}

function ReviewInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-[9px] font-semibold uppercase tracking-wide text-white/40">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={128}
        required={required}
        className="mt-2 h-10 w-full border border-white/[0.1] bg-white/[0.03] px-3 text-xs text-white/80 outline-none focus:border-orange-500/50"
      />
    </label>
  );
}
