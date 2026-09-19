"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getAdminSession } from "@/lib/session";

export async function loginAdmin(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/admin/login?error=${encodeURIComponent("נא למלא אימייל וסיסמה")}`);
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    redirect(`/admin/login?error=${encodeURIComponent("אימייל או סיסמה שגויים")}`);
  }

  const valid = await verifyPassword(password, admin.passwordHash);

  if (!valid) {
    redirect(`/admin/login?error=${encodeURIComponent("אימייל או סיסמה שגויים")}`);
  }

  const session = await getAdminSession();
  session.adminId = admin.id;
  await session.save();

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
