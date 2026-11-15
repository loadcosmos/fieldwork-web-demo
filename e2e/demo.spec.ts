import { expect, test } from "@playwright/test";

test("sample PDF leads to actions, calendar, and a saved return", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your benefits PDF is hiding money." })).toBeVisible();
  await page.getByRole("button", { name: /Try a sample benefits PDF/ }).click();
  await expect(page.getByRole("heading", { name: "What we found in your plan" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("✓ found").first()).toBeVisible();
  await page.getByRole("button", { name: /See my action plan/ }).click();
  await expect(page.getByText(/you'll lose by doing nothing/)).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
  expect(await page.locator("article").count()).toBeGreaterThanOrEqual(3);
  await page.getByRole("button", { name: /Unlock Plus/ }).click();
  await expect(page.getByRole("button", { name: "Download deadlines (.ics)" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download deadlines (.ics)" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("benefits-deadlines.ics");
  await page.reload();
  await expect(page.getByText(/Welcome back — \d+ actions left/)).toBeVisible();
});
