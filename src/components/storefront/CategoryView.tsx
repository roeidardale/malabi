import { PackageOpen } from "lucide-react";
import { getBreadcrumbs, getCategoryProducts } from "@/lib/categoryTree";
import type { CategoryNode } from "@/lib/storefrontPath";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { CategoryTile } from "@/components/storefront/CategoryTile";
import { Pagination } from "@/components/storefront/Pagination";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";

export async function CategoryView({ category, page }: { category: CategoryNode; page: number }) {
  const [breadcrumbs, { products, total, pageCount }] = await Promise.all([
    getBreadcrumbs(category),
    getCategoryProducts(category, page),
  ]);
  const hasChildren = category.children.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="font-display text-3xl sm:text-4xl">{category.name}</h1>
      </div>

      {hasChildren && page === 1 && (
        <section aria-labelledby="subcategories">
          <h2 id="subcategories" className="mb-4 text-heading">
            תתי קטגוריות
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {category.children.map((child) => (
              <CategoryTile key={child.id} category={child} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section aria-labelledby="products">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="products" className="text-heading">
              {hasChildren ? "כל המוצרים" : "מוצרים"}
            </h2>
            <span className="text-sm text-muted-foreground">{total} מוצרים</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>
      )}

      <Pagination basePath={`/${category.fullSlugPath}`} page={page} pageCount={pageCount} />

      {!hasChildren && products.length === 0 && (
        <EmptyState
          icon={PackageOpen}
          title="אין מוצרים בקטגוריה זו כרגע"
          description="נסו קטגוריה אחרת או חזרו לבדוק בקרוב."
        />
      )}
    </div>
  );
}
