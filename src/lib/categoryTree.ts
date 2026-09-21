import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";

export function buildFullSlugPath(parentPath: string | null, slug: string): string {
  return parentPath ? `${parentPath}/${slug}` : slug;
}

/**
 * fullSlugPaths of every category that has at least one active product in its
 * subtree (each product's category plus all of that category's ancestors).
 * The storefront hides everything else so shoppers never land on empty shelves.
 */
async function getPopulatedPaths(): Promise<Set<string>> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["categoryId"],
    select: { category: { select: { fullSlugPath: true } } },
  });

  const paths = new Set<string>();
  for (const { category } of rows) {
    const segments = category.fullSlugPath.split("/");
    for (let i = 1; i <= segments.length; i++) {
      paths.add(segments.slice(0, i).join("/"));
    }
  }
  return paths;
}

export async function getCategoryByPath(fullSlugPath: string) {
  const category = await prisma.category.findUnique({
    where: { fullSlugPath },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!category || !category.isActive) return null;

  const populated = await getPopulatedPaths();
  return {
    ...category,
    children: category.children.filter((child) => populated.has(child.fullSlugPath)),
  };
}

export async function getBreadcrumbs(category: Pick<Category, "fullSlugPath">): Promise<Category[]> {
  const segments = category.fullSlugPath.split("/");
  const paths = segments.map((_, i) => segments.slice(0, i + 1).join("/"));
  const rows = await prisma.category.findMany({ where: { fullSlugPath: { in: paths } } });
  return paths.flatMap((path) => rows.filter((row) => row.fullSlugPath === path));
}

/**
 * The categories shoppers browse first (home tiles, header rail). The catalog
 * hangs off a single root ("אלכוהול"), so when only one root has products we
 * skip it and surface its children instead.
 */
export async function getStorefrontCategories(): Promise<Category[]> {
  const [roots, populated] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPopulatedPaths(),
  ]);

  const populatedRoots = roots.filter((root) => populated.has(root.fullSlugPath));
  if (populatedRoots.length !== 1) return populatedRoots;

  const children = await prisma.category.findMany({
    where: { parentId: populatedRoots[0].id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return children.filter((child) => populated.has(child.fullSlugPath));
}

export const PRODUCTS_PER_PAGE = 24;

// Products owned by the category or any of its descendants. Cross-listed
// products are pinned to a single category by the scraper, so hub categories
// would otherwise show nothing. Paginated: a root category holds hundreds.
export async function getCategoryProducts(
  category: Pick<Category, "id" | "fullSlugPath">,
  page = 1,
) {
  const descendants = await prisma.category.findMany({
    where: { fullSlugPath: { startsWith: `${category.fullSlugPath}/` }, isActive: true },
    select: { id: true },
  });
  const where = {
    categoryId: { in: [category.id, ...descendants.map((c) => c.id)] },
    isActive: true,
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      include: {
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        category: { select: { fullSlugPath: true } },
      },
    }),
  ]);

  return { products, total, pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)) };
}

export type CatalogProduct = Awaited<ReturnType<typeof getCategoryProducts>>["products"][number];
