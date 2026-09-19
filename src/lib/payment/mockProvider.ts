import type { PaymentProvider, PaymentCallbackResult } from "./PaymentProvider";

/**
 * Auto-approve provider used for local development and whenever Tranzila
 * isn't configured. The pay page renders a "simulate payment" button that
 * calls the `approveMockPayment` server action directly — this provider
 * doesn't receive a callback request the way Tranzila does.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createPayment() {
    return { mode: "mock" };
  },

  verifyCallback(): PaymentCallbackResult {
    throw new Error("mockProvider does not use callback verification");
  },
};
