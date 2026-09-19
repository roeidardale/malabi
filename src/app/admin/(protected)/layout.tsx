import { redirect } from "next/navigation";
import Link from "next/link";
import type { AdminRole } from "@prisma/client";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAdmin } from "@/server/actions/admin-auth";
import { Button } from "@/components/ui/Button";

const NAV_ITEMS_BY_ROLE: Record<AdminRole, { href: string; label: string }[]> = {
  OWNER: [
    { href: "/admin", label: "לוח בקרה" },
    { href: "/admin/categories", label: "קטגוריות" },
    { href: "/admin/products", label: "מוצרים" },
    { href: "/admin/orders", label: "הזמנות" },
    { href: "/admin/dispatch", label: "שיבוץ משלוחים" },
    { href: "/admin/staff", label: "צוות" },
  ],
  DELIVERY_MANAGER: [
    { href: "/admin/orders", label: "הזמנות" },
    { href: "/admin/dispatch", label: "שיבוץ משלוחים" },
  ],
  DRIVER: [{ href: "/admin/my-deliveries", label: "המשלוחים שלי" }],
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { role: true, isActive: true },
  });
  if (!admin || !admin.isActive) {
    session.destroy();
    redirect("/admin/login");
  }

  const navItems = NAV_ITEMS_BY_ROLE[admin.role];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-e border-border bg-surface-deep p-4">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold text-accent">מלבי אקספרס</p>
          <p className="text-xs text-muted">ניהול</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            התנתקות
          </Button>
        </form>
      </aside>
      <main className="flex-1 bg-background p-6">{children}</main>
    </div>
  );
}
