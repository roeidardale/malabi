import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCategoryByPath } from "@/lib/categoryTree";

export type CategoryNode = NonNullable<Awaited<ReturnType<typeof getCategoryByPath>>>;

/** Loads a product with the variants shoppers can buy. */
async function findProduct(categoryId: string, slug: string) {
  return prisma.product.findFirst({
    where: { categoryId, slug, isActive: true },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export type ProductNode = NonNullable<Awaited<ReturnType<typeof findProduct>>>;

export type ResolvedPath =
  | { type: "category"; category: CategoryNode }
  | { type: "product"; product: ProductNode; category: CategoryNode }
  | { type: "page"; title: string; bodyHtml: string }
  | null;

/**
 * Decides what a storefront URL points at: a category, a product inside a
 * category, or a static content page (about/contact/terms). Cached per
 * request so `generateMetadata` and the page share one lookup.
 */
export const resolveStorefrontPath = cache(async (fullPath: string): Promise<ResolvedPath> => {
  const category = await getCategoryByPath(fullPath);
  if (category) return { type: "category", category };

  const segments = fullPath.split("/");
  if (segments.length > 1) {
    const parent = await getCategoryByPath(segments.slice(0, -1).join("/"));
    if (parent) {
      const product = await findProduct(parent.id, segments[segments.length - 1]);
      if (product) return { type: "product", product, category: parent };
    }
    return null;
  }

  const page = await prisma.staticPage.findUnique({ where: { slug: fullPath } });
  return page ? { type: "page", title: page.title, bodyHtml: page.bodyHtml } : null;
});
