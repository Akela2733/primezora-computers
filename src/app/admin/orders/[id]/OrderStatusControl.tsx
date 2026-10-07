"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  getAllowedOrderTransitions,
  getOrderStatusLabel,
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
} from "@/lib/order-status";

export default function OrderStatusControl({
  orderId,
  orderNumber,
  status,
  deliveryMethod,
}: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryMethod: string;
}) {
  const router = useRouter();
  const allowedStatuses = getAllowedOrderTransitions(
    status,
    deliveryMethod
  );
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">(
    allowedStatuses[0] ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!nextStatus || !allowedStatuses.includes(nextStatus)) {
      setError("Choose a valid next status.");
      return;
    }

    if (
      nextStatus === "CANCELLED" &&
      !window.confirm(
        `Cancel order ${orderNumber}? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = (await response.json()) as {
        error?: string;
        order?: { status: OrderStatus };
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status.");
      }

      router.refresh();
    } catch (updateError) {
      console.error("Order status update failed:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update order status."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {allowedStatuses.length === 0 ? (
        <p className="border border-white/[0.07] px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-white/35">
          {getOrderStatusLabel(status)} · No further status changes
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <select
            value={nextStatus}
            onChange={(event) =>
              setNextStatus(event.target.value as OrderStatus)
            }
            aria-label="Next order status"
            disabled={isSaving}
            className="h-11 min-w-0 flex-1 border border-white/[0.08] bg-[#080d13] px-3 text-[9px] uppercase tracking-[0.1em] text-white/70 outline-none focus:border-orange-500/50 disabled:opacity-50"
          >
            {allowedStatuses.map((value) => {
              const option = ORDER_STATUS_OPTIONS.find(
                (item) => item.value === value
              );
              return (
                <option key={value} value={value}>
                  {option?.label ?? value}
                </option>
              );
            })}
          </select>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 border border-orange-500/30 bg-orange-500 px-5 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Update Status"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[10px] leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}