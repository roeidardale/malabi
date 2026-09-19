"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard";

export async function assignOrderToDriver(orderId: string, formData: FormData): Promise<void> {
  await requireAdmin(["OWNER", "DELIVERY_MANAGER"]);

  const driverId = String(formData.get("driverId") ?? "").trim();
  if (!driverId) {
    redirect(`/admin/dispatch?error=${encodeURIComponent("נא לבחור נהג")}`);
  }

  const driver = await prisma.adminUser.findUnique({ where: { id: driverId } });
  if (!driver || driver.role !== "DRIVER" || !driver.isActive) {
    redirect(`/admin/dispatch?error=${encodeURIComponent("נהג לא נמצא או אינו פעיל")}`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    redirect(`/admin/dispatch?error=${encodeURIComponent("הזמנה לא נמצאה")}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { assignedDriverId: driverId },
  });

  redirect("/admin/dispatch");
}

export async function unassignOrder(orderId: string): Promise<void> {
  await requireAdmin(["OWNER", "DELIVERY_MANAGER"]);

  await prisma.order.update({
    where: { id: orderId },
    data: { assignedDriverId: null },
  });

  redirect("/admin/dispatch");
}
