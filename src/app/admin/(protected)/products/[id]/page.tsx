import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/server/actions/admin-products";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantEditor } from "@/components/admin/VariantEditor";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { id } = await params;
  const { error } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">עריכת מוצר</h1>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ProductForm
        action={updateProduct.bind(null, product.id)}
        product={product}
        categories={categories}
        includeImage
      />

      <h2 className="mb-3 mt-10 text-lg font-semibold">וריאנטים</h2>
      <VariantEditor productId={product.id} variants={product.variants} />
    </div>
  );
}
