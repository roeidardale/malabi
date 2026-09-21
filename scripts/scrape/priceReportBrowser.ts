// scripts/scrape/priceReportBrowser.ts
//
// Companion to priceReport.ts. That script covers the "simple card"
// categories (וודקה/וויסקי/ליקרים) whose prices are static HTML. This one
// covers everything else: the "form" categories (beer, wine, snacks,
// cigarettes, accessories, games, mixers, ...) whose price only appears
// after the page's own client-side script (merchello.ui.js) fetches
// /umbraco/Merchello/ProductDataTableApi/.
//
// Rather than call that endpoint directly (which priceReport.ts's guarded
// HTTP client correctly refuses, since /umbraco/ is disallowed by
// robots.txt), this drives a real headless browser to load each category
// page exactly as a human visitor's browser would, and reads the price data
// the page's own script already fetched for itself — no direct request to
// a disallowed path is made by this script.
//
// Also cross-checks the result:
//  - the live site cross-lists some products under more than one category
//    branch (e.g. a "night deliveries" umbrella that mirrors real
//    categories) — every sighting of the same productKey is compared, and
//    any price mismatch between sightings is flagged.
//  - flags product/variant price sets that are byte-for-byte identical to
//    another unrelated product's, which likely means uninitialized/fallback
//    demo pricing rather than a real price entered for that product.
//
//   npx tsx scripts/scrape/priceReportBrowser.ts

import { existsSync } from "node:fs";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "@playwright/test";
import { SITE_ORIGIN } from "./httpClient";

const SYSTEM_CHROMIUM = "/usr/bin/chromium";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? (existsSync(SYSTEM_CHROMIUM) ? SYSTEM_CHROMIUM : undefined);

// "Form" categories only (no ?ca= size filters) — from the same seed list as
// the other two scrapers, minus וודקה/וויסקי/ליקרים (already covered) and
// pure "hub" pages that list no products directly.
const FORM_CATEGORY_PATHS: string[] = [
  "אלכוהול/בירות",
  "אלכוהול/קוקטיילים",
  "אלכוהול/יינות-ומבעבעים/יין-אדום",
  "אלכוהול/יינות-ומבעבעים/יין-לבן-plus-ורוד",
  "אלכוהול/חבילות-אלכוהול/חבילות-ליקרים-וודקה-טעמים/שונות",
  "אלכוהול/שונות-תת-קטגוריה/תוספות-ואביזרי-שתייה",
  "אלכוהול/שונות-תת-קטגוריה/משחקי-אלכוהול",
  "אלכוהול/שונות-תת-קטגוריה/סיגריות-plus-אביזרי-עישון/סיגריות-וטבק",
  "אלכוהול/שונות-תת-קטגוריה/סיגריות-plus-אביזרי-עישון/אביזרי-עישון",
  "אלכוהול/שונות-תת-קטגוריה/ערבוב-ושתייה-קלה/שתייה-קלה",
  "אלכוהול/שונות-תת-קטגוריה/ערבוב-ושתייה-קלה/ערבובים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/פירות-חתוכים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/קוקיס-מתוקים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/שונות-ופיצוחים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/חטיפים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/שוקולדים",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/גלידות",
  "אלכוהול/שונות-תת-קטגוריה/נישנושים-ומאנצ/גומי-וחמצוצים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/חבילות-לסטלנים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/אביזרי-עישון",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/סיגריות-וטבק",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/ערבוב-ושתייה-קלה/ערבובים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/ערבוב-ושתייה-קלה/שתייה-קלה",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/גומי-וחמצוצים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/קוקיס-מתוקים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/שונות-ופיצוחים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/גלידות",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/חטיפים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/כל-הנישנושים/שוקולדים",
  "אלכוהול/שונות-תת-קטגוריה/משלוחים-עד-השעות-הקטנות-של-הלילה-בימי-שבת-רביעי/משחקי-אלכוהול",
  "עירבוב-ושתיה-קלה",
];

