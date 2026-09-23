// Phase 1 (real catalog data): applies a price report — after the client has
// confirmed it — onto the catalog.
//
// Input is a CSV shaped like malabi-price-report-final.csv (or the Hebrew
// export built from it for the client): category, product_name, variant,
// price_ils, status[, a client "confirmed price" column]. There is no stable
// join key in that report (see KNOWN-ISSUES — sourceProductKey/
// sourceOptionValue aren't in it), so rows are matched to the catalog by
// Category.fullSlugPath + Product.name + ProductVariant.name. A row that
// matches more than one product/variant (or none) is skipped and listed,
// never guessed at.
//
// A row is only imported if it has a confirmed-price value, or (no confirmed
// column present) its status is OK — never from an unconfirmed NO_PRICE row.
// Matched variants are written with priceSource="IMPORTED" (distinct from
// "MANUAL" and "PLACEHOLDER") so their origin stays visible afterwards.
//
// A product that started with zero variants gets one CREATED per unmatched
// row (using that row's variant name/price) instead of being skipped — this
// is what actually fixes "product has no variant, can't be added to cart".
// A product that already has at least one variant is left alone when a row's
// variant name doesn't match one of them: that's a naming/data-quality
// mismatch worth checking by hand, not something to guess a new option for.
//
// Defaults to a DRY RUN — prints what would change, writes nothing. Pass
// --apply to actually update the database.
//
// If the client returns the .xlsx directly: File > Save As > CSV UTF-8
// first, this script only reads CSV.
//
//   npx tsx --env-file=.env scripts/import-prices.ts [--file=malabi-price-report-final.csv] [--apply]

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

const IMPORTED_PRICE_SOURCE = "IMPORTED";
const MAX_LISTED = 20;

// --- CSV parsing (RFC4180-ish: quoted fields, "" for an embedded quote) ---
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

