// scripts/scrape/parseCategoryPage.ts
//
// Parses one already-fetched category page's HTML into:
//  - the page's own display title (from <h1>)
//  - the products listed directly on it
//  - further subcategory paths linked from it (for recursive crawling)

import * as cheerio from "cheerio";
import { parseProductBlock, parseSimpleProductBlock, type ParsedProduct } from "./parseProductBlock";

export interface ParsedCategoryPage {
  title: string | null;
  products: ParsedProduct[];
  /** Size filters (`?ca=`) offered by the page; each lists a distinct product set. */
  sizeFilters: { ca: string; label: string }[];
  subcategoryPaths: string[]; // normalized, decoded, leading+trailing slash, no origin
}

// The live site's category tree lives entirely under these root path
// segments (confirmed by crawling the homepage nav + category pages).
// We only treat links under these roots as "subcategories" to crawl —
// everything else on the page (basket, contact, terms, cdn-cgi, media,
// css/js assets, etc.) is ignored.
const CATEGORY_ROOT_PREFIXES = ["/אלכוהול/", "/עירבוב-ושתיה-קלה/"];

/** Normalize a decoded pathname to always start and end with "/". */
function normalizePath(pathname: string): string {
  let p = pathname;
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.endsWith("/")) p = p + "/";
  return p;
}

function isCategoryHref(decodedPath: string): boolean {
  return CATEGORY_ROOT_PREFIXES.some((prefix) => decodedPath.startsWith(prefix));
}

export function parseCategoryPage(
  html: string,
  activeSize?: { ca: string; label: string },
): ParsedCategoryPage {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || null;

  const products: ParsedProduct[] = [];
  $(".shop .product-item.single").each((_i, el) => {
    const parsed = parseProductBlock($, el);
    if (parsed) products.push(parsed);
  });

  const sizeFilters: { ca: string; label: string }[] = [];
  $('.filter-size a[href^="?ca="]').each((_i, el) => {
    const ca = ($(el).attr("href") ?? "").slice("?ca=".length);
    const label = $(el).text().trim().replace(/\s+/g, " ");
    if (ca && label) sizeFilters.push({ ca, label });
  });

  // Simple-card layout: only meaningful when fetched with a size filter.
  if (activeSize) {
    $(".shop .product-item:not(.single)").each((_i, el) => {
      const parsed = parseSimpleProductBlock($, el, activeSize);
      if (parsed) products.push(parsed);
    });
  }

  const subcategoryPaths = new Set<string>();
  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    // Only ever consider on-site, path-only hrefs (skip protocol-relative,
    // absolute-URL, mailto:, tel:, javascript:, hash-only links, etc.)
    if (!href.startsWith("/") || href.startsWith("//")) return;

    let decoded: string;
    try {
      decoded = decodeURIComponent(href.split("#")[0].split("?")[0]);
    } catch {
      return;
    }
    const normalized = normalizePath(decoded);
    if (isCategoryHref(normalized)) {
      subcategoryPaths.add(normalized);
    }
  });

  return {
    title,
    products,
    sizeFilters,
    subcategoryPaths: Array.from(subcategoryPaths),
  };
}
