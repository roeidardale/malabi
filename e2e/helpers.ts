import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { e2eDatabaseUrl } from "./env";

/** A product card (grid tile) by product name. */
export const productCard = (page: Page, name: string) =>
  page.locator('[data-slot="card"]', { hasText: name });

export const cartCount = (page: Page) => page.getByTestId("cart-count");

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0);
}

/** Direct DB access for arranging state (e.g. an admin changing a price mid-session). */
export function db() {
  return new PrismaClient({ datasourceUrl: e2eDatabaseUrl() });
}

/** Adds a product from its category page and waits for the confirmation toast. */
export async function addFromCategory(page: Page, categoryPath: string, productName: string) {
  await page.goto(categoryPath);
  await productCard(page, productName).getByRole("button", { name: "הוסף לסל" }).click();
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: productName })).toBeVisible();
}
