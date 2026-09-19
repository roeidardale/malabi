// scripts/scrape/report.ts
//
// Prints a summary of a scrape run: what the crawl found, what got written
// to the DB, and quick spot-checks on a few known categories.

import { prisma } from "./upsertToDb";
import type { CrawlResult } from "./crawlCategories";

export interface RunStats {
  categoriesVisited: number;
  productsScraped: number;
  variantsScraped: number;
  imagesDownloaded: number;
  imagesFailed: number;
}

const SPOT_CHECK_PATHS = [
  "אלכוהול/בירות",
  "אלכוהול/וודקה",
  "אלכוהול/שונות-תת-קטגוריה",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/חטיפים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/גומי-וחמצוצים",
];

export async function printReport(crawlResult: CrawlResult, stats: RunStats): Promise<void> {
  console.log("\n================ SCRAPE REPORT ================");
  console.log(`Category pages visited: ${crawlResult.categories.length}`);
  console.log(`Products scraped from pages: ${stats.productsScraped}`);
  console.log(`Variants scraped from pages: ${stats.variantsScraped}`);
  console.log(`Images downloaded: ${stats.imagesDownloaded} (failed: ${stats.imagesFailed})`);

  if (crawlResult.failures.length > 0) {
    console.log(`\nFAILED page fetches (${crawlResult.failures.length}):`);
    for (const f of crawlResult.failures) {
      console.log(`  - ${f.path}: ${f.error}`);
    }
  } else {
    console.log("\nNo page fetch failures.");
  }

  const dbCategoryCount = await prisma.category.count();
  const dbProductCount = await prisma.product.count();
  const dbVariantCount = await prisma.productVariant.count();
  const dbVariantsNeedingPrice = await prisma.productVariant.count({
    where: { priceAgorot: 0 },
  });

  console.log("\n---------------- DB TOTALS ----------------");
  console.log(`Categories in DB: ${dbCategoryCount}`);
  console.log(`Products in DB: ${dbProductCount}`);
  console.log(`Variants in DB: ${dbVariantCount}`);
  console.log(`Variants still needing manual pricing (priceAgorot = 0): ${dbVariantsNeedingPrice}`);

  console.log("\n---------------- SPOT CHECKS ----------------");
  for (const fullSlugPath of SPOT_CHECK_PATHS) {
    const cat = await prisma.category.findUnique({
      where: { fullSlugPath },
      include: { products: true },
    });
    if (!cat) {
      console.log(`  [MISSING] ${fullSlugPath}`);
    } else {
      console.log(`  [OK] ${fullSlugPath} ("${cat.name}") -> ${cat.products.length} products`);
    }
  }
  console.log("=================================================\n");
}
