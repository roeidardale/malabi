import type { OrderStatus } from "@prisma/client";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type Tone = VariantProps<typeof badgeVariants>["tone"];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם",
  PREPARING: "בהכנה",
  OUT_FOR_DELIVERY: "בדרך ללקוח",
  DELIVERED: "נמסר",
  CANCELLED: "בוטל",
};

const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: "neutral",
  PAID: "accent",
  PREPARING: "accent",
  OUT_FOR_DELIVERY: "accent",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
  );
}

/** Payment status is a free-form string on Order (PENDING/APPROVED/DECLINED,
 * plus whatever a real gateway callback reports), not an enum. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const isPaid = normalized === "APPROVED" || normalized === "PAID";
  const isDeclined = normalized === "DECLINED" || normalized === "FAILED";

  const label = isPaid ? "שולם" : isDeclined ? "התשלום נדחה" : "טרם שולם";
  const tone: Tone = isPaid ? "success" : isDeclined ? "danger" : "warning";

  return <Badge tone={tone}>{label}</Badge>;
}
