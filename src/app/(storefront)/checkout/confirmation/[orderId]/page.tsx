import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { Button } from "@/components/ui/Button";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם",
  PREPARING: "בהכנה",
  OUT_FOR_DELIVERY: "בדרך אליך",
  DELIVERED: "נמסר",
  CANCELLED: "בוטל",
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const isPaid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 text-center">
      {isPaid ? (
        <>
          <h1 className="text-2xl font-bold text-accent">ההזמנה התקבלה בהצלחה!</h1>
          <p className="text-muted">מספר הזמנה #{order.orderNumber}</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-danger">התשלום לא הושלם</h1>
          <p className="text-muted">מספר הזמנה #{order.orderNumber} עדיין ממתין לתשלום.</p>
          <Link href={`/checkout/pay/${order.id}`}>
            <Button className="mx-auto">נסה שוב לשלם</Button>
          </Link>
        </>
      )}

      <div className="rounded-lg border border-border bg-surface p-4 text-start">
        <p className="mb-2 text-sm text-muted">
          סטטוס: <span className="text-foreground">{STATUS_LABELS[order.status] ?? order.status}</span>
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-muted">
              <span>
                {item.productNameSnapshot} — {item.variantNameSnapshot} × {item.quantity}
              </span>
              <span className="text-foreground">{formatIls(item.lineTotalAgorot)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold">
          <span>סה&quot;כ</span>
          <span className="text-accent">{formatIls(order.totalAgorot)}</span>
        </div>
      </div>

      <Link href="/" className="text-accent hover:underline">
        חזרה לחנות
      </Link>
    </div>
  );
}
