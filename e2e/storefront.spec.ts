import { expect, test } from "@playwright/test";
import {
  addFromCategory,
  cartCount,
  db,
  expectNoHorizontalScroll,
  productCard,
} from "./helpers";

test.describe("landing page", () => {
  test("shows hero, news and category photos", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("משלוחי אלכוהול");
    await expect(page.getByTestId("news-post")).toContainText("עדכון לבדיקה");

    const tiles = page.locator("#categories a");
    await expect(tiles).toHaveCount(3);
    await expect(page.locator("#categories").getByText("קטגוריה ריקה")).toHaveCount(0);

    // Every category tile has a photo that actually loaded.
    const images = page.locator("#categories img");
    await expect(images).toHaveCount(3);
    await expect
      .poll(() =>
        images.evaluateAll((all) =>
          all.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0),
        ),
      )
      .toBe(true);

    await expectNoHorizontalScroll(page);
  });

  test("empty categories are hidden from navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "קטגוריות" })).not.toContainText("קטגוריה ריקה");

    // A direct link still resolves, to an explanatory empty state rather than an error.
    await page.goto("/empty");
    await expect(page.getByText("אין מוצרים בקטגוריה זו כרגע")).toBeVisible();
  });

  test("footer links open real pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "אודות" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("אודות");
  });

  test("old Hebrew cart URL redirects to /cart", async ({ page }) => {
    await page.goto("/סל-קניות");
    await expect(page).toHaveURL(/\/cart$/);
  });
});

test.describe("browsing and adding to cart", () => {
  test("adds a single-item product with one click", async ({ page }) => {
    await page.goto("/alcohol/snacks");
    const card = productCard(page, "חטיף לבדיקה");
    await expect(card.getByTestId("price")).toHaveText("₪12");

    await card.getByRole("button", { name: "הוסף לסל" }).click();

    await expect(page.locator("[data-sonner-toast]")).toContainText("חטיף לבדיקה נוסף לסל");
    await expect(cartCount(page)).toHaveText("1");
    await expectNoHorizontalScroll(page);
  });

  test("variant and quantity change the price", async ({ page }) => {
    await page.goto("/alcohol/beer");
    const card = productCard(page, "בירה לבדיקה");
    await expect(card.getByTestId("price")).toHaveText("₪14");

    await card.getByRole("radio", { name: "שישייה" }).click();
    await expect(card.getByTestId("price")).toHaveText("₪75");

    await card.getByRole("button", { name: "הוסף כמות" }).click();
    await expect(card.getByTestId("price")).toHaveText("₪150");

    await card.getByRole("button", { name: "הוסף לסל" }).click();
    await expect(cartCount(page)).toHaveText("2");
  });

  test("a product without a price cannot be added", async ({ page }) => {
    await page.goto("/alcohol/snacks");
    const card = productCard(page, "מוצר ללא מחיר");
    await expect(card.getByTestId("price")).toHaveText("מחיר בקרוב");
    await expect(card.getByRole("button", { name: "הוסף לסל" })).toBeDisabled();
  });

  test("product page adds to cart too", async ({ page }) => {
    await page.goto("/alcohol/beer");
    await page.getByRole("link", { name: "בירה לבדיקה" }).first().click();
    await expect(page).toHaveURL(/\/alcohol\/beer\/test-beer$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("בירה לבדיקה");

    await page.getByRole("button", { name: "הוסף לסל" }).click();
    await expect(cartCount(page)).toHaveText("1");
  });

  test("large categories are paginated", async ({ page }) => {
    await page.goto("/alcohol/bulk");
    await expect(page.locator('[data-slot="card"]')).toHaveCount(24);

    await page.getByRole("link", { name: "הבא" }).click();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(page.locator('[data-slot="card"]')).toHaveCount(6);
  });
});

test.describe("cart and checkout", () => {
  test("below the minimum order the cart blocks checkout", async ({ page }) => {
    await addFromCategory(page, "/alcohol/snacks", "חטיף לבדיקה");
    await page.goto("/cart");

    await expect(page.getByText("להזמנה מינימלית")).toBeVisible();
    await expect(page.getByRole("button", { name: "המשך לתשלום" })).toBeDisabled();
    await expectNoHorizontalScroll(page);
  });

  test("guest completes an order", async ({ page }) => {
    await page.goto("/alcohol/beer");
    const card = productCard(page, "בירה לבדיקה");
    await card.getByRole("radio", { name: "שישייה" }).click();
    await card.getByRole("button", { name: "הוסף לסל" }).click();
    await expect(cartCount(page)).toHaveText("1");

    await page.getByRole("link", { name: /סל קניות/ }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText("סה\"כ לתשלום")).toBeVisible();
    await page.getByRole("link", { name: "המשך לתשלום" }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByLabel("שם מלא").fill("ישראל ישראלי");
    await page.getByLabel("טלפון").fill("0501234567");
    await page.getByLabel("כתובת למשלוח").fill("הרצל 1");
    await page.getByRole("button", { name: "המשך לתשלום" }).click();

    await expect(page).toHaveURL(/\/checkout\/pay\//);
    await page.getByRole("button", { name: "אשר תשלום (מדומה)" }).click();

    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ההזמנה התקבלה בהצלחה!");
    await expect(cartCount(page)).toHaveCount(0);
  });

  test("cart follows live prices and drops unavailable items", async ({ page }) => {
    const prisma = db();
    try {
      const variant = await prisma.productVariant.findFirstOrThrow({
        where: { product: { slug: "test-snack" } },
      });

      await addFromCategory(page, "/alcohol/snacks", "חטיף לבדיקה");

      // An admin raises the price after the item is already in the cart.
      await prisma.productVariant.update({ where: { id: variant.id }, data: { priceAgorot: 2000 } });
      await page.goto("/cart");
      await expect(page.getByText("₪20").first()).toBeVisible();

      // ...then removes the price entirely: the line is set aside, not sold at ₪0.
      await prisma.productVariant.update({ where: { id: variant.id }, data: { priceAgorot: 0 } });
      await page.goto("/cart");
      await expect(page.getByTestId("unavailable-items")).toContainText("חטיף לבדיקה");
      await expect(page.getByRole("button", { name: "המשך לתשלום" })).toBeDisabled();

      await prisma.productVariant.update({ where: { id: variant.id }, data: { priceAgorot: 1200 } });
    } finally {
      await prisma.$disconnect();
    }
  });
});
