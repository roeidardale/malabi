import type { Product, ProductVariant } from "@prisma/client";
import { VariantSelector } from "@/components/storefront/VariantSelector";
import { Card } from "@/components/ui/card";
import { ImageTile } from "@/components/ui/image-tile";

type ProductWithVariants = Product & { variants: ProductVariant[] };

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductWithVariants;
  priority?: boolean;
}) {
  return (
    <Card interactive className="flex flex-col gap-3">
      <ImageTile
        src={product.imageUrl}
        alt={product.name}
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
        priority={priority}
      />

      <div className="flex flex-col gap-1">
        <h3 className="text-heading">{product.name}</h3>
        {product.descriptionShort && (
          <p className="line-clamp-2 text-small text-muted-foreground">
            {product.descriptionShort}
          </p>
        )}
      </div>

      <VariantSelector variants={product.variants} />
    </Card>
  );
}
