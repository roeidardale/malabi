import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם",
  PREPARING: "בהכנה",
  OUT_FOR_DELIVERY: "בדרך ללקוח",
  DELIVERED: "נמסר",
  CANCELLED: "בוטל",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">הזמנות</h1>

      {orders.length === 0 ? (
        <p className="text-muted">אין הזמנות עדיין</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-3 py-2 text-start">מס&apos; הזמנה</th>
                <th className="px-3 py-2 text-start">לקוח</th>
                <th className="px-3 py-2 text-start">סכום</th>
                <th className="px-3 py-2 text-start">סטטוס</th>
                <th className="px-3 py-2 text-start">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-accent hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{order.customerName}</td>
                  <td className="px-3 py-2">{formatIls(order.totalAgorot)}</td>
                  <td className="px-3 py-2">
                    {statusLabels[order.status] ?? order.status}
                  </td>
                  <td className="px-3 py-2">
                    {order.createdAt.toLocaleDateString("he-IL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
