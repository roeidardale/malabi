import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { requireAdmin } from "@/server/actions/admin-guard";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminDashboardPage() {
  await requireAdmin(["OWNER"]);
  const [categoryCount, productCount, orderCount, missingPriceCount, recentOrders] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.productVariant.count({ where: { priceAgorot: 0 } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "קטגוריות", value: categoryCount, href: "/admin/categories" },
    { label: "מוצרים", value: productCount, href: "/admin/products" },
    { label: "הזמנות", value: orderCount, href: "/admin/orders" },
    {
      label: "וריאנטים ללא מחיר",
      value: missingPriceCount,
      href: "/admin/products",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">לוח בקרה</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-accent">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-4 text-lg font-semibold">הזמנות אחרונות</h2>
        {recentOrders.length === 0 ? (
          <p className="text-muted">אין הזמנות עדיין</p>
        ) : (
          <div className="overflow-x-auto">
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
                {recentOrders.map((order) => (
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
                      <OrderStatusBadge status={order.status} />
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
      </section>
    </div>
  );
}
