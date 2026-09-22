import type { SmsProvider } from "./SmsProvider";
import { twilioVerifyProvider } from "./twilioVerifyProvider";

export type { SmsProvider } from "./SmsProvider";

/** Single import point for the active SMS provider, mirroring src/lib/payment/. */
export function getActiveSmsProvider(): SmsProvider {
  return twilioVerifyProvider;
}
