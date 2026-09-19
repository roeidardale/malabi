import { prisma } from "@/lib/prisma";
import { ErrorBanner } from "@/components/ui/error-banner";
import { createProduct } from "@/server/actions/admin-products";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-display-md">מוצר חדש</h1>

      {error ? (
        <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner>
      ) : null}

      <ProductForm action={createProduct} categories={categories} />

      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        לאחר שמירת המוצר תוכל להוסיף תמונה ווריאנטים בעמוד העריכה.
      </p>
    </div>
  );
}
