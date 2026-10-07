/**
 * @file src/lib/notifications/types.ts
 *
 * Types and interfaces for the Primezora Order Notification System.
 */

export type NotificationEventType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_PROCESSING"
  | "ORDER_SHIPPED"
  | "READY_FOR_PICKUP"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED";

export interface NotificationOrderItem {
  productName: string;
  quantity: number;
  productPrice: number;
}

export interface NotificationOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  deliveryMethod: string; // "delivery" | "pickup"
  address?: string | null;
  city?: string | null;
  province?: string | null;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: NotificationOrderItem[];
  status?: string;
  notes?: string | null;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  skipped?: boolean;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}
