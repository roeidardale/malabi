import { prisma } from "@/lib/prisma";
import { createCategory } from "@/server/actions/admin-categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;
  const parentOptions = await prisma.category.findMany({
    orderBy: { fullSlugPath: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">קטגוריה חדשה</h1>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <CategoryForm action={createCategory} parentOptions={parentOptions} />
    </div>
  );
}
