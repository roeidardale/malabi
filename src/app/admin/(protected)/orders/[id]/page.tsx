import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { updateOrderStatus } from "@/server/actions/admin-orders";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { requireAdmin } from "@/server/actions/admin-guard";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

const statusOptions: { value: string; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "ממתין לתשלום" },
  { value: "PAID", label: "שולם" },
  { value: "PREPARING", label: "בהכנה" },
  { value: "OUT_FOR_DELIVERY", label: "בדרך ללקוח" },
  { value: "DELIVERED", label: "נמסר" },
  { value: "CANCELLED", label: "בוטל" },
];

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER", "DELIVERY_MANAGER"]);
  const { id } = await params;
  const { error } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">הזמנה #{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <span className="text-sm text-muted">
          {order.createdAt.toLocaleString("he-IL")}
        </span>
      </div>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold">פרטי לקוח ומשלוח</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted">שם</dt>
            <dd>{order.customerName}</dd>
            <dt className="text-muted">טלפון</dt>
            <dd>{order.customerPhone}</dd>
            <dt className="text-muted">אימייל</dt>
            <dd>{order.customerEmail ?? "—"}</dd>
            <dt className="text-muted">רחוב</dt>
            <dd>{order.deliveryStreet}</dd>
            <dt className="text-muted">עיר</dt>
            <dd>{order.deliveryCity}</dd>
            <dt className="text-muted">הערות</dt>
            <dd>{order.deliveryNotes ?? "—"}</dd>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold">תשלום</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted">ספק תשלום</dt>
            <dd>{order.paymentProvider}</dd>
            <dt className="text-muted">סטטוס תשלום</dt>
            <dd>{order.paymentStatus}</dd>
            <dt className="text-muted">מזהה עסקה</dt>
            <dd>{order.paymentTransactionId ?? "—"}</dd>
            <dt className="text-muted">סכום ביניים</dt>
            <dd>{formatIls(order.subtotalAgorot)}</dd>
            <dt className="text-muted">דמי משלוח</dt>
            <dd>{formatIls(order.deliveryFeeAgorot)}</dd>
            <dt className="text-muted">סה&quot;כ</dt>
            <dd className="font-semibold text-accent">{formatIls(order.totalAgorot)}</dd>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold">פריטים</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-3 py-2 text-start">מוצר</th>
                <th className="px-3 py-2 text-start">וריאנט</th>
                <th className="px-3 py-2 text-start">כמות</th>
                <th className="px-3 py-2 text-start">מחיר יחידה</th>
                <th className="px-3 py-2 text-start">סה&quot;כ</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="px-3 py-2">{item.productNameSnapshot}</td>
                  <td className="px-3 py-2 text-muted">{item.variantNameSnapshot}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{formatIls(item.unitPriceAgorot)}</td>
                  <td className="px-3 py-2">{formatIls(item.lineTotalAgorot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 max-w-sm rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold">עדכון סטטוס</h2>
        <form
          action={updateOrderStatus.bind(null, order.id)}
          className="flex items-center gap-3"
        >
          <Select name="status" defaultValue={order.status}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="primary">
            עדכון
          </Button>
        </form>
      </section>
    </div>
  );
}
