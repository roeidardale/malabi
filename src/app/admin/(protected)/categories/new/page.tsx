import { prisma } from "@/lib/prisma";
import { ErrorBanner } from "@/components/ui/error-banner";
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
      <h1 className="mb-6 text-display-md">קטגוריה חדשה</h1>

      {error ? (
        <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner>
      ) : null}

      <CategoryForm action={createCategory} parentOptions={parentOptions} />
    </div>
  );
}
