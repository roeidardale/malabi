import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { deleteProduct } from "@/server/actions/admin-products";
import { DeleteButton } from "@/components/admin/DeleteButton";
import type { Prisma } from "@prisma/client";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; error?: string }>;
}) {
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
        <h1 className="text-2xl font-bold">מוצרים</h1>
        <Link href="/admin/products/new">
          <Button variant="primary">מוצר חדש</Button>
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="q">
            חיפוש לפי שם
          </label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="חיפוש..." />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="categoryId">
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

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-2 text-start">שם</th>
              <th className="px-3 py-2 text-start">קטגוריה</th>
              <th className="px-3 py-2 text-start">פעיל</th>
              <th className="px-3 py-2 text-start">וריאנטים</th>
              <th className="px-3 py-2 text-start">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  לא נמצאו מוצרים
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-border/50">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2 text-muted">{product.category.name}</td>
                  <td className="px-3 py-2">
                    {product.isActive ? (
                      <span className="rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-black">
                        פעיל
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-deep px-2 py-1 text-xs text-muted">
                        לא פעיל
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{product._count.variants}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="secondary">עריכה</Button>
                      </Link>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <DeleteButton confirmMessage="למחוק את המוצר וכל הוריאנטים שלו?" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
