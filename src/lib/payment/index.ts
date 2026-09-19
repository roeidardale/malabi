import type { PaymentProvider } from "./PaymentProvider";
import { mockProvider } from "./mockProvider";
import { tranzilaProvider } from "./tranzilaProvider";

export type { PaymentProvider, OrderWithItems, CreatePaymentResult, PaymentCallbackResult } from "./PaymentProvider";

/**
 * Picks the active provider from PAYMENT_PROVIDER ("mock" | "tranzila").
 * Falls back to mock if Tranzila is selected but TRANZILA_TERMINAL isn't set,
 * so the checkout flow always works locally even before Tranzila is wired up.
 */
export function getActivePaymentProvider(): PaymentProvider {
  const selected = process.env.PAYMENT_PROVIDER ?? "mock";

  if (selected === "tranzila" && process.env.TRANZILA_TERMINAL) {
    return tranzilaProvider;
  }

  return mockProvider;
}