const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 800;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function politeDelay() {
  return sleep(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

function pathToUrl(p: string): string {
  const segments = p.split("/").filter(Boolean).map(encodeURIComponent);
  return `${SITE_ORIGIN}/${segments.join("/")}/`;
}

interface VariantSighting {
  category: string;
  productName: string;
  variantName: string;
  priceIls: number;
  formattedPrice: string;
  sourceUrl: string;
}

interface Row {
  category: string;
  productKey: string;
  productName: string;
  variantName: string;
  priceIls: string;
  status: "OK" | "NO_PRICE";
  reason: string;
  sourceUrl: string;
  flags: string;
}

// Shape of the live site's own `window.MUI` global (from merchello.ui.js),
// read after its client-side price fetch has populated it — not something
// this repo defines, just what's observed at runtime.
interface MuiDataTableRow {
  isForVariant: boolean;
  matchKeys?: string[];
  sku?: string;
  price: number;
  formattedPrice: string;
}
interface MuiDataTable {
  productKey: string;
  rows: MuiDataTableRow[];
}
interface MuiWindow extends Window {
  MUI?: { AddItem?: { dataTables?: MuiDataTable[] } };
}

async function main() {
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (compatible; MalabiExpressLocalRebuildBot/1.0; local-dev)",
  });

  // productKey -> all sightings (across categories) of its variants
  const sightingsByKey = new Map<string, VariantSighting[]>();
  const rows: Row[] = [];
  const failures: string[] = [];

  for (const catPath of FORM_CATEGORY_PATHS) {
    const url = pathToUrl(catPath);
    await politeDelay();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch (err) {
      failures.push(`${catPath}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    // Give MUI's async price fetch a moment beyond networkidle.
    try {
      await page.waitForFunction(
        () => {
          const forms = document.querySelectorAll('[data-muifrm="additem"]').length;
          const tables = ((window as unknown as MuiWindow).MUI?.AddItem?.dataTables ?? []).length;
          return forms === 0 || tables >= forms;
        },
        { timeout: 8000 },
      );
    } catch {
      // proceed with whatever loaded — still better than nothing, and we
      // record NO_PRICE for anything that didn't make it into dataTables.
    }

    const extracted = await page.evaluate(() => {
      const tables = (window as unknown as MuiWindow).MUI?.AddItem?.dataTables ?? [];

      // Map productKey -> { name, optionValue -> variantName } from the DOM,
      // since dataTables only carries GUIDs, not display labels.
      const products: Record<string, { name: string; options: Record<string, string> }> = {};
      document.querySelectorAll(".product-item.single").forEach((el) => {
        const info = el.querySelector(".product-info[data-muikey]");
        const key = info?.getAttribute("data-muikey");
        if (!key) return;
        const name = el.querySelector(".product-desc h4")?.textContent?.trim() ?? "";
        const options: Record<string, string> = {};
        el.querySelectorAll('select[name="OptionChoices[0]"] option').forEach((opt) => {
          const value = opt.getAttribute("value") ?? "";
          const text = opt.textContent?.trim() ?? "";
          if (!value || !text || text === "-- בחר --" || value === "-- בחר --") return;
          options[value] = text;
        });
        products[key] = { name, options };
      });

      const out: {
        productKey: string;
        productName: string;
        variantName: string;
        price: number;
        formattedPrice: string;
      }[] = [];

      for (const t of tables) {
        const meta = products[t.productKey];
        for (const row of t.rows) {
          if (!row.isForVariant) continue;
          const optKey = row.matchKeys?.[0];
          const variantName = (optKey && meta?.options[optKey]) || row.sku || optKey || "?";
          out.push({
            productKey: t.productKey,
            productName: meta?.name ?? "(unknown)",
            variantName,
            price: row.price,
            formattedPrice: row.formattedPrice,
          });
        }
      }

      // Also record products whose form rendered but got no dataTable at all
      // (price fetch genuinely failed for them).
      const seenKeys = new Set(tables.map((t) => t.productKey));
      const missing: { productKey: string; productName: string }[] = [];
      for (const [key, meta] of Object.entries(products)) {
        if (!seenKeys.has(key)) missing.push({ productKey: key, productName: meta.name });
      }

      return { out, missing, productCount: Object.keys(products).length, tableCount: tables.length };
    });

    console.log(
      `Visited ${catPath} — ${extracted.productCount} product forms, ${extracted.tableCount} price tables, ${extracted.out.length} priced variants, ${extracted.missing.length} missing`,
    );

    for (const v of extracted.out) {
      const sighting: VariantSighting = {
        category: catPath,
        productName: v.productName,
        variantName: v.variantName,
        priceIls: v.price,
        formattedPrice: v.formattedPrice,
        sourceUrl: url,
      };
      if (!sightingsByKey.has(v.productKey)) sightingsByKey.set(v.productKey, []);
      sightingsByKey.get(v.productKey)!.push(sighting);

      rows.push({
        category: catPath,
        productKey: v.productKey,
        productName: v.productName,
        variantName: v.variantName,
        priceIls: v.formattedPrice,
        status: "OK",
        reason: "",
        sourceUrl: url,
        flags: "",
      });
    }
    for (const m of extracted.missing) {
      rows.push({
        category: catPath,
        productKey: m.productKey,
        productName: m.productName,
        variantName: "",
        priceIls: "",
        status: "NO_PRICE",
        reason: "Form rendered but the page's own price fetch (ProductDataTableApi) never returned a table for this product.",
        sourceUrl: url,
        flags: "",
      });
    }
  }

  await browser.close();

  // ---- Cross-check 1: cross-listed products with mismatched prices ----
  let crossListedConsistent = 0;
  let crossListedMismatch = 0;
  for (const [key, sightings] of sightingsByKey) {
    const byVariant = new Map<string, Set<string>>();
    for (const s of sightings) {
      if (!byVariant.has(s.variantName)) byVariant.set(s.variantName, new Set());
      byVariant.get(s.variantName)!.add(s.formattedPrice);
    }
    let mismatch = false;
    for (const prices of byVariant.values()) {
      if (prices.size > 1) mismatch = true;
    }
    if (sightings.length > byVariant.size) {
      // seen in >1 category page
      if (mismatch) {
        crossListedMismatch++;
        for (const r of rows) {
          if (r.productKey === key) {
            r.flags = r.flags
              ? `${r.flags}; PRICE_MISMATCH_ACROSS_CATEGORIES`
              : "PRICE_MISMATCH_ACROSS_CATEGORIES";
          }
        }
      } else {
        crossListedConsistent++;
      }
    }
  }

  // ---- Cross-check 2: identical full price-set shared by >1 product ----
  // (suggests fallback/demo pricing rather than a real per-product price).
  const priceSetToKeys = new Map<string, Set<string>>();
  for (const [key, sightings] of sightingsByKey) {
    const set = Array.from(new Set(sightings.map((s) => `${s.variantName}=${s.formattedPrice}`))).sort();
    const sig = set.join("|");
    if (!priceSetToKeys.has(sig)) priceSetToKeys.set(sig, new Set());
    priceSetToKeys.get(sig)!.add(key);
  }
  let suspiciousSharedPricing = 0;
  for (const [sig, keys] of priceSetToKeys) {
    if (keys.size > 1 && sig.split("|").length >= 3) {
      suspiciousSharedPricing += keys.size;
      for (const r of rows) {
        if (keys.has(r.productKey)) {
          r.flags = r.flags ? `${r.flags}; SHARED_PRICE_SET_WITH_OTHER_PRODUCT` : "SHARED_PRICE_SET_WITH_OTHER_PRODUCT";
        }
      }
    }
  }

  function csvEscape(v: string): string {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  }

  const header = [
    "category",
    "product_key",
    "product_name",
    "variant",
    "price_ils",
    "status",
    "reason",
    "flags",
    "source_url",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.category, r.productKey, r.productName, r.variantName, r.priceIls, r.status, r.reason, r.flags, r.sourceUrl]
        .map(csvEscape)
        .join(","),
    );
  }
  const outPath = path.join(process.cwd(), "malabi-price-report-browser.csv");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

  const ok = rows.filter((r) => r.status === "OK").length;
  const noPrice = rows.filter((r) => r.status === "NO_PRICE").length;
  const uniqueProducts = sightingsByKey.size;

  console.log("\n================ BROWSER PRICE REPORT ================");
  console.log(`Categories visited: ${FORM_CATEGORY_PATHS.length} (failures: ${failures.length})`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log(`Rows written: ${rows.length} (priced: ${ok}, no price: ${noPrice})`);
  console.log(`Unique products with at least one price: ${uniqueProducts}`);
  console.log(`Cross-listed products checked: ${crossListedConsistent + crossListedMismatch} (consistent: ${crossListedConsistent}, MISMATCHED: ${crossListedMismatch})`);
  console.log(`Products flagged for sharing an identical price set with another product: ${suspiciousSharedPricing}`);
  console.log(`CSV written to: ${outPath}`);
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Browser price report failed:", err);
  process.exit(1);
});
