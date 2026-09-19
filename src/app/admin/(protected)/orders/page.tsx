import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { requireAdmin } from "@/server/actions/admin-guard";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminOrdersPage() {
  await requireAdmin(["OWNER", "DELIVERY_MANAGER"]);
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-display-md">הזמנות</h1>

      {orders.length === 0 ? (
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
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="text-accent hover:underline">
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
    </div>
  );
}
