import { agorotToShekelString } from "@/lib/money";
import type {
  PaymentProvider,
  PaymentCallbackResult,
  OrderWithItems,
} from "./PaymentProvider";

/**
 * Tranzila hosted-iframe integration (test/sandbox terminal).
 *
 * NOT verified against a live Tranzila terminal — TRANZILA_TERMINAL is empty
 * by default and the app falls back to mockProvider until it's set (see
 * getActivePaymentProvider in index.ts). Before using this for real:
 *   1. Get a Tranzila sandbox terminal name and set TRANZILA_TERMINAL in .env.
 *   2. Confirm the current iframe query parameters and callback field names
 *      (`Response`, transaction id field, etc.) against Tranzila's current
 *      docs -- these have changed across Tranzila API versions and are not
 *      guaranteed to match what's implemented here.
 */

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export const tranzilaProvider: PaymentProvider = {
  name: "tranzila",

  async createPayment(order: OrderWithItems) {
    const terminal = process.env.TRANZILA_TERMINAL;
    if (!terminal) {
      throw new Error("TRANZILA_TERMINAL is not configured");
    }

    const baseUrl = getAppBaseUrl();
    const successUrl = `${baseUrl}/api/payment/tranzila/callback?orderId=${order.id}&result=success`;
    const failUrl = `${baseUrl}/api/payment/tranzila/callback?orderId=${order.id}&result=fail`;

    const query = new URLSearchParams({
      sum: agorotToShekelString(order.totalAgorot),
      currency: "1",
      cred_type: "1",
      success_url_address: successUrl,
      fail_url_address: failUrl,
      pdesc: `הזמנה #${order.orderNumber}`,
      contact: order.customerName,
      phone: order.customerPhone,
      ...(order.customerEmail ? { email: order.customerEmail } : {}),
    });

    return {
      mode: "tranzila" as const,
      iframeUrl: `https://direct.tranzila.com/${terminal}/iframenew.php?${query.toString()}`,
    };
  },

  verifyCallback(params: URLSearchParams): PaymentCallbackResult {
    const orderId = params.get("orderId");
    if (!orderId) {
      throw new Error("Missing orderId in Tranzila callback");
    }

    const result = params.get("result");
    const response = params.get("Response");
    const approved = result === "success" && (response === null || response === "000");

    return {
      approved,
      orderId,
      transactionId: params.get("TranzilaTK") ?? params.get("index") ?? undefined,
    };
  },
};
