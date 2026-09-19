import type { OrderStatus } from "@prisma/client";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם",
  PREPARING: "בהכנה",
  OUT_FOR_DELIVERY: "בדרך ללקוח",
  DELIVERED: "נמסר",
  CANCELLED: "בוטל",
};

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-surface-deep text-muted",
  PAID: "bg-accent-soft text-black",
  PREPARING: "bg-accent-soft text-black",
  OUT_FOR_DELIVERY: "bg-accent-soft text-black",
  DELIVERED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-danger/15 text-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${ORDER_STATUS_CLASSES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

/** Payment status is a free-form string on Order (PENDING/APPROVED/DECLINED,
 * plus whatever a real gateway callback reports), not an enum. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const isPaid = normalized === "APPROVED" || normalized === "PAID";
  const isDeclined = normalized === "DECLINED" || normalized === "FAILED";

  const label = isPaid ? "שולם" : isDeclined ? "התשלום נדחה" : "טרם שולם";
  const classes = isPaid
    ? "bg-emerald-500/20 text-emerald-400"
    : isDeclined
      ? "bg-danger/15 text-danger"
      : "bg-amber-500/20 text-amber-400";

  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${classes}`}>
      {label}
    </span>
  );
}
