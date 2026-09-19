import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/ui/error-banner";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "@/server/actions/admin-categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
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
      <h1 className="mb-1 text-display-md">עריכת קטגוריה</h1>
      <p className="mb-6 text-sm text-muted-foreground">{category.fullSlugPath}</p>

      {error ? (
        <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner>
      ) : null}

      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        category={category}
        parentOptions={parentOptions}
      />
    </div>
  );
}
