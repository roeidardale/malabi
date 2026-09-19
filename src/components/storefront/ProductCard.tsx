import type { Product, ProductVariant } from "@prisma/client";
import { VariantSelector } from "@/components/storefront/VariantSelector";

type ProductWithVariants = Product & { variants: ProductVariant[] };

export function ProductCard({ product }: { product: ProductWithVariants }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-surface-deep">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-muted">אין תמונה</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{product.name}</h3>
        {product.descriptionShort && (
          <p className="line-clamp-2 text-sm text-muted">{product.descriptionShort}</p>
        )}
      </div>

      <VariantSelector variants={product.variants} />
    </div>
  );
}
