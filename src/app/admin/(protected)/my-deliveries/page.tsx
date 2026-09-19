import { PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatIls } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <h1 className="mb-6 text-display-md">המשלוחים שלי</h1>

      {error ? (
        <ErrorBanner className="mb-4">{error}</ErrorBanner>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState icon={PackageCheck} title="אין משלוחים משויכים אליך כרגע" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold">#{order.orderNumber}</p>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>

              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              <p className="mt-1 text-sm">
                {order.deliveryStreet}, {order.deliveryCity}
              </p>
              {order.deliveryNotes ? (
                <p className="mt-1 text-sm text-muted-foreground">הערות: {order.deliveryNotes}</p>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
