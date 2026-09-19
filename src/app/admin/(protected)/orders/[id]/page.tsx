import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/ui/error-banner";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { updateOrderStatus } from "@/server/actions/admin-orders";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
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
          <h1 className="text-display-md">הזמנה #{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <span className="text-sm text-muted-foreground">
          {order.createdAt.toLocaleString("he-IL")}
        </span>
      </div>

      {error ? (
        <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-heading">פרטי לקוח ומשלוח</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">שם</dt>
            <dd>{order.customerName}</dd>
            <dt className="text-muted-foreground">טלפון</dt>
            <dd>{order.customerPhone}</dd>
            <dt className="text-muted-foreground">אימייל</dt>
            <dd>{order.customerEmail ?? "—"}</dd>
            <dt className="text-muted-foreground">רחוב</dt>
            <dd>{order.deliveryStreet}</dd>
            <dt className="text-muted-foreground">עיר</dt>
            <dd>{order.deliveryCity}</dd>
            <dt className="text-muted-foreground">הערות</dt>
            <dd>{order.deliveryNotes ?? "—"}</dd>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-heading">תשלום</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">ספק תשלום</dt>
            <dd>{order.paymentProvider}</dd>
            <dt className="text-muted-foreground">סטטוס תשלום</dt>
            <dd>{order.paymentStatus}</dd>
            <dt className="text-muted-foreground">מזהה עסקה</dt>
            <dd>{order.paymentTransactionId ?? "—"}</dd>
            <dt className="text-muted-foreground">סכום ביניים</dt>
            <dd>{formatIls(order.subtotalAgorot)}</dd>
            <dt className="text-muted-foreground">דמי משלוח</dt>
            <dd>{formatIls(order.deliveryFeeAgorot)}</dd>
            <dt className="text-muted-foreground">סה&quot;כ</dt>
            <dd className="font-semibold text-accent">{formatIls(order.totalAgorot)}</dd>
          </dl>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-heading">פריטים</h2>
        <Table>
          <TableHeader>
            <tr>
              <th>מוצר</th>
              <th>וריאנט</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סה&quot;כ</th>
            </tr>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productNameSnapshot}</TableCell>
                <TableCell className="text-muted-foreground">{item.variantNameSnapshot}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatIls(item.unitPriceAgorot)}</TableCell>
                <TableCell>{formatIls(item.lineTotalAgorot)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="mt-6 max-w-sm">
        <h2 className="mb-3 text-heading">עדכון סטטוס</h2>
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
          <SubmitButton pendingLabel="מעדכן...">עדכון</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
