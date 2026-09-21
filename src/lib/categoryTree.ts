import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";

export function buildFullSlugPath(parentPath: string | null, slug: string): string {
  return parentPath ? `${parentPath}/${slug}` : slug;
}

export async function getCategoryByPath(fullSlugPath: string) {
  return prisma.category.findUnique({
    where: { fullSlugPath },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getBreadcrumbs(category: Category): Promise<Category[]> {
  const chain: Category[] = [category];
  let current = category;
  while (current.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: current.parentId } });
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export async function getTopLevelCategories() {
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

// Products owned by the category or any of its descendants. Cross-listed
// products are pinned to a single category by the scraper, so hub categories
// would otherwise show nothing.
export async function getCategoryProducts(category: Pick<Category, "id" | "fullSlugPath">) {
  const descendants = await prisma.category.findMany({
    where: { fullSlugPath: { startsWith: `${category.fullSlugPath}/` }, isActive: true },
    select: { id: true },
  });
  return prisma.product.findMany({
    where: { categoryId: { in: [category.id, ...descendants.map((c) => c.id)] }, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}
