"use server";

import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard";

const VALID_STATUSES = new Set(Object.values(OrderStatus));

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "");

  if (!VALID_STATUSES.has(status as OrderStatus)) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent("סטטוס לא תקין")}`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    redirect(`/admin/orders?error=${encodeURIComponent("הזמנה לא נמצאה")}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  redirect(`/admin/orders/${orderId}`);
}
