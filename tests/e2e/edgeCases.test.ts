import { expect, test } from "@playwright/test";

const emptyReviewResponse = {
  extension: {
    name: "Edge Extension",
    id: "ffffffffffffffffffffffffffffffff",
    version: "1.0.0",
    description: "Long content ".repeat(50),
    shortDescription:
      "A full short description for edge case tests and UI resilience with no reviews and no screenshots rendered correctly.",
    category: "Tools",
    installs: "100+",
    rating: 4,
    ratingCount: 2,
    lastUpdated: "2026-01-01",
    size: "1MB",
    developer: { name: "Edge", website: null, email: null },
    permissions: ["storage"],
    supportedLanguages: ["English"],
    privacyPolicyUrl: null,
    screenshots: [],
    icon: null,
    promoTiles: { small: null, large: null, marquee: null },
  },
  reviews: [],
  competitors: [],
  scores: {
    overall: 55,
    grade: "D",
    completeness: { score: 30, issues: [] },
    seo: { score: 65, issues: [] },
    socialProof: { score: 40, issues: [] },
    trust: { score: 70, issues: [] },
  },
  suggestions: {
    title: "Edge Title",
    shortDescription: "short".padEnd(132, "."),
    fullDescription: "Body",
    keywords: ["one", "two", "three", "four", "five"],
    screenshotStrategy: [],
    topImprovements: [],
    competitiveInsights: [],
  },
};

test("handles edge states and rapid submissions", async ({ page }) => {
  let requestCount = 0;

  await page.route("**/api/analyze", async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyReviewResponse),
    });
  });

  await page.goto("/");
  await page
    .getByLabel("Chrome Web Store URL")
    .fill(
      "https://chromewebstore.google.com/detail/edge/ffffffffffffffffffffffffffffffff",
    );

  await page.getByRole("button", { name: "Analyze" }).dblclick();

  await expect(page.getByText("Overall Score")).toBeVisible();
  expect(requestCount).toBe(1);

  await page.getByRole("button", { name: "Reviews" }).click();
  await expect(page.getByText("No reviews found.")).toBeVisible();

  await page.getByRole("button", { name: "Screenshots" }).click();
  await expect(page.getByText("No screenshots detected.")).toBeVisible();

  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.getByRole("button", { name: "Light mode" })).toBeVisible();
});

test("shows network error message", async ({ page }) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Network error during scrape." }),
    });
  });

  await page.goto("/");
  await page
    .getByLabel("Chrome Web Store URL")
    .fill(
      "https://chromewebstore.google.com/detail/edge/ffffffffffffffffffffffffffffffff",
    );

  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText("Network error during scrape.")).toBeVisible();
});
