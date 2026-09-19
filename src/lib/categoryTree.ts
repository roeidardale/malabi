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
      products: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      },
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
