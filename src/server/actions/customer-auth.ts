"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { associateCartWithCustomer } from "@/lib/cart";
import { normalizePhone } from "@/lib/phone";
import { getActiveSmsProvider } from "@/lib/sms";
import { requireCustomer } from "./customer-guard";

const OTP_REQUEST_COOLDOWN_SECONDS = 60;
const OTP_MAX_REQUESTS_PER_HOUR = 5;

export interface OtpRequestState {
  error?: string;
  success?: boolean;
  phone?: string;
}

export interface OtpVerifyState {
  error?: string;
}

export interface OnboardingState {
  error?: string;
}

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

const phoneSchema = z.object({
  phone: z.string().trim().min(1, "יש להזין מספר טלפון"),
});

const verifySchema = z.object({
  phone: z.string().trim().min(1, "יש להזין מספר טלפון"),
  code: z.string().trim().min(1, "יש להזין קוד אימות"),
  redirectTo: z.string().optional(),
});

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם מלא"),
  email: z.email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
  redirectTo: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם מלא"),
  email: z.email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
});

/** Only ever redirect to a same-origin path -- never trust a posted redirectTo verbatim. */
function safeRedirect(path: string | undefined | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export async function requestOtp(
  _prevState: OtpRequestState | undefined,
  formData: FormData,
): Promise<OtpRequestState> {
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "מספר טלפון לא תקין" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { error: "מספר טלפון לא תקין. יש להזין מספר נייד ישראלי" };
  }

  const now = Date.now();
  const cooldownSince = new Date(now - OTP_REQUEST_COOLDOWN_SECONDS * 1000);
  const hourAgo = new Date(now - 60 * 60 * 1000);

  const [recentRequest, requestsThisHour] = await Promise.all([
    prisma.otpRequestLog.findFirst({ where: { phone, createdAt: { gt: cooldownSince } } }),
    prisma.otpRequestLog.count({ where: { phone, createdAt: { gt: hourAgo } } }),
  ]);

  if (recentRequest) {
    return { error: "יש להמתין דקה לפני שליחת קוד נוסף" };
  }
  if (requestsThisHour >= OTP_MAX_REQUESTS_PER_HOUR) {
    return { error: "נשלחו יותר מדי קודים למספר זה. נסו שוב בעוד שעה" };
  }

  try {
    await getActiveSmsProvider().startVerification(phone);
  } catch {
    return { error: "שליחת הקוד נכשלה. נסו שוב מאוחר יותר" };
  }

  await prisma.otpRequestLog.create({ data: { phone } });

  return { success: true, phone };
}

export async function verifyOtp(
  _prevState: OtpVerifyState | undefined,
  formData: FormData,
): Promise<OtpVerifyState> {
  const parsed = verifySchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { error: "מספר טלפון לא תקין" };
  }

  let approved = false;
  try {
    ({ approved } = await getActiveSmsProvider().checkVerification(phone, parsed.data.code));
  } catch {
    approved = false;
  }

  if (!approved) {
    return { error: "קוד שגוי או שפג תוקפו" };
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const session = await getCustomerSession();
  session.customerId = customer.id;
  await session.save();
  await associateCartWithCustomer(customer.id);

  const target = safeRedirect(parsed.data.redirectTo);

  if (!customer.name) {
    redirect(target ? `/onboarding?redirectTo=${encodeURIComponent(target)}` : "/onboarding");
  }

  redirect(target ?? "/customer-profile");
}

export async function completeOnboarding(
  _prevState: OnboardingState | undefined,
  formData: FormData,
): Promise<OnboardingState> {
  const customer = await requireCustomer();

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { name: parsed.data.name, email: parsed.data.email || null },
  });

  redirect(safeRedirect(parsed.data.redirectTo) ?? "/customer-profile");
}

export async function logoutCustomer(): Promise<void> {
  const session = await getCustomerSession();
  session.destroy();
  redirect("/");
}

export async function updateCustomerProfile(
  _prevState: ProfileActionState | undefined,
  formData: FormData,
): Promise<ProfileActionState> {
  const customer = await requireCustomer();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { name: parsed.data.name, email: parsed.data.email || null },
  });

  revalidatePath("/customer-profile");

  return { success: true };
}
