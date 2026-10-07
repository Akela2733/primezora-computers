"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { MAX_STOCK_QUANTITY } from "@/lib/inventory";

type InventoryUpdateResponse = {
  error?: string;
  product?: {
    stockQuantity: number;
    inStock: boolean;
    updatedAt: string;
  };
};

export default function InventoryStockEditor({
  productId,
  stockQuantity,
  updatedAt,
}: {
  productId: string;
  stockQuantity: number;
  updatedAt: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(stockQuantity));
  const [expectedStockQuantity, setExpectedStockQuantity] =
    useState(stockQuantity);
  const [inventoryVersion, setInventoryVersion] = useState(updatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaved(false);

    const nextQuantity = Number(quantity);
    if (
      quantity.trim() === "" ||
      !Number.isSafeInteger(nextQuantity) ||
      nextQuantity < 0 ||
      nextQuantity > MAX_STOCK_QUANTITY
    ) {
      setError("Enter a whole stock quantity of 0 or more.");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/inventory/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stockQuantity: nextQuantity,
            expectedStockQuantity,
            expectedUpdatedAt: inventoryVersion,
          }),
        }
      );

      const data =
        (await response.json()) as InventoryUpdateResponse;

      if (!response.ok || !data.product) {
        throw new Error(
          data.error || "Failed to update inventory."
        );
      }

      setQuantity(String(data.product.stockQuantity));
      setExpectedStockQuantity(data.product.stockQuantity);
      setInventoryVersion(data.product.updatedAt);
      setSaved(true);
      router.refresh();
    } catch (updateError) {
      console.error("Inventory update failed:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update inventory."
      );
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-w-56">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={MAX_STOCK_QUANTITY}
          step={1}
          inputMode="numeric"
          aria-label={`Stock quantity for product ${productId}`}
          value={quantity}
          onChange={(event) => {
            setQuantity(event.target.value);
            setError("");
            setSaved(false);
          }}
          className="h-9 w-24 border border-white/[0.08] bg-black/20 px-3 text-xs text-white outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-9 items-center justify-center gap-1.5 border border-orange-500/25 px-3 text-[8px] font-bold uppercase tracking-[0.1em] text-orange-300 transition hover:border-orange-500/50 disabled:cursor-wait disabled:opacity-50"
        >
          <Save size={12} />
          {isSaving ? "Saving" : "Save"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 max-w-64 text-[9px] leading-4 text-red-300">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="mt-2 text-[9px] text-emerald-300">
          Stock updated.
        </p>
      )}
    </div>
  );
}