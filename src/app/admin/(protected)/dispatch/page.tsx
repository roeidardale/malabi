import { Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatIls } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { requireAdmin } from "@/server/actions/admin-guard";
import { assignOrderToDriver, unassignOrder } from "@/server/actions/admin-dispatch";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER", "DELIVERY_MANAGER"]);
  const { error } = await searchParams;

  const [orders, drivers] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "PREPARING", "OUT_FOR_DELIVERY"] } },
      include: { assignedDriver: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminUser.findMany({
      where: { role: "DRIVER", isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-display-md">שיבוץ משלוחים</h1>

      {error ? (
        <ErrorBanner className="mb-4">{error}</ErrorBanner>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState icon={Truck} title="אין הזמנות פתוחות לשיבוץ כרגע" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  #{order.orderNumber} — {order.customerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.deliveryStreet}, {order.deliveryCity}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-sm text-muted-foreground">{formatIls(order.totalAgorot)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {order.assignedDriver ? (
                  <>
                    <span className="text-sm">
                      משויך ל: <strong>{order.assignedDriver.name}</strong>
                    </span>
                    <form action={unassignOrder.bind(null, order.id)}>
                      <Button type="submit" variant="secondary">
                        בטל שיבוץ
                      </Button>
                    </form>
                  </>
                ) : (
                  <form
                    action={assignOrderToDriver.bind(null, order.id)}
                    className="flex items-center gap-2"
                  >
                    <Select name="driverId" required defaultValue="">
                      <option value="" disabled>
                        בחר נהג
                      </option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="primary">
                      שבץ
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
