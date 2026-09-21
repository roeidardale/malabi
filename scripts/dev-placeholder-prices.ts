// DEV ONLY. The live site does not publish prices, so every scraped variant is
// priced at 0 and checkout cannot be exercised. This assigns plausible
// placeholder prices to variants that are still at 0, tagging them
// `priceSource = "PLACEHOLDER"` so they can be found (admin dashboard) and
// replaced with the owner's real prices. Variants with a non-zero price are
// never touched.
//
//   npm run dev-prices

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// First match wins. Base price in whole shekels for one unit.
const CATEGORY_BASE_SHEKELS: Array<[RegExp, number]> = [
  [/וויסקי/, 160],
  [/וודקה/, 95],
  [/ליקרים/, 85],
  [/קוקטיילים/, 30],
  [/יין/, 55],
  [/בירות/, 14],
  [/חבילות/, 250],
  [/גלידות/, 18],
  [/גומי|חמצוצים|קוקיס|שוקולד|חטיפים|פיצוחים/, 12],
  [/סיגריות|טבק/, 45],
  [/אביזרי-עישון|אלקטרוניות/, 25],
  [/שתייה-קלה|ערבוב/, 9],
  [/משחקי-אלכוהול|תוספות|אביזרי-שתייה/, 35],
  [/פירות/, 28],
];
const FALLBACK_BASE_SHEKELS = 30;

// Pack-size variants scale from the single-unit price with a small bulk discount.
const PACK_MULTIPLIERS: Array<[RegExp, number]> = [
  [/ארגז/, 24 * 0.8],
  [/2 שישיות/, 12 * 0.85],
  [/שישי/, 6 * 0.9],
];

function roundToFive(shekels: number): number {
  return Math.max(5, Math.round(shekels / 5) * 5);
}

function placeholderAgorot(categoryPath: string, variantName: string, sortOrder: number): number {
  const base = CATEGORY_BASE_SHEKELS.find(([re]) => re.test(categoryPath))?.[1] ?? FALLBACK_BASE_SHEKELS;
  const pack = PACK_MULTIPLIERS.find(([re]) => re.test(variantName))?.[1];
  const shekels = pack ? base * pack : base * (1 + 0.25 * sortOrder);
  const rounded = shekels < 20 ? Math.max(5, Math.round(shekels)) : roundToFive(shekels);
  return rounded * 100;
}

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: { priceAgorot: 0 },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      product: { select: { category: { select: { fullSlugPath: true } } } },
    },
  });

  let updated = 0;
  for (const variant of variants) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        priceAgorot: placeholderAgorot(
          variant.product.category.fullSlugPath,
          variant.name,
          variant.sortOrder,
        ),
        priceSource: "PLACEHOLDER",
      },
    });
    updated++;
  }

  console.log(`Assigned placeholder prices to ${updated} variants (priceSource=PLACEHOLDER).`);
}

main()
  .catch((err) => {
    console.error("Placeholder pricing failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
