import { expect, test } from "@playwright/test";
import { ADMIN } from "./env";

test("owner publishes, hides and deletes a news post", async ({ page }) => {
  const title = `חדשות ${Date.now()}`;

  await page.goto("/admin/login");
  await page.getByLabel("אימייל").fill(ADMIN.email);
  await page.getByLabel("סיסמה").fill(ADMIN.password);
  await page.getByRole("button", { name: "התחברות" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/news/new");
  await page.getByLabel("כותרת").fill(title);
  await page.getByLabel("תוכן").fill("תוכן הפוסט לבדיקה");
  await page.getByRole("checkbox", { name: "הצמדה לראש הרשימה" }).check();
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page).toHaveURL(/\/admin\/news$/);
  await expect(page.getByRole("row", { name: new RegExp(title) })).toBeVisible();

  // Live on the landing page, pinned to the top.
  await page.goto("/");
  await expect(page.getByTestId("news-post").first()).toContainText(title);

  // Unpublish: gone from the landing page.
  await page.goto("/admin/news");
  await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "מפורסם" }).click();
  await expect(page.getByRole("row", { name: new RegExp(title) })).toContainText("טיוטה");
  await page.goto("/");
  await expect(page.getByText(title)).toHaveCount(0);

  // Delete.
  await page.goto("/admin/news");
  const row = page.getByRole("row", { name: new RegExp(title) });
  await row.getByRole("button", { name: "מחיקה" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "מחיקה" }).click();
  await expect(page.getByRole("row", { name: new RegExp(title) })).toHaveCount(0);
});

test("news admin is closed to visitors", async ({ page }) => {
  await page.goto("/admin/news");
  await expect(page).toHaveURL(/\/admin\/login/);
});
