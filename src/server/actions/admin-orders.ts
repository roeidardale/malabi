"use server";

import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/orderTransitions";
import { requireAdmin } from "./admin-guard";

const VALID_STATUSES = new Set(Object.values(OrderStatus));

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<void> {
  const { id, role } = await requireAdmin(["OWNER", "DELIVERY_MANAGER", "DRIVER"]);

  const status = String(formData.get("status") ?? "");

  if (!VALID_STATUSES.has(status as OrderStatus)) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent("סטטוס לא תקין")}`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    redirect(`/admin/orders?error=${encodeURIComponent("הזמנה לא נמצאה")}`);
  }

  if (role === "DRIVER" && order!.assignedDriverId !== id) {
    redirect(`/admin/orders?error=${encodeURIComponent("ההזמנה אינה משויכת אליך")}`);
  }

  if (!canTransition(role, order!.status, status as OrderStatus)) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent("מעבר סטטוס זה אינו מותר לתפקידך")}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  redirect(role === "DRIVER" ? "/admin/my-deliveries" : `/admin/orders/${orderId}`);
}
