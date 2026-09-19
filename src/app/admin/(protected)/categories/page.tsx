import Link from "next/link";
import { FolderTree } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteCategory, toggleCategoryActive } from "@/server/actions/admin-categories";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: {
      parent: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display-md">קטגוריות</h1>
        <Link href="/admin/categories/new">
          <Button variant="primary">קטגוריה חדשה</Button>
        </Link>
      </div>

      {error ? <ErrorBanner className="mb-4">{error}</ErrorBanner> : null}

      {categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="אין קטגוריות עדיין" />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <th>שם</th>
              <th>קטגוריית אב</th>
              <th>סדר מיון</th>
              <th>מוצרים</th>
              <th>פעיל</th>
              <th>פעולות</th>
            </tr>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.parent?.name ?? "—"}
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>{category._count.products}</TableCell>
                <TableCell>
                  <form
                    action={toggleCategoryActive.bind(null, category.id, !category.isActive)}
                  >
                    <button type="submit">
                      <Badge tone={category.isActive ? "accent" : "neutral"}>
                        {category.isActive ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </button>
                  </form>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/categories/${category.id}`}>
                      <Button variant="secondary">עריכה</Button>
                    </Link>
                    <form action={deleteCategory.bind(null, category.id)}>
                      <DeleteButton confirmMessage="למחוק את הקטגוריה? הפעולה בלתי הפיכה." />
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
