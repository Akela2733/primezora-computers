import { OrderStatus as PrismaOrderStatus } from "@/generated/prisma/enums";

export type OrderStatus = keyof typeof PrismaOrderStatus;
export type DeliveryMethod = "delivery" | "pickup";

export const ORDER_STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
}[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function isOrderStatus(
  value: unknown
): value is OrderStatus {
  return ORDER_STATUS_OPTIONS.some(
    (option) => option.value === value
  );
}

export function getAllowedOrderTransitions(
  currentStatus: OrderStatus,
  deliveryMethod: string
): OrderStatus[] {
  switch (currentStatus) {
    case "PENDING":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return deliveryMethod === "pickup"
        ? ["READY_FOR_PICKUP", "CANCELLED"]
        : ["SHIPPED", "CANCELLED"];
    case "SHIPPED":
    case "READY_FOR_PICKUP":
      return ["COMPLETED"];
    case "COMPLETED":
    case "CANCELLED":
      return [];
  }
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}