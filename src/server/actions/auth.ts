"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCustomerSession } from "@/lib/session";
import { associateCartWithCustomer } from "@/lib/cart";

export interface AuthActionState {
  error?: string;
}

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם מלא"),
  email: z.email("כתובת אימייל לא תקינה"),
  phone: z.string().trim().min(1, "יש להזין מספר טלפון"),
  password: z.string().min(8, "הסיסמה חייבת לכלול לפחות 8 תווים"),
  confirmPassword: z.string().min(1, "יש לאמת את הסיסמה"),
});

const loginSchema = z.object({
  email: z.email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם מלא"),
  phone: z.string().trim().min(1, "יש להזין מספר טלפון"),
  newPassword: z
    .string()
    .trim()
    .min(8, "הסיסמה החדשה חייבת לכלול לפחות 8 תווים")
    .optional(),
});

export async function registerCustomer(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  const { name, phone, password, confirmPassword } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  if (password !== confirmPassword) {
    return { error: "הסיסמאות אינן תואמות" };
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return { error: "כתובת האימייל הזו כבר רשומה במערכת" };
  }

  const passwordHash = await hashPassword(password);

  let customerId: string;
  try {
    const customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash },
    });
    customerId = customer.id;
  } catch {
    // Most likely a unique-constraint race on email.
    return { error: "כתובת האימייל הזו כבר רשומה במערכת" };
  }

  const session = await getCustomerSession();
  session.customerId = customerId;
  await session.save();
  await associateCartWithCustomer(customerId);

  redirect("/customer-profile");
}

export async function loginCustomer(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "יש להזין אימייל וסיסמה תקינים" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    return { error: "אימייל או סיסמה שגויים" };
  }

  const valid = await verifyPassword(parsed.data.password, customer.passwordHash);
  if (!valid) {
    return { error: "אימייל או סיסמה שגויים" };
  }

  const session = await getCustomerSession();
  session.customerId = customer.id;
  await session.save();
  await associateCartWithCustomer(customer.id);

  redirect("/customer-profile");
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
  const session = await getCustomerSession();
  if (!session.customerId) {
    redirect("/login");
  }

  const rawNewPassword = formData.get("newPassword");
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    newPassword:
      typeof rawNewPassword === "string" && rawNewPassword.trim().length > 0
        ? rawNewPassword
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  const data: { name: string; phone: string; passwordHash?: string } = {
    name: parsed.data.name,
    phone: parsed.data.phone,
  };

  if (parsed.data.newPassword) {
    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  await prisma.customer.update({
    where: { id: session.customerId },
    data,
  });

  revalidatePath("/customer-profile");

  return { success: true };
}
