// scripts/scrape/index.ts
//
// Entry point: crawls the live Malabi Express site's category tree,
// scrapes products/variants/images, and upserts everything into the local
// SQLite DB. Run via `npm run scrape` (or `npx tsx scripts/scrape/index.ts`).

import { crawlCategories } from "./crawlCategories";
import { downloadProductImage } from "./downloadImages";
import { printReport } from "./report";
import { DbUpserter, prisma } from "./upsertToDb";

// Known category paths (from the live site's nav + deeper pages found by
// exploration) to seed the crawl queue with. The crawler keeps discovering
// more from every page it visits — this list just guarantees full coverage
// of branches that might not be reachable purely by following links found
// on already-enqueued pages.
const SEED_PATHS: string[] = [
  "/אלכוהול/",
  "/אלכוהול/בירות/",
  "/אלכוהול/וודקה/",
  "/אלכוהול/וויסקי/",
  "/אלכוהול/ליקרים/",
  "/אלכוהול/קוקטיילים/",
  "/אלכוהול/יינות-ומבעבעים/",
  "/אלכוהול/אלכוהול-שונות/",
  "/אלכוהול/חבילות-אלכוהול/",
  "/אלכוהול/חבילות-אלכוהול/חבילות-וודקה/",
  "/אלכוהול/חבילות-אלכוהול/חבילות-וויסקי/",
  "/אלכוהול/חבילות-אלכוהול/חבילות-ליקרים-וודקה-טעמים/",
  "/אלכוהול/שונות-תת-קטגוריה/",
  "/אלכוהול/שונות-תת-קטגוריה/אלקטרוניות-חד-פעמיות/",
  "/אלכוהול/שונות-תת-קטגוריה/ערבוב-ושתייה-קלה/",
  "/אלכוהול/שונות-תת-קטגוריה/תוספות-ואביזרי-שתייה/",
  "/אלכוהול/שונות-תת-קטגוריה/משחקי-אלכוהול/",
  "/אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/",
  "/אלכוהול/שונות-תת-קטגוריה/סיגריות-plus-אביזרי-עישון/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/ערבוב-ושתייה-קלה/שתייה-קלה/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/ערבוב-ושתייה-קלה/ערבובים/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/גומי-וחמצוצים/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/קוקיס-מתוקים/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/שונות-ופיצוחים/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/גלידות/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/חטיפים/",
  "/אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/שוקולדים/",
  "/עירבוב-ושתיה-קלה/",
];

async function main() {
  console.log("Starting Malabi Express content scrape...\n");

  const crawlResult = await crawlCategories(SEED_PATHS);
  console.log(
    `\nCrawled ${crawlResult.categories.length} category pages (${crawlResult.failures.length} fetch failures).\n`,
  );

  // Map fullSlugPath (no leading/trailing slash) -> real scraped <h1> title,
  // used for naming categories accurately (falls back to a humanized slug
  // for any level that was never visited as its own page).
  const nameByPath = new Map<string, string>();
  for (const cat of crawlResult.categories) {
    if (cat.title) {
      const key = cat.path.split("/").filter(Boolean).join("/");
      nameByPath.set(key, cat.title);
    }
  }

  const upserter = new DbUpserter();

  let productsScraped = 0;
  let variantsScraped = 0;
  let imagesDownloaded = 0;
  let imagesFailed = 0;

  for (const cat of crawlResult.categories) {
    const key = cat.path.split("/").filter(Boolean).join("/");
    const categoryRef = await upserter.upsertCategoryChain(cat.path, nameByPath);

    if (cat.products.length === 0) {
      continue; // pure "hub" category page — tree node created, nothing else to do
    }

    console.log(
      `Category "${cat.title ?? key}" (${key}) — upserting ${cat.products.length} products`,
    );

    let sortOrder = 0;
    for (const product of cat.products) {
      productsScraped++;
      const row = await upserter.upsertProduct(categoryRef.id, product, cat.sourceUrl, sortOrder);
      sortOrder++;

      if (product.imageUrl) {
        const localPath = await downloadProductImage(row.id, product.imageUrl);
        if (localPath) {
          imagesDownloaded++;
          await upserter.setProductImage(row.id, localPath);
        } else {
          imagesFailed++;
        }
      }

      let variantIndex = 0;
      for (const variant of product.variants) {
        await upserter.upsertVariant(row.id, variant, variantIndex);
        variantIndex++;
        variantsScraped++;
      }

      if (product.variants.length === 0) {
        await upserter.ensureDefaultVariant(row.id);
        variantsScraped++;
      }
    }
  }

  await printReport(crawlResult, {
    categoriesVisited: crawlResult.categories.length,
    productsScraped,
    variantsScraped,
    imagesDownloaded,
    imagesFailed,
  });

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Scrape failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
