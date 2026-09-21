// Fills `Category.imageUrl` (and tidies scraped category names).
//
//  1. Downloads the category tile images from the live site's navigation
//     (owner-authorized; goes through the same guarded, polite HTTP client as
//     the main scraper) into public/media/categories/{categoryId}/.
//  2. For categories the live site has no tile for, borrows the first product
//     photo found in the category's subtree.
//  3. For categories with no products at all, inherits the nearest ancestor's
//     image.
//
// It also adopts the live site's display labels (e.g. "חבילות ליקרים & וודקה טעמים")
// for categories whose name is still just the humanized URL slug.
//
// Idempotent; never overwrites an image or name that was set by hand in the
// admin (only fills categories whose imageUrl is empty, unless --refresh is given).
//
//   npm run category-images [-- --refresh]

import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { downloadImage } from "./scrape/downloadImages";
import { fetchHtml, SITE_ORIGIN } from "./scrape/httpClient";

const prisma = new PrismaClient();
const refresh = process.argv.includes("--refresh");

/** Live nav links look like `/אלכוהול/וודקה/` -> our `fullSlugPath` `אלכוהול/וודקה`. */
function toFullSlugPath(href: string): string {
  return decodeURIComponent(href)
    .split("/")
    .filter(Boolean)
    .join("/");
}

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

async function scrapeLiveNav(): Promise<{ tiles: Map<string, string>; labels: Map<string, string> }> {
  const html = await fetchHtml(`${SITE_ORIGIN}/`);
  const $ = cheerio.load(html);
  const tiles = new Map<string, string>();
  const labels = new Map<string, string>();

  $("#primary-menu a[href^='/']").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const key = toFullSlugPath(href);
    if (!key) return;

    const label = $(el).text().replace(/\s+/g, " ").trim();
    if (label && !labels.has(key)) labels.set(key, label);

    const src = $(el).find("img").first().attr("src");
    if (src && !tiles.has(key)) tiles.set(key, new URL(src, SITE_ORIGIN).href);
  });

  return { tiles, labels };
}

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { fullSlugPath: "asc" } });
  const byPath = new Map(categories.map((c) => [c.fullSlugPath, c]));

  const { tiles, labels } = await scrapeLiveNav();
  console.log(`Found ${tiles.size} category tiles and ${labels.size} labels on the live site.`);

  // 0. Display names: only where the name is still the scraper's slug-derived guess.
  let renamed = 0;
  for (const category of categories) {
    const label = labels.get(category.fullSlugPath);
    if (!label || label === category.name) continue;
    if (category.name !== humanizeSlug(category.slug)) continue;
    await prisma.category.update({ where: { id: category.id }, data: { name: label } });
    renamed++;
  }
  console.log(`Renamed ${renamed} categories to the live site's labels.`);

  // 1. Live tiles.
  const imageByPath = new Map<string, string>();
  for (const category of categories) {
    if (category.imageUrl && !refresh) {
      imageByPath.set(category.fullSlugPath, category.imageUrl);
      continue;
    }
    const liveUrl = tiles.get(category.fullSlugPath);
    if (!liveUrl) continue;
    const local = await downloadImage("categories", category.id, liveUrl);
    if (local) imageByPath.set(category.fullSlugPath, local);
  }
  const fromLive = imageByPath.size;

  // 2. First product photo in the subtree.
  let fromProducts = 0;
  for (const category of categories) {
    if (imageByPath.has(category.fullSlugPath)) continue;
    const product = await prisma.product.findFirst({
      where: {
        imageUrl: { not: null },
        isActive: true,
        category: {
          OR: [
            { id: category.id },
            { fullSlugPath: { startsWith: `${category.fullSlugPath}/` } },
          ],
        },
      },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    });
    if (product?.imageUrl) {
      imageByPath.set(category.fullSlugPath, product.imageUrl);
      fromProducts++;
    }
  }

  // 3. Inherit from the nearest ancestor.
  let inherited = 0;
  for (const category of categories) {
    if (imageByPath.has(category.fullSlugPath)) continue;
    let parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
    while (parent) {
      const image = imageByPath.get(parent.fullSlugPath);
      if (image) {
        imageByPath.set(category.fullSlugPath, image);
        inherited++;
        break;
      }
      parent = parent.parentId ? categories.find((c) => c.id === parent!.parentId) : undefined;
    }
  }

  for (const [fullSlugPath, imageUrl] of imageByPath) {
    const category = byPath.get(fullSlugPath)!;
    if (category.imageUrl === imageUrl) continue;
    await prisma.category.update({ where: { id: category.id }, data: { imageUrl } });
  }

  const missing = categories.filter((c) => !imageByPath.has(c.fullSlugPath));
  console.log(
    `Category images: ${fromLive} live/existing, ${fromProducts} from products, ${inherited} inherited, ${missing.length} still missing.`,
  );
  for (const category of missing) console.log(`  missing: ${category.fullSlugPath}`);
}

main()
  .catch((err) => {
    console.error("Category images failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
