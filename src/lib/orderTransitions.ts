import { AdminRole, OrderStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Partial<Record<AdminRole, Partial<Record<OrderStatus, OrderStatus[]>>>> = {
  DELIVERY_MANAGER: {
    PAID: ["PREPARING", "CANCELLED"],
    PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  },
  DRIVER: {
    OUT_FOR_DELIVERY: ["DELIVERED"],
  },
};

/**
 * OWNER is unrestricted (any status to any status, matching the original
 * behavior before roles existed). DELIVERY_MANAGER and DRIVER are limited to
 * the forward-moving transitions relevant to dispatch/delivery.
 */
export function canTransition(role: AdminRole, from: OrderStatus, to: OrderStatus): boolean {
  if (role === "OWNER") {
    return true;
  }
  return ALLOWED_TRANSITIONS[role]?.[from]?.includes(to) ?? false;
}
