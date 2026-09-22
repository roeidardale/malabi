export interface SmsProvider {
  name: string;
  /** Kicks off an OTP send to `phone` (E.164). */
  startVerification(phone: string): Promise<{ status: string }>;
  /** Checks a customer-entered code against the pending verification for `phone`. */
  checkVerification(phone: string, code: string): Promise<{ approved: boolean }>;
}
