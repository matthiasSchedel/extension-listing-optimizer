// @vitest-environment node
import { describe, expect, it } from "vitest";

import { scrapeChromeStoreListing } from "../../server/scraper/chromeStore";

const CLICKCLEAN_URL =
  "https://chromewebstore.google.com/detail/clickclean/ghgabhipcejejjmhhchfonmamedcbeod";

describe.runIf(process.env.RUN_LIVE_CHROME_STORE_TESTS === "1")(
  "live review scraping",
  () => {
    it("caps Click&Clean reviews at 200", async () => {
      const scraped = await scrapeChromeStoreListing(CLICKCLEAN_URL, {
        timeoutMs: 90_000,
        reviewsLimit: 200,
      });

      expect(scraped.reviews).toHaveLength(200);
      expect(
        scraped.reviews.every(
          (review) =>
            review.rating !== null && review.rating >= 1 && review.rating <= 5,
        ),
      ).toBe(true);
      expect(
        scraped.reviews.every(
          (review) => !/^https?:\/\/\S+$/i.test(review.text.trim()),
        ),
      ).toBe(true);
    }, 120_000);
  },
);
