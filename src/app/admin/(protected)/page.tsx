import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { requireAdmin } from "@/server/actions/admin-guard";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

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
      <h1 className="mb-6 text-display-md">לוח בקרה</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card interactive>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-accent">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-heading">הזמנות אחרונות</h2>
        {recentOrders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="אין הזמנות עדיין" />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <th>מס&apos; הזמנה</th>
                <th>לקוח</th>
                <th>סכום</th>
                <th>סטטוס</th>
                <th>תאריך</th>
              </tr>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-accent hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatIls(order.totalAgorot)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{order.createdAt.toLocaleDateString("he-IL")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
