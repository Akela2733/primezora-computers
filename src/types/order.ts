import type { Product } from "@/data/products";
import type { PaymentMethod } from "@/lib/payment";

export type DeliveryMethod = "delivery" | "pickup";

export type { PaymentMethod };

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
};

export type Order = {
  id: string;
  orderNumber: string;

  customer: CustomerDetails;

  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  total: number;

  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;

  status: OrderStatus;

  createdAt: string;
};