// scripts/scrape/parseProductBlock.ts
//
// Extracts one product's data from a single `.product-item.single` block
// (cheerio element) on a category page.

import type { CheerioAPI } from "cheerio";
import { SITE_ORIGIN } from "./httpClient";

export interface ParsedVariant {
  name: string;
  sourceOptionValue: string;
}

export interface ParsedProduct {
  name: string;
  shortDescription: string | null;
  imageUrl: string | null; // absolute URL on the live site
  sourceProductKey: string | null;
  variants: ParsedVariant[];
}

const PLACEHOLDER_OPTION = "-- בחר --";

/**
 * `el` must be a `.product-item.single` element (or equivalent) found within
 * a category page already loaded into cheerio as `$`.
 */
export function parseProductBlock(
  $: CheerioAPI,
  el: Parameters<CheerioAPI>[0],
): ParsedProduct | null {
  const $el = $(el);

  const name = $el.find(".product-desc h4").first().text().trim();
  if (!name) {
    // Not a real product block (defensive: malformed markup) — skip it.
    return null;
  }

  const shortDescriptionRaw = $el.find(".product-desc .desc").first().text().trim();
  const shortDescription = shortDescriptionRaw.length > 0 ? shortDescriptionRaw : null;

  const imgSrc = $el.find(".product-image input[type=image]").first().attr("src");
  const imageUrl = imgSrc ? new URL(imgSrc, SITE_ORIGIN).href : null;

  const productKeyFromInput = $el.find("input#ProductKey").first().attr("value");
  const productKeyFromData = $el.find(".product-info").first().attr("data-muikey");
  const sourceProductKey = (productKeyFromInput || productKeyFromData || "").trim() || null;

  const variants: ParsedVariant[] = [];
  $el.find('select[name="OptionChoices[0]"] option').each((_i, optionEl) => {
    const $option = $(optionEl);
    const value = ($option.attr("value") ?? "").trim();
    const text = $option.text().trim();
    if (value === PLACEHOLDER_OPTION || text === PLACEHOLDER_OPTION) {
      return; // skip the "-- בחר --" placeholder
    }
    if (!value || !text) {
      return;
    }
    variants.push({ name: text, sourceOptionValue: value });
  });

  return {
    name,
    shortDescription,
    imageUrl,
    sourceProductKey,
    variants,
  };
}
