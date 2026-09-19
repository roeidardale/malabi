"use server";

import { redirect } from "next/navigation";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "./admin-guard";

const VALID_ROLES = new Set(Object.values(AdminRole));

function errorRedirect(redirectPath: string, message: string): never {
  redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
}

export async function createStaffAccount(formData: FormData): Promise<void> {
  await requireAdmin(["OWNER"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!name || !email || !password || !VALID_ROLES.has(role as AdminRole)) {
    errorRedirect("/admin/staff/new", "יש למלא שם, אימייל, סיסמה ותפקיד תקינים");
  }

  if (password.length < 8) {
    errorRedirect("/admin/staff/new", "סיסמה חייבת להכיל לפחות 8 תווים");
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.adminUser.create({
      data: { name, email, passwordHash, role: role as AdminRole },
    });
  } catch {
    errorRedirect("/admin/staff/new", "כבר קיים משתמש עם אימייל זה");
  }

  redirect("/admin/staff");
}

export async function setStaffActive(
  staffId: string,
  isActive: boolean
): Promise<void> {
  const { id } = await requireAdmin(["OWNER"]);

  if (staffId === id && !isActive) {
    errorRedirect("/admin/staff", "לא ניתן להשבית את חשבונך שלך");
  }

  await prisma.adminUser.update({
    where: { id: staffId },
    data: { isActive },
  });

  redirect("/admin/staff");
}
