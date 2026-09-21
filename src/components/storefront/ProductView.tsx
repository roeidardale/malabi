import { getBreadcrumbs } from "@/lib/categoryTree";
import type { CategoryNode, ProductNode } from "@/lib/storefrontPath";
import { AddToCart } from "@/components/storefront/AddToCart";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { ImageTile } from "@/components/ui/image-tile";

export async function ProductView({
  product,
  category,
}: {
  product: ProductNode;
  category: CategoryNode;
}) {
  const breadcrumbs = await getBreadcrumbs(category);
  const description = product.descriptionLong ?? product.descriptionShort;

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={breadcrumbs} trailingLabel={product.name} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <ImageTile
          src={product.imageUrl}
          alt={product.name}
          className="mx-auto w-full max-w-md"
          sizes="(min-width: 768px) 45vw, 90vw"
          priority
        />

        <div className="flex max-w-sm flex-col gap-5">
          <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>

          {description && (
            <p className="whitespace-pre-line text-body text-muted-foreground">{description}</p>
          )}

          <AddToCart
            productName={product.name}
            variants={product.variants.map(({ id, name, priceAgorot, isDefault }) => ({
              id,
              name,
              priceAgorot,
              isDefault,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