// Tolerates curly quotes / gershayim / geresh a spreadsheet editor may
// introduce, and collapses stray whitespace, without needing an exact
// byte-for-byte match against what was originally scraped.
function normalizeText(s: string): string {
  return s
    .replace(/[“”״]/g, '"')
    .replace(/[‘’׳]/g, "'")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "₪59", "₪12.50", "59", "" -> shekels or null if unusable.
function parsePriceShekels(raw: string): number | null {
  const cleaned = raw.replace(/[₪\s,]/g, "").trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

const STATUS_OK = new Set(["OK", "נמצא"]);

function findHeaderIndex(header: string[], keywords: string[], exclude: string[] = []): number {
  const lower = header.map((h) => h.trim());
  for (const kw of keywords) {
    const i = lower.findIndex((h) => h === kw);
    if (i !== -1) return i;
  }
  for (const kw of keywords) {
    const i = lower.findIndex((h) => h.includes(kw) && !exclude.some((ex) => h.includes(ex)));
    if (i !== -1) return i;
  }
  return -1;
}

interface ImportRow {
  lineNumber: number;
  category: string;
  productName: string;
  variantName: string;
  priceShekels: number;
}

function loadRows(filePath: string): { rows: ImportRow[]; skippedUnconfirmed: number; skippedNoPrice: number } {
  const text = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, "");
  const table = parseCsv(text);
  if (table.length < 2) throw new Error(`${filePath}: no data rows`);

  const header = table[0];
  const categoryIdx = findHeaderIndex(header, ["category", "קטגוריה"]);
  const productIdx = findHeaderIndex(header, ["product_name", "שם מוצר", "product"]);
  const variantIdx = findHeaderIndex(header, ["variant", "אפשרות"]);
  const statusIdx = findHeaderIndex(header, ["status", "סטטוס"]);
  const confirmedIdx = findHeaderIndex(header, ["מאושר", "confirmed"]);
  // "price_ils" / "מחיר שמופיע באתר" — but not the confirmed-price column.
  const scrapedIdx = findHeaderIndex(header, ["price_ils", "מחיר"], ["מאושר", "confirmed"]);

  if (categoryIdx === -1 || productIdx === -1 || variantIdx === -1) {
    throw new Error(`${filePath}: couldn't find category/product/variant columns in header: ${header.join(" | ")}`);
  }

  const rows: ImportRow[] = [];
  let skippedUnconfirmed = 0;
  let skippedNoPrice = 0;

  for (let r = 1; r < table.length; r++) {
    const cols = table[r];
    const lineNumber = r + 1;
    const category = (cols[categoryIdx] ?? "").trim();
    const productName = (cols[productIdx] ?? "").trim();
    const variantName = (cols[variantIdx] ?? "").trim();
    if (!category || !productName || !variantName) continue;

    const status = statusIdx !== -1 ? (cols[statusIdx] ?? "").trim() : "OK";
    const confirmedRaw = confirmedIdx !== -1 ? (cols[confirmedIdx] ?? "").trim() : "";
    const scrapedRaw = scrapedIdx !== -1 ? (cols[scrapedIdx] ?? "").trim() : "";

    // Never import an unconfirmed NO_PRICE row just because the scraper
    // happened to find a number nearby — only a client-confirmed value, or a
    // scraped price already marked OK, counts.
    if (!confirmedRaw && !STATUS_OK.has(status)) {
      skippedUnconfirmed++;
      continue;
    }

    const priceShekels = parsePriceShekels(confirmedRaw || scrapedRaw);
    if (priceShekels === null) {
      skippedNoPrice++;
      continue;
    }

    rows.push({ lineNumber, category, productName, variantName, priceShekels });
  }

  return { rows, skippedUnconfirmed, skippedNoPrice };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.find((a) => a.startsWith("--file="));
  const filePath = path.resolve(
    process.cwd(),
    fileArg ? fileArg.slice("--file=".length) : "malabi-price-report-final.csv",
  );

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  const { rows, skippedUnconfirmed, skippedNoPrice } = loadRows(filePath);
  console.log(
    `${filePath}: ${rows.length} confirmed/priced row(s); ` +
      `${skippedUnconfirmed} skipped (not confirmed and not OK), ${skippedNoPrice} skipped (no usable price).`,
  );
  if (rows.length === 0) return;

  const categoryCache = new Map<string, { id: string } | null>();
  const productsByCategory = new Map<string, { id: string; name: string }[]>();
  const variantsByProduct = new Map<string, { id: string; name: string; priceAgorot: number; priceSource: string }[]>();
  const startedWithNoVariants = new Set<string>();

  let matched = 0;
  let unchanged = 0;
  let updated = 0;
  let created = 0;
  const unmatchedCategory: string[] = [];
  const unmatchedProduct: string[] = [];
  const ambiguousProduct: string[] = [];
  const unmatchedVariant: string[] = [];
  const ambiguousVariant: string[] = [];

  for (const row of rows) {
    let category = categoryCache.get(row.category);
    if (category === undefined) {
      category = await prisma.category.findUnique({ where: { fullSlugPath: row.category }, select: { id: true } });
      categoryCache.set(row.category, category);
    }
    if (!category) {
      unmatchedCategory.push(`line ${row.lineNumber}: category "${row.category}"`);
      continue;
    }

    let products = productsByCategory.get(category.id);
    if (!products) {
      products = await prisma.product.findMany({ where: { categoryId: category.id }, select: { id: true, name: true } });
      productsByCategory.set(category.id, products);
    }
    const productMatches = products.filter((p) => normalizeText(p.name) === normalizeText(row.productName));
    if (productMatches.length === 0) {
      unmatchedProduct.push(`line ${row.lineNumber}: "${row.category}" / "${row.productName}"`);
      continue;
    }
    if (productMatches.length > 1) {
      ambiguousProduct.push(`line ${row.lineNumber}: "${row.category}" / "${row.productName}" (${productMatches.length} products share this name)`);
      continue;
    }
    const product = productMatches[0];

    let variants = variantsByProduct.get(product.id);
    if (!variants) {
      variants = await prisma.productVariant.findMany({
        where: { productId: product.id },
        select: { id: true, name: true, priceAgorot: true, priceSource: true },
      });
      variantsByProduct.set(product.id, variants);
      if (variants.length === 0) startedWithNoVariants.add(product.id);
    }
    const variantMatches = variants.filter((v) => normalizeText(v.name) === normalizeText(row.variantName));
    if (variantMatches.length === 0) {
      if (!startedWithNoVariants.has(product.id)) {
        unmatchedVariant.push(`line ${row.lineNumber}: "${row.productName}" / "${row.variantName}"`);
        continue;
      }

      matched++;
      created++;
      const newPriceAgorot = shekelsToAgorot(row.priceShekels);
      const newVariant = {
        id: apply
          ? (
              await prisma.productVariant.create({
                data: {
                  productId: product.id,
                  name: row.variantName,
                  priceAgorot: newPriceAgorot,
                  isActive: true,
                  sortOrder: variants.length,
                  priceSource: IMPORTED_PRICE_SOURCE,
                },
              })
            ).id
          : `dry-run-${row.lineNumber}`,
        name: row.variantName,
        priceAgorot: newPriceAgorot,
        priceSource: IMPORTED_PRICE_SOURCE,
      };
      variants.push(newVariant);
      continue;
    }
    if (variantMatches.length > 1) {
      ambiguousVariant.push(`line ${row.lineNumber}: "${row.productName}" / "${row.variantName}" (${variantMatches.length} variants share this name)`);
      continue;
    }
    const variant = variantMatches[0];

    matched++;
    const newPriceAgorot = shekelsToAgorot(row.priceShekels);
    if (variant.priceAgorot === newPriceAgorot && variant.priceSource === IMPORTED_PRICE_SOURCE) {
      unchanged++;
      continue;
    }

    if (apply) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { priceAgorot: newPriceAgorot, priceSource: IMPORTED_PRICE_SOURCE },
      });
    }
    updated++;
  }

  console.log(`Matched ${matched}/${rows.length} rows to exactly one variant.`);
  console.log(
    `${apply ? "Created" : "Would create"} ${created} variant(s) for products that had none; ` +
      `${apply ? "updated" : "would update"} ${updated} existing variant(s); ${unchanged} already at the imported price.`,
  );

  const report = (label: string, items: string[]) => {
    if (items.length === 0) return;
    console.log(`\n${items.length} ${label}:`);
    items.slice(0, MAX_LISTED).forEach((l) => console.log(`  ${l}`));
    if (items.length > MAX_LISTED) console.log(`  ...and ${items.length - MAX_LISTED} more`);
  };
  report("row(s) with an unknown category", unmatchedCategory);
  report("row(s) with no matching product", unmatchedProduct);
  report("row(s) matching more than one product (skipped, not guessed)", ambiguousProduct);
  report("row(s) with no matching variant", unmatchedVariant);
  report("row(s) matching more than one variant (skipped, not guessed)", ambiguousVariant);

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write these prices.");
  }
}

main()
  .catch((err) => {
    console.error("Price import failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
