import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/server/actions/admin-guard";
import { updateOrderStatus } from "@/server/actions/admin-orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export default async function MyDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await requireAdmin(["DRIVER"]);
  const { error } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      assignedDriverId: id,
      status: { in: ["PAID", "PREPARING", "OUT_FOR_DELIVERY"] },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">המשלוחים שלי</h1>

      {error ? (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-muted">אין משלוחים משויכים אליך כרגע</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold">#{order.orderNumber}</p>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>

              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted">{order.customerPhone}</p>
              <p className="mt-1 text-sm">
                {order.deliveryStreet}, {order.deliveryCity}
              </p>
              {order.deliveryNotes ? (
                <p className="mt-1 text-sm text-muted">הערות: {order.deliveryNotes}</p>
              ) : null}
              <p className="mt-2 font-semibold text-accent">{formatIls(order.totalAgorot)}</p>

              {order.status === "OUT_FOR_DELIVERY" ? (
                <form action={updateOrderStatus.bind(null, order.id)} className="mt-3">
                  <input type="hidden" name="status" value="DELIVERED" />
                  <Button type="submit" variant="primary">
                    סמן כנמסר
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
