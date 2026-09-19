import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { deleteCategory, toggleCategoryActive } from "@/server/actions/admin-categories";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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
        <h1 className="text-2xl font-bold">קטגוריות</h1>
        <Link href="/admin/categories/new">
          <Button variant="primary">קטגוריה חדשה</Button>
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-2 text-start">שם</th>
              <th className="px-3 py-2 text-start">קטגוריית אב</th>
              <th className="px-3 py-2 text-start">סדר מיון</th>
              <th className="px-3 py-2 text-start">מוצרים</th>
              <th className="px-3 py-2 text-start">פעיל</th>
              <th className="px-3 py-2 text-start">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  אין קטגוריות עדיין
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b border-border/50">
                  <td className="px-3 py-2">{category.name}</td>
                  <td className="px-3 py-2 text-muted">
                    {category.parent?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">{category.sortOrder}</td>
                  <td className="px-3 py-2">{category._count.products}</td>
                  <td className="px-3 py-2">
                    <form
                      action={toggleCategoryActive.bind(
                        null,
                        category.id,
                        !category.isActive
                      )}
                    >
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          category.isActive
                            ? "bg-accent-soft text-black"
                            : "bg-surface-deep text-muted"
                        }`}
                      >
                        {category.isActive ? "פעיל" : "לא פעיל"}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/categories/${category.id}`}>
                        <Button variant="secondary">עריכה</Button>
                      </Link>
                      <form action={deleteCategory.bind(null, category.id)}>
                        <DeleteButton confirmMessage="למחוק את הקטגוריה? הפעולה בלתי הפיכה." />
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
