"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductActions({
  productId,
  productName,
  inStock,
}: {
  productId: string;
  productName: string;
  inStock: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "toggle" | "delete" | null
  >(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStock = async () => {
    if (pendingAction) return;

    const action = inStock
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${productName}"?`
    );

    if (!confirmed) return;

  setPendingAction("toggle");
  setActionError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inStock: !inStock,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update product status."
        );
      }

      router.push(
        `/admin/products?notice=${inStock ? "disabled" : "enabled"}`
      );
    } catch (error) {
      console.error(error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to update product status."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (pendingAction) return;

    const confirmed = window.confirm(
      `Permanently delete "${productName}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

  setPendingAction("delete");
  setActionError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete product."
        );
      }

      router.push(
        "/admin/products?notice=deleted"
      );
    } catch (error) {
      console.error(error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actionError && (
        <p
          role="alert"
          className="basis-full text-left text-[9px] leading-4 text-red-300"
        >
          {actionError}
        </p>
      )}

      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex h-8 items-center justify-center border border-white/[0.08] px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:border-orange-500/40 hover:text-orange-400"
      >
        Edit
      </Link>

      <button
        type="button"
        onClick={handleToggleStock}
        disabled={pendingAction !== null}
        className={`inline-flex h-8 items-center justify-center border px-3 text-[8px] font-bold uppercase tracking-[0.12em] transition ${
          inStock
            ? "border-yellow-500/20 text-yellow-400 hover:border-yellow-500/50"
            : "border-green-500/20 text-green-400 hover:border-green-500/50"
        }`}
      >
        {pendingAction === "toggle"
          ? "Updating..."
          : inStock
            ? "Disable"
            : "Enable"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={pendingAction !== null}
        className="inline-flex h-8 items-center justify-center border border-red-500/20 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-red-400 transition hover:border-red-500/50 hover:bg-red-500/[0.05] disabled:cursor-wait disabled:opacity-50"
      >
        {pendingAction === "delete" ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}