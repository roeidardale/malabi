import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBreadcrumbs, getCategoryByPath, getCategoryProducts } from "@/lib/categoryTree";
import { ProductCard } from "@/components/storefront/ProductCard";
import { VariantSelector } from "@/components/storefront/VariantSelector";
import { CartPageContent } from "@/components/storefront/CartPageContent";
import { Card } from "@/components/ui/card";
import { ImageTile } from "@/components/ui/image-tile";
import { EmptyState } from "@/components/ui/empty-state";

const CART_PATH = "סל-קניות";

type BreadcrumbItem = { id: string; name: string; fullSlugPath: string };

function Breadcrumbs({
  items,
  trailingLabel,
}: {
  items: BreadcrumbItem[];
  trailingLabel?: string;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="breadcrumbs">
      <Link href="/" className="hover:text-accent">
        בית
      </Link>
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-2">
          <span>/</span>
          <Link href={`/${item.fullSlugPath}`} className="hover:text-accent">
            {item.name}
          </Link>
        </span>
      ))}
      {trailingLabel && (
        <span className="flex items-center gap-2">
          <span>/</span>
          <span className="text-foreground">{trailingLabel}</span>
        </span>
      )}
    </nav>
  );
}

export default async function CategoryOrProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug.map((segment) => decodeURIComponent(segment));
  const fullPath = segments.join("/");

  // Next's file-system router should match the dedicated
  // `/סל-קניות/page.tsx` route before ever reaching this catch-all, but this
  // environment's static-segment matching for non-ASCII folder names is
  // unreliable (a literal `/סל-קניות` request can fall through to this
  // catch-all instead of the dedicated static route). Render the same cart
  // content here as a fallback so the URL still works correctly either way.
  if (segments.length === 1 && segments[0] === CART_PATH) {
    return <CartPageContent />;
  }

  const category = await getCategoryByPath(fullPath);

  if (category) {
    const breadcrumbs = await getBreadcrumbs(category);
    const products = await getCategoryProducts(category);

    return (
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />

        <h1 className="text-display-md">{category.name}</h1>

        {category.children.length > 0 && (
          <section>
            <h2 className="mb-4 text-heading">תתי קטגוריות</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.children.map((child) => (
                <Link key={child.id} href={`/${category.fullSlugPath}/${child.slug}`}>
                  <Card
                    interactive
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <ImageTile
                      src={child.imageUrl}
                      alt={child.name}
                      className="w-24"
                      sizes="96px"
                    />
                    <span className="font-medium group-hover:text-accent">
                      {child.name}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="mb-4 text-heading">מוצרים</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>
          </section>
        )}

        {category.children.length === 0 && products.length === 0 && (
          <EmptyState
            icon={PackageOpen}
            title="אין מוצרים בקטגוריה זו כרגע"
            description="נסו קטגוריה אחרת או חזרו לבדוק בקרוב."
          />
        )}
      </div>
    );
  }

  // Not a category path — try resolving it as a product slug scoped under
  // its parent category path (path minus the last segment).
  if (segments.length > 1) {
    const parentPath = segments.slice(0, -1).join("/");
    const productSlug = segments[segments.length - 1];

    const parentCategory = await getCategoryByPath(parentPath);

    if (parentCategory) {
      const product = await prisma.product.findFirst({
        where: { categoryId: parentCategory.id, slug: productSlug, isActive: true },
        include: {
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      });

      if (product) {
        const breadcrumbs = await getBreadcrumbs(parentCategory);

        return (
          <div className="flex flex-col gap-8">
            <Breadcrumbs items={breadcrumbs} trailingLabel={product.name} />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ImageTile
                src={product.imageUrl}
                alt={product.name}
                aspect="4/3"
                sizes="(min-width: 768px) 45vw, 90vw"
                priority
              />

              <div className="flex flex-col gap-4">
                <h1 className="text-display-md">{product.name}</h1>

                {product.descriptionLong ? (
                  <p className="whitespace-pre-line text-body text-muted-foreground">
                    {product.descriptionLong}
                  </p>
                ) : product.descriptionShort ? (
                  <p className="text-body text-muted-foreground">{product.descriptionShort}</p>
                ) : null}

                <div className="max-w-xs">
                  <VariantSelector variants={product.variants} />
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  }

  // Not a category or product path — try a static content page
  // (about/contact/terms), keyed by the same single-segment Hebrew slug.
  if (segments.length === 1) {
    const staticPage = await prisma.staticPage.findUnique({ where: { slug: segments[0] } });

    if (staticPage) {
      return (
        <article className="mx-auto flex max-w-2xl flex-col gap-6">
          <Breadcrumbs items={[]} trailingLabel={staticPage.title} />
          <h1 className="text-display-md">{staticPage.title}</h1>
          <div
            className="prose prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: staticPage.bodyHtml }}
          />
        </article>
      );
    }
  }

  notFound();
}
