// scripts/scrape/upsertToDb.ts
//
// Idempotent Prisma upserts for categories/products/variants discovered by
// the crawler. Safe to run multiple times without creating duplicates
// alongside the hand-written dev-seed data:
//  - Categories are keyed on the unique `fullSlugPath`.
//  - Products are keyed on the unique `sourceProductKey` (falling back to
//    the `(categoryId, slug)` unique constraint when a product has no
//    source key).
//  - Variants are keyed on the unique `(productId, sourceOptionValue)`.

import { PrismaClient, type Category, type Product } from "@prisma/client";
import { DEFAULT_VARIANT_NAME, DEFAULT_VARIANT_SOURCE_VALUE } from "../lib/defaultVariant";
import type { ParsedProduct, ParsedVariant } from "./parseProductBlock";

export const prisma = new PrismaClient();

/** Turn a raw URL slug segment (e.g. "שונות-תת-קטגוריה") into a readable
 * fallback display name when no real page title was scraped for it. */
function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

function slugifyName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/["'׳״]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.length > 0 ? cleaned : "מוצר";
}

interface CategoryRef {
  id: string;
  fullSlugPath: string;
}

export class DbUpserter {
  private categoryCache = new Map<string, CategoryRef>();
  private categorySlugSets = new Map<string, Set<string>>();

  /**
   * Ensures the full chain of categories for `path` (e.g.
   * "/אלכוהול/בירות/") exists, upserting any missing levels, and returns
   * the leaf category. `nameByPath` maps fullSlugPath (no leading/trailing
   * slash) -> real scraped display name (from that page's <h1>), used when
   * available; falls back to a humanized version of the slug otherwise.
   */
  async upsertCategoryChain(path: string, nameByPath: Map<string, string>): Promise<CategoryRef> {
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) {
      throw new Error(`Cannot upsert category chain for empty path: "${path}"`);
    }

    let parentId: string | null = null;
    let current: CategoryRef | null = null;

    for (let i = 0; i < segments.length; i++) {
      const slug = segments[i];
      const fullSlugPath = segments.slice(0, i + 1).join("/");

      let ref = this.categoryCache.get(fullSlugPath);
      if (!ref) {
        const name = nameByPath.get(fullSlugPath) ?? humanizeSlug(slug);
        const row: Category = await prisma.category.upsert({
          where: { fullSlugPath },
          update: {
            name,
            parentId: parentId,
            isActive: true,
          },
          create: {
            name,
            slug,
            parentId,
            fullSlugPath,
            isActive: true,
          },
        });
        ref = { id: row.id, fullSlugPath: row.fullSlugPath };
        this.categoryCache.set(fullSlugPath, ref);
      }

      current = ref;
      parentId = ref.id;
    }

    return current!;
  }

  private async getUsedSlugs(categoryId: string): Promise<Set<string>> {
    let set = this.categorySlugSets.get(categoryId);
    if (!set) {
      const rows = await prisma.product.findMany({
        where: { categoryId },
        select: { slug: true },
      });
      set = new Set(rows.map((r) => r.slug));
      this.categorySlugSets.set(categoryId, set);
    }
    return set;
  }

  /** Upsert a product within `categoryId`. Returns the DB row (with id). */
  async upsertProduct(
    categoryId: string,
    parsed: ParsedProduct,
    sourceUrl: string,
    sortOrder: number,
  ): Promise<Product> {
    // Prefer matching on the stable Merchello source key when we have one.
    if (parsed.sourceProductKey) {
      const existing = await prisma.product.findUnique({
        where: { sourceProductKey: parsed.sourceProductKey },
      });
      if (existing) {
        // The live site cross-lists some products under multiple category
        // branches (e.g. a "night deliveries" umbrella that mirrors
        // categories that also exist directly). Our schema allows only one
        // categoryId per product, so once a product has been assigned a
        // category we keep it pinned there on subsequent sightings instead
        // of letting the last-visited alias silently steal it — only
        // metadata that's safe to refresh (name/description) is updated.
        return prisma.product.update({
          where: { id: existing.id },
          data: {
            name: parsed.name,
            descriptionShort: parsed.shortDescription,
            isActive: true,
          },
        });
      }
    }

    const usedSlugs = await this.getUsedSlugs(categoryId);
    const baseSlug = slugifyName(parsed.name);
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(slug);

    return prisma.product.upsert({
      where: { categoryId_slug: { categoryId, slug } },
      update: {
        name: parsed.name,
        descriptionShort: parsed.shortDescription,
        sourceProductKey: parsed.sourceProductKey ?? undefined,
        sourceUrl,
        isActive: true,
        sortOrder,
      },
      create: {
        name: parsed.name,
        slug,
        categoryId,
        descriptionShort: parsed.shortDescription,
        sourceProductKey: parsed.sourceProductKey,
        sourceUrl,
        isActive: true,
        sortOrder,
      },
    });
  }

  async setProductImage(productId: string, imageUrl: string | null): Promise<void> {
    if (!imageUrl) return;
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
    });
  }

  /** Single-item products have no size dropdown; give them one default variant. */
  async ensureDefaultVariant(productId: string): Promise<void> {
    await this.upsertVariant(
      productId,
      { name: DEFAULT_VARIANT_NAME, sourceOptionValue: DEFAULT_VARIANT_SOURCE_VALUE },
      0,
    );
  }

  async upsertVariant(productId: string, variant: ParsedVariant, index: number): Promise<void> {
    await prisma.productVariant.upsert({
      where: {
        productId_sourceOptionValue: {
          productId,
          sourceOptionValue: variant.sourceOptionValue,
        },
      },
      update: {
        name: variant.name,
        sortOrder: index,
        isActive: true,
      },
      create: {
        productId,
        name: variant.name,
        sourceOptionValue: variant.sourceOptionValue,
        priceAgorot: 0,
        priceSource: "MANUAL",
        isDefault: index === 0,
        sortOrder: index,
        isActive: true,
      },
    });
  }
}
