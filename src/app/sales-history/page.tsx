import Link from "next/link";
import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { formatIls } from "@/lib/money";

const statusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם",
  PREPARING: "בהכנה",
  OUT_FOR_DELIVERY: "בדרך אליך",
  DELIVERED: "נמסר",
  CANCELLED: "בוטל",
};

export default async function SalesHistoryPage() {
  const session = await getCustomerSession();
  if (!session.customerId) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.customerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 py-10">
      <Link href="/customer-profile" className="text-sm text-muted-foreground hover:text-accent">
        → האזור האישי
      </Link>

      <h1 className="text-display-md">היסטוריית הזמנות</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-muted-foreground">
          עדיין לא ביצעת הזמנות
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">הזמנה #{order.orderNumber}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-accent">{statusLabels[order.status]}</span>
                <span className="font-medium">{formatIls(order.totalAgorot)}</span>
              </div>
              <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span>
                      {item.productNameSnapshot} ({item.variantNameSnapshot}) × {item.quantity}
                    </span>
                    <span>{formatIls(item.lineTotalAgorot)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
