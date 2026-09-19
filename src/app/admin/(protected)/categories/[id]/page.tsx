import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "@/server/actions/admin-categories";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">עריכת קטגוריה</h1>
      <p className="mb-6 text-sm text-muted">{category.fullSlugPath}</p>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        category={category}
        parentOptions={parentOptions}
      />
    </div>
  );
}
