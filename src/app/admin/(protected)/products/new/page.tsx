import { prisma } from "@/lib/prisma";
import { createProduct } from "@/server/actions/admin-products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">מוצר חדש</h1>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ProductForm action={createProduct} categories={categories} />

      <p className="mt-4 max-w-xl text-sm text-muted">
        לאחר שמירת המוצר תוכל להוסיף תמונה ווריאנטים בעמוד העריכה.
      </p>
    </div>
  );
}
