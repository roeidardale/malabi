import Link from "next/link";
import type { CatalogProduct } from "@/lib/categoryTree";
import { AddToCart } from "@/components/storefront/AddToCart";
import { Card } from "@/components/ui/card";
import { ImageTile } from "@/components/ui/image-tile";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const href = `/${product.category.fullSlugPath}/${product.slug}`;

  return (
    <Card className="flex flex-col gap-3 p-3">
      <Link href={href} tabIndex={-1} aria-hidden>
        <ImageTile
          src={product.imageUrl}
          alt=""
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
          priority={priority}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-0.5">
        <h3 className="line-clamp-2 font-semibold leading-snug">
          <Link href={href} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        {product.descriptionShort && (
          <p className="line-clamp-1 text-small text-muted-foreground">{product.descriptionShort}</p>
        )}
      </div>

      <AddToCart
        productName={product.name}
        variants={product.variants.map(({ id, name, priceAgorot, isDefault }) => ({
          id,
          name,
          priceAgorot,
          isDefault,
        }))}
      />
    </Card>
  );
}
