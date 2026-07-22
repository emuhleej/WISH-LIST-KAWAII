import { test, expect } from "@playwright/test";

// Each test gets a fresh browser context, so localStorage starts empty and the
// app boots with its single sample item ("Example linen robe"). We block the
// Firebase CDN so sync stays offline and deterministic — the app is designed to
// fall back to local storage when those imports fail.
test.beforeEach(async ({ page }) => {
  await page.route(/gstatic\.com\/firebasejs/, route => route.abort());
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(1);
});

test("boots with the sample item and shows local-storage status", async ({ page }) => {
  await expect(page.locator(".card .title")).toContainText("Example linen robe");
  await expect(page.locator("#saveStatus")).toContainText("Saved On This Device");
});

test("adding an item via Quick Save shows it in the grid and updates stats", async ({ page }) => {
  await page.fill("#title", "Platform sneakers");
  await page.fill("#price", "120");
  await page.click("#quickForm button[type=submit]");

  const newCard = page.locator(".card", { hasText: "Platform sneakers" });
  await expect(newCard).toHaveCount(1);
  // Saved stat = 2 (sample + new). The first stat tile is "Saved".
  await expect(page.locator("#stats .stat").first().locator(".num")).toHaveText("2");
});

test("marking an item bought grays it out (purchased class)", async ({ page }) => {
  const card = page.locator(".card", { hasText: "Example linen robe" });
  await card.getByRole("button", { name: "Mark Bought" }).click();

  const purchased = page.locator(".card.purchased", { hasText: "Example linen robe" });
  await expect(purchased).toHaveCount(1);
  // The grayed style must actually be applied, not just the class name. Move the
  // pointer off the card first so we read the resting opacity, not :hover (0.8).
  await page.mouse.move(0, 0);
  await expect(purchased).toHaveCSS("opacity", "0.6");
  await expect(purchased).toHaveCSS("filter", /grayscale/);
});

test("product page no longer offers checkout link or target fields", async ({ page }) => {
  await page.locator(".card .title-button").first().click();
  await expect(page.locator("#productOverlay")).toHaveClass(/open/);

  // The removed controls must be absent from the DOM entirely.
  await expect(page.locator("#pageCheckoutLink")).toHaveCount(0);
  await expect(page.locator("#pageTargetPrice")).toHaveCount(0);
  await expect(page.locator("#productPageCheckout")).toHaveCount(0);

  // The actions row keeps Open Listing + Save Changes only.
  const actions = page.locator(".product-page-actions");
  await expect(actions.getByText("Open Listing")).toBeVisible();
  await expect(actions.getByRole("button", { name: "Save Changes" })).toBeVisible();
  await expect(actions.getByText("Checkout", { exact: true })).toHaveCount(0);
});

test("Quick Save form no longer has target price or checkout link inputs", async ({ page }) => {
  // Reveal the optional fields where these inputs used to live.
  await page.click("#toggleAddDetails");
  await expect(page.locator("#targetPrice")).toHaveCount(0);
  await expect(page.locator("#checkoutLink")).toHaveCount(0);
});

test("cards drop the checkout button and the price-watch row and chart", async ({ page }) => {
  const card = page.locator(".card", { hasText: "Example linen robe" });

  // No checkout / add-checkout action on the card.
  await expect(card.getByRole("button", { name: /checkout/i })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Checkout" })).toHaveCount(0);

  // The Low/High/Logs row, the sparkline chart, and the target readout are gone.
  await expect(card.locator(".price-watch-row")).toHaveCount(0);
  await expect(card.locator(".sparkline")).toHaveCount(0);
  await expect(card.locator(".price-target")).toHaveCount(0);

  // The current price and the up/down change indicator remain.
  await expect(card.locator(".price-current")).toBeVisible();
  await expect(card.locator(".price-delta")).toBeVisible();
});

test("the At Target stat tile is removed from the summary bar", async ({ page }) => {
  await expect(page.locator("#stats .stat")).toHaveCount(3);
  await expect(page.locator("#stats")).not.toContainText("At Target");
});

test("a lone card keeps a sane thumbnail width instead of stretching full-width", async ({ page }) => {
  // With only the sample item present, the auto-fit/auto-fill grid must not
  // let a single card's photo balloon out to the full container width.
  await expect(page.locator(".card")).toHaveCount(1);
  const box = await page.locator(".card").boundingBox();
  expect(box.width).toBeLessThan(500);
});

test("the product-page summary's Store/For row has no leftover empty cell", async ({ page }) => {
  await page.locator(".card .title-button").first().click();
  await expect(page.locator("#productOverlay")).toHaveClass(/open/);

  const row = page.locator("#productPageSummary .price-watch-row");
  await expect(row.locator(".price-mini")).toHaveCount(2);
  await expect(row.getByText("Store")).toBeVisible();
  await expect(row.getByText("For")).toBeVisible();
});

test("editing an item from the product page persists changes", async ({ page }) => {
  await page.locator(".card .title-button").first().click();
  await page.fill("#pageTitle", "Renamed robe");
  await page.click("#productPageForm button[type=submit]");

  await expect(page.locator("#productOverlay")).not.toHaveClass(/open/);
  await expect(page.locator(".card", { hasText: "Renamed robe" })).toHaveCount(1);
});

test("status filter narrows the grid to purchased items", async ({ page }) => {
  await page
    .locator(".card", { hasText: "Example linen robe" })
    .getByRole("button", { name: "Mark Bought" })
    .click();

  await page.selectOption("#filterStatus", "purchased");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card.purchased")).toHaveCount(1);

  await page.selectOption("#filterStatus", "saved");
  await expect(page.locator(".card")).toHaveCount(0);
});

test("deleting an item can be undone", async ({ page }) => {
  await page
    .locator(".card", { hasText: "Example linen robe" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page.locator(".card")).toHaveCount(0);
  await page.locator("#toast").getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".card", { hasText: "Example linen robe" })).toHaveCount(1);
});
