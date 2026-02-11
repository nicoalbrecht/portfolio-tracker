import { test, expect, Page } from "@playwright/test";

const HOLDINGS = [
  { symbol: "AAPL", shares: "10", cost: "150.00" },
  { symbol: "MSFT", shares: "5", cost: "380.00" },
  { symbol: "GOOGL", shares: "3", cost: "140.00" },
  { symbol: "AMZN", shares: "8", cost: "175.00" },
  { symbol: "NVDA", shares: "2", cost: "850.00" },
];

async function addHolding(
  page: Page,
  symbol: string,
  shares: string,
  cost: string,
  isLast: boolean
) {
  await page.getByRole("button", { name: /add holding/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const symbolInput = page.getByPlaceholder(/search by symbol/i);
  await symbolInput.click();
  await symbolInput.fill(symbol);

  await page.waitForTimeout(500);

  const dropdownItem = page.locator("[data-slot='combobox-item']").first();
  await expect(dropdownItem).toBeVisible({ timeout: 5000 });
  await dropdownItem.click();

  const nameInput = page.getByPlaceholder(/search by company name/i);
  await expect(nameInput).not.toHaveValue("", { timeout: 3000 });

  await page.locator("#shares").fill(shares);
  await page.locator("#avgCostBasis").fill(cost);

  if (isLast) {
    await page.getByRole("button", { name: /^add holding$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  } else {
    await page.getByRole("button", { name: /add another/i }).click();
    await expect(symbolInput).toHaveValue("", { timeout: 3000 });
  }
}

test("add 5 holdings via UI", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  for (let i = 0; i < HOLDINGS.length; i++) {
    const h = HOLDINGS[i]!;
    const isLast = i === HOLDINGS.length - 1;
    await addHolding(page, h.symbol, h.shares, h.cost, isLast);
  }

  for (const h of HOLDINGS) {
    await expect(page.getByRole("cell", { name: h.symbol })).toBeVisible();
  }
});
