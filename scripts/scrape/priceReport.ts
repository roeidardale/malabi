// scripts/scrape/priceReport.ts
//
// One-off report: crawls the live Malabi Express site (same seed paths and
// polite/guarded HTTP client as the main scraper) and writes a CSV of every
// product + price it can find.
//
// Two product layouts exist on the live site:
//  - "form" products (most categories: beer, wine, snacks, mixers,
//    accessories, cigarettes, games, etc.) show a size/quantity <select>
//    and load the price for the chosen option via a client-side AJAX call
//    to /umbraco/Merchello/ProductDataTableApi/. `/umbraco/` is disallowed
//    by the site's robots.txt (see httpClient.ts's DISALLOWED_PREFIXES,
//    which this report reuses), so those prices cannot be fetched through
//    this guarded client. They're still listed in the CSV, with an empty
//    price and a note explaining why.
//  - "simple card" products (וודקה/וויסקי/ליקרים, filtered by `?ca=<size>`)
//    render their price directly in the page's static HTML
//    (`.product-price .sale-price` / plain `<span>`), so those ARE scraped
//    for real.
//
//   npx tsx scripts/scrape/priceReport.ts

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { fetchHtml, SITE_ORIGIN } from "./httpClient";
import { parseCategoryPage } from "./parseCategoryPage";

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

interface Row {
  category: string;
  productName: string;
  variant: string;
  priceIls: string;
  status: "OK" | "NO_PRICE";
  reason: string;
  sourceUrl: string;
}

const UMBRACO_REASON =
  "Price is loaded client-side via AJAX to /umbraco/Merchello/ProductDataTableApi/, which is disallowed by robots.txt — not fetched.";

function pathToUrl(p: string): string {
  const segments = p.split("/").filter(Boolean).map(encodeURIComponent);
  return `${SITE_ORIGIN}/${segments.join("/")}/`;
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

/** Extracts the price shown on a `.product-item` (simple-card layout) block. */
function extractSimplePrice($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]): string | null {
  const $price = $(el).find(".product-price").first();
  if ($price.length === 0) return null;
  const sale = $price.find(".sale-price").first().text().trim();
  if (sale) return sale;
  const text = $price.text().trim();
  return text || null;
}

async function main() {
  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: string[] = [...SEED_PATHS];
  for (const p of SEED_PATHS) queued.add(p);

  const rows: Row[] = [];
  const failures: string[] = [];

  try {
    const homeHtml = await fetchHtml(`${SITE_ORIGIN}/`);
    const homeParsed = parseCategoryPage(homeHtml);
    for (const sub of homeParsed.subcategoryPaths) {
      if (!visited.has(sub) && !queued.has(sub)) {
        queued.add(sub);
        queue.push(sub);
      }
    }
  } catch (err) {
    failures.push(`/ : ${err instanceof Error ? err.message : String(err)}`);
  }

  while (queue.length > 0) {
    const p = queue.shift()!;
    queued.delete(p);
    if (visited.has(p)) continue;
    visited.add(p);

    const url = pathToUrl(p);
    const label = p.split("/").filter(Boolean).join("/");
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      failures.push(`${p} : ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const parsed = parseCategoryPage(html);
    console.log(`Visited ${label} — ${parsed.products.length} form products, ${parsed.sizeFilters.length} size filters`);

    // "form" products: price is JS/AJAX-only, not obtainable here.
    for (const product of parsed.products) {
      if (product.variants.length === 0) {
        rows.push({
          category: label,
          productName: product.name,
          variant: "",
          priceIls: "",
          status: "NO_PRICE",
          reason: UMBRACO_REASON,
          sourceUrl: url,
        });
      } else {
        for (const v of product.variants) {
          rows.push({
            category: label,
            productName: product.name,
            variant: v.name,
            priceIls: "",
            status: "NO_PRICE",
            reason: UMBRACO_REASON,
            sourceUrl: url,
          });
        }
      }
    }

    // "simple card" (size-filtered) products: price IS static HTML.
    for (const size of parsed.sizeFilters) {
      const sizedUrl = `${url}?ca=${size.ca}`;
      let sizedHtml: string;
      try {
        sizedHtml = await fetchHtml(sizedUrl);
      } catch (err) {
        failures.push(`${p}?ca=${size.ca} : ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      const $ = cheerio.load(sizedHtml);
      let count = 0;
      $(".shop .product-item:not(.single)").each((_i, el) => {
        const name = $(el).find(".product-desc h4").first().text().trim();
        if (!name) return;
        const price = extractSimplePrice($, el);
        count++;
        rows.push({
          category: label,
          productName: name,
          variant: size.label,
          priceIls: price ?? "",
          status: price ? "OK" : "NO_PRICE",
          reason: price ? "" : "Price element not found on page.",
          sourceUrl: sizedUrl,
        });
      });
      console.log(`  size "${size.label}" (?ca=${size.ca}) — ${count} products`);
    }

    for (const sub of parsed.subcategoryPaths) {
      if (!visited.has(sub) && !queued.has(sub)) {
        queued.add(sub);
        queue.push(sub);
      }
    }
  }

  const header = ["category", "product_name", "variant", "price_ils", "status", "reason", "source_url"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.category, r.productName, r.variant, r.priceIls, r.status, r.reason, r.sourceUrl]
        .map(csvEscape)
        .join(","),
    );
  }

  const outPath = path.join(process.cwd(), "malabi-price-report.csv");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

  const ok = rows.filter((r) => r.status === "OK").length;
  const noPrice = rows.filter((r) => r.status === "NO_PRICE").length;

  console.log("\n================ PRICE REPORT ================");
  console.log(`Category pages visited: ${visited.size}`);
  console.log(`Rows written: ${rows.length} (priced: ${ok}, no price: ${noPrice})`);
  console.log(`Fetch failures: ${failures.length}`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log(`CSV written to: ${outPath}`);
  console.log("================================================\n");
}

main().catch((err) => {
  console.error("Price report failed:", err);
  process.exit(1);
});
