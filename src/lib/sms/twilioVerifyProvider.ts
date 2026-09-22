import type { SmsProvider } from "./SmsProvider";

/**
 * Twilio Verify integration for phone+OTP login.
 *
 * Twilio Verify owns the whole OTP lifecycle -- code generation, delivery,
 * expiry (10 min by default, configurable on the Verify Service in the
 * Twilio Console), and wrong-attempt lockout -- so this app never generates,
 * stores, or hashes a code itself. Requires TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID (Console -> Verify ->
 * Services) to be set in .env. On a trial Twilio account, only phone numbers
 * verified in the Console (Phone Numbers -> Verified Caller IDs) can receive
 * messages.
 */

const VERIFY_BASE_URL = "https://verify.twilio.com/v2";

function authHeader(): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not configured");
  }
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function serviceSid(): string {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
  }
  return sid;
}

async function callVerify(path: string, body: Record<string, string>) {
  const response = await fetch(`${VERIFY_BASE_URL}/Services/${serviceSid()}/${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Twilio Verify ${path} failed: ${data?.message ?? response.statusText}`);
  }
  return data;
}

export const twilioVerifyProvider: SmsProvider = {
  name: "twilio",

  async startVerification(phone: string) {
    const data = await callVerify("Verifications", { To: phone, Channel: "sms" });
    return { status: data.status as string };
  },

  async checkVerification(phone: string, code: string) {
    try {
      const data = await callVerify("VerificationCheck", { To: phone, Code: code });
      return { approved: data.status === "approved" };
    } catch {
      // Wrong code, expired verification, or max-attempts reached all surface
      // as a non-2xx from Twilio -- treat every failure mode as "not approved"
      // rather than distinguishing them, so we never leak which case it was.
      return { approved: false };
    }
  },
};
