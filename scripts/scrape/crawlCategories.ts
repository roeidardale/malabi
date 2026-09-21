// scripts/scrape/crawlCategories.ts
//
// Recursive (BFS) crawl of the live site's category tree.
//
// Starts from a seed list of known category paths (plus whatever the
// homepage nav links to), and for every page visited, parses it for BOTH
// product blocks AND further subcategory links, enqueuing any newly
// discovered paths. Category pages can be deeper than the top nav shows
// (e.g. the שונות-תת-קטגוריה branch), so we never stop at the seed list —
// we keep following links found on every page we visit.

import { SITE_ORIGIN, fetchHtml } from "./httpClient";
import { parseCategoryPage } from "./parseCategoryPage";
import type { ParsedProduct } from "./parseProductBlock";

export interface CrawledCategory {
  /** Normalized, decoded path, e.g. "/אלכוהול/בירות/" */
  path: string;
  title: string | null;
  products: ParsedProduct[];
  sourceUrl: string;
}

export interface CrawlFailure {
  path: string;
  error: string;
}

export interface CrawlResult {
  categories: CrawledCategory[];
  failures: CrawlFailure[];
}

function pathToUrl(path: string): string {
  const segments = path.split("/").filter(Boolean).map(encodeURIComponent);
  return `${SITE_ORIGIN}/${segments.join("/")}/`;
}

export async function crawlCategories(seedPaths: string[]): Promise<CrawlResult> {
  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: string[] = [];
  const categories: CrawledCategory[] = [];
  const failures: CrawlFailure[] = [];

  function enqueue(path: string) {
    if (visited.has(path) || queued.has(path)) return;
    queued.add(path);
    queue.push(path);
  }

  for (const p of seedPaths) enqueue(p);

  // Also parse the homepage itself — it may link to categories not in our
  // hardcoded seed list.
  try {
    const homeHtml = await fetchHtml(`${SITE_ORIGIN}/`);
    const homeParsed = parseCategoryPage(homeHtml);
    for (const sub of homeParsed.subcategoryPaths) enqueue(sub);
  } catch (err) {
    failures.push({ path: "/", error: err instanceof Error ? err.message : String(err) });
  }

  while (queue.length > 0) {
    const path = queue.shift()!;
    queued.delete(path);
    if (visited.has(path)) continue;
    visited.add(path);

    const url = pathToUrl(path);
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      failures.push({ path, error: err instanceof Error ? err.message : String(err) });
      continue;
    }

    const parsed = parseCategoryPage(html);
    const products = [...parsed.products];
    // Size-filtered categories: the unfiltered page can't be parsed reliably,
    // so fetch each size view and collect its products.
    const seenKeys = new Set(products.map((p) => p.sourceProductKey));
    for (const size of parsed.sizeFilters) {
      try {
        const sized = parseCategoryPage(await fetchHtml(`${url}?ca=${size.ca}`), size);
        for (const p of sized.products) {
          if (p.sourceProductKey && seenKeys.has(p.sourceProductKey)) continue;
          seenKeys.add(p.sourceProductKey);
          products.push(p);
        }
      } catch (err) {
        failures.push({
          path: `${path}?ca=${size.ca}`,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    categories.push({ path, title: parsed.title, products, sourceUrl: url });

    for (const sub of parsed.subcategoryPaths) {
      enqueue(sub);
    }
  }

  return { categories, failures };
}
