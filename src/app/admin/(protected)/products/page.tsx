import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ErrorBanner } from "@/components/ui/error-banner";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteProduct } from "@/server/actions/admin-products";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { requireAdmin } from "@/server/actions/admin-guard";
import type { Prisma } from "@prisma/client";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { q, categoryId, error } = await searchParams;

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.name = { contains: q };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        category: true,
        _count: { select: { variants: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display-md">מוצרים</h1>
        <Link href="/admin/products/new">
          <Button variant="primary">מוצר חדש</Button>
        </Link>
      </div>

      {error ? <ErrorBanner className="mb-4">{error}</ErrorBanner> : null}

      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="q">
            חיפוש לפי שם
          </label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="חיפוש..." />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="categoryId">
            קטגוריה
          </label>
          <Select id="categoryId" name="categoryId" defaultValue={categoryId ?? ""}>
            <option value="">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.fullSlugPath}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          סינון
        </Button>
      </form>

      {products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="לא נמצאו מוצרים" />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <th>שם</th>
              <th>קטגוריה</th>
              <th>פעיל</th>
              <th>וריאנטים</th>
              <th>פעולות</th>
            </tr>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category.name}</TableCell>
                <TableCell>
                  <Badge tone={product.isActive ? "accent" : "neutral"}>
                    {product.isActive ? "פעיל" : "לא פעיל"}
                  </Badge>
                </TableCell>
                <TableCell>{product._count.variants}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="secondary">עריכה</Button>
                    </Link>
                    <form action={deleteProduct.bind(null, product.id)}>
                      <DeleteButton confirmMessage="למחוק את המוצר וכל הוריאנטים שלו?" />
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
