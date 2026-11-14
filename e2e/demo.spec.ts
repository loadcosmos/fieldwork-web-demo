import { expect, test } from "@playwright/test";
import { example, type Result } from "../src/lib/demo";

test("a new visitor can turn an example into a saved result", async ({ page }) => {
  if (!process.env.E2E_BASE_URL) {
    await page.route("**/api/generate", async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({
        text: example,
        visitorId: expect.stringMatching(/^[a-f0-9-]{36}$/i),
      });
      const result: Result = {
        title: "Organize a library seed swap",
        summary: "Two volunteers are planning an event for up to 30 people.",
        keyPoints: { first: "Reserve the room.", second: "Sort seeds by type.", third: "Label the beginner table." },
        nextStep: "Ask attendees what seeds they plan to bring.",
      };
      await route.fulfill({
        contentType: "application/x-ndjson",
        body: [
          { type: "partial", result: { title: result.title } },
          { type: "result", result },
        ].map((message) => JSON.stringify(message) + "\n").join(""),
      });
    });
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find what matters in your text." })).toBeVisible();
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Use an example" }).click();
  await expect(page.getByLabel("Your text")).toHaveValue(example);
  await page.getByRole("button", { name: "Generate result" }).click();
  await expect(page).toHaveURL(/\/result$/, { timeout: 50_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Your result" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key points" })).toBeVisible();
  await expect(page.locator("article li")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Next step" })).toBeVisible();
  await expect(page.getByText("Saved in this browser.")).toBeVisible();
});
