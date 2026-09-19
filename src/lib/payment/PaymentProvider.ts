import type { Order, OrderItem } from "@prisma/client";

export type OrderWithItems = Order & { items: OrderItem[] };

export interface CreatePaymentResult {
  /** Which provider is handling this payment, so the pay page knows what to render. */
  mode: "mock" | "tranzila";
  /** For "tranzila": the hosted iframe URL to embed. Unused for "mock". */
  iframeUrl?: string;
}

export interface PaymentCallbackResult {
  approved: boolean;
  orderId: string;
  transactionId?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(order: OrderWithItems): Promise<CreatePaymentResult>;
  verifyCallback(params: URLSearchParams): PaymentCallbackResult;
}
