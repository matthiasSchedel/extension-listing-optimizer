import puppeteer from "puppeteer";

import { probeImageDimensions } from "./imageAnalyzer";
import type {
  CompetitorData,
  ExtensionData,
  ReviewData,
  ScrapeResult,
  ScreenshotAsset,
} from "../types";

const CHROME_STORE_HOSTS = new Set([
  "chromewebstore.google.com",
  "chrome.google.com",
]);

const EXTENSION_ID_REGEX = /\/detail\/(?:[^/]+\/)?([a-z]{32})/i;

interface ScrapeOptions {
  timeoutMs?: number;
  reviewsLimit?: number;
  competitorsLimit?: number;
}

export function extractExtensionId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const pathMatch = url.pathname.match(EXTENSION_ID_REGEX);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }

    const queryId = url.searchParams.get("id");
    if (queryId?.match(/^[a-z]{32}$/i)) {
      return queryId;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last?.match(/^[a-z]{32}$/i)) {
      return last;
    }

    return null;
  } catch {
    return null;
  }
}

export function validateChromeWebStoreUrl(rawUrl: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const url = new URL(rawUrl);

    if (!CHROME_STORE_HOSTS.has(url.hostname)) {
      return {
        valid: false,
        error:
          "Only Chrome Web Store URLs are supported (chromewebstore.google.com).",
      };
    }

    if (!extractExtensionId(rawUrl)) {
      return {
        valid: false,
        error:
          "Could not detect extension ID from URL. Use a direct listing URL ending with the extension ID.",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Invalid URL format.",
    };
  }
}

function parseCount(text: string | null | undefined): number | null {
  if (!text) {
    return null;
  }

  const clean = text.replace(/,/g, "");
  const match = clean.match(/([0-9]+(?:\.[0-9]+)?)([kKmM])?/);
  if (!match) {
    return null;
  }

  let value = Number(match[1]);
  if (match[2]?.toLowerCase() === "k") {
    value *= 1_000;
  }
  if (match[2]?.toLowerCase() === "m") {
    value *= 1_000_000;
  }
  return Number.isFinite(value) ? Math.round(value) : null;
}

function parseDecimal(text: string | null | undefined): number | null {
  if (!text) {
    return null;
  }

  const match = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

async function attachDimensions(urls: string[]): Promise<ScreenshotAsset[]> {
  const deduped = [...new Set(urls)].slice(0, 20);
  const assets = await Promise.all(
    deduped.map(async (url) => {
      const { width, height } = await probeImageDimensions(url, 8000, 0);
      return { url, width, height };
    }),
  );
  return assets;
}

export async function scrapeChromeStoreListing(
  listingUrl: string,
  options: ScrapeOptions = {},
): Promise<ScrapeResult> {
  const validation = validateChromeWebStoreUrl(listingUrl);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timeoutMs = options.timeoutMs ?? 30_000;
  const reviewsLimit = options.reviewsLimit ?? 30;
  const competitorsLimit = options.competitorsLimit ?? 5;
  const extensionId = extractExtensionId(listingUrl);

  if (!extensionId) {
    throw new Error("Unable to extract extension ID from URL.");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);

    await page.goto(listingUrl, {
      waitUntil: "networkidle2",
      timeout: timeoutMs,
    });
    await page.waitForSelector("body", {
      timeout: Math.min(timeoutMs, 10_000),
    });

    const scraped = await page.evaluate(
      ({ reviewsLimit: maxReviews, competitorsLimit: maxCompetitors }) => {
        const safeText = (value: string | null | undefined) =>
          value?.trim() ?? null;

        const firstText = (selectors: string[]): string | null => {
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            const text = safeText(element?.textContent);
            if (text) {
              return text;
            }
          }
          return null;
        };

        const firstAttr = (
          selectors: string[],
          attr: string,
        ): string | null => {
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            const value = safeText(element?.getAttribute(attr));
            if (value) {
              return value;
            }
          }
          return null;
        };

        const parseJsonLd = () => {
          const scripts = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]'),
          );

          const objects: any[] = [];

          for (const script of scripts) {
            try {
              const parsed = JSON.parse(script.textContent ?? "{}");
              if (Array.isArray(parsed)) {
                objects.push(...parsed);
              } else {
                objects.push(parsed);
              }
            } catch {
              // ignore bad JSON-LD blocks
            }
          }

          const appObject = objects.find(
            (obj) =>
              obj?.["@type"] === "SoftwareApplication" ||
              obj?.["@type"] === "Product",
          );

          return {
            app: appObject ?? null,
            all: objects,
          };
        };

        const collectImageUrls = (): string[] => {
          const imgs = Array.from(document.querySelectorAll("img[src]"));
          return imgs
            .map((img) => img.getAttribute("src") || "")
            .filter((src) => src.startsWith("http"));
        };

        const collectScreenshots = (images: string[]): string[] => {
          return images.filter((url) =>
            /(screenshot|feature|promo|googleusercontent)/i.test(url),
          );
        };

        const extractListAfterHeading = (label: string): string[] => {
          const bodyText = document.body.innerText.replace(/\r/g, "");
          const regex = new RegExp(`${label}\\s*\\n([\\s\\S]{0,800})`, "i");
          const match = bodyText.match(regex);
          if (!match?.[1]) {
            return [];
          }

          return match[1]
            .split("\n")
            .map((value) => value.trim())
            .filter((value) => value.length > 1)
            .slice(0, 20);
        };

        const extractField = (label: string): string | null => {
          const bodyText = document.body.innerText.replace(/\r/g, "");
          const regex = new RegExp(`${label}\\s*\\n([^\\n]+)`, "i");
          return bodyText.match(regex)?.[1]?.trim() ?? null;
        };

        const { app } = parseJsonLd();
        const imageUrls = collectImageUrls();

        const descriptionFromDom = firstText([
          '[data-testid="read-more-description"]',
          '[jsname="WbKHeb"]',
          'div[aria-label="Description"]',
        ]);

        const reviews: Array<{
          author: string;
          rating: number | null;
          text: string;
          date: string | null;
          developerReply: string | null;
        }> = [];

        const reviewNodes = Array.from(
          document.querySelectorAll(
            '[data-review-id], [jscontroller*="a4gB8"]',
          ),
        ).slice(0, maxReviews);

        for (const node of reviewNodes) {
          const text =
            safeText(
              node.querySelector('[data-testid="review-text"], span')
                ?.textContent,
            ) ?? "";
          const author =
            safeText(
              node.querySelector('[data-testid="author-name"], a, h3')
                ?.textContent,
            ) ?? "Anonymous";
          const date = safeText(
            node.querySelector('time, [data-testid="review-date"]')
              ?.textContent,
          );
          const ratingText = safeText(
            node
              .querySelector('[aria-label*="star"], [role="img"]')
              ?.getAttribute("aria-label"),
          );
          const rating = Number(
            ratingText?.match(/([0-9](?:\.[0-9])?)/)?.[1] ?? NaN,
          );
          const reply = safeText(
            node.querySelector(
              '[data-testid="developer-reply"], .developer-reply',
            )?.textContent,
          );

          if (text) {
            reviews.push({
              author,
              rating: Number.isFinite(rating) ? rating : null,
              text,
              date,
              developerReply: reply,
            });
          }
        }

        const competitors: Array<{
          name: string;
          url: string;
          rating: number | null;
          installs: string | null;
          ratingCount: number | null;
        }> = [];

        const links = Array.from(
          document.querySelectorAll('a[href*="/detail/"]'),
        ) as HTMLAnchorElement[];

        for (const link of links) {
          const href = link.href;
          if (!href || href === window.location.href) {
            continue;
          }

          const cardText = link.closest("div,article")?.textContent ?? "";
          const name =
            safeText(link.textContent) ||
            safeText(link.getAttribute("aria-label"));
          if (!name || name.length < 2) {
            continue;
          }

          const rating = Number(
            cardText.match(/([0-5](?:\.[0-9])?)\s*(?:star|★)/i)?.[1] ?? NaN,
          );
          const installs =
            cardText.match(/[0-9,.]+\+\s*(?:users|downloads|install)/i)?.[0] ??
            null;
          const ratingCount = Number(
            cardText.match(/\(([0-9,]+)\)/)?.[1]?.replace(/,/g, "") ?? NaN,
          );

          if (!competitors.some((item) => item.url === href)) {
            competitors.push({
              name,
              url: href,
              rating: Number.isFinite(rating) ? rating : null,
              installs,
              ratingCount: Number.isFinite(ratingCount) ? ratingCount : null,
            });
          }

          if (competitors.length >= maxCompetitors) {
            break;
          }
        }

        return {
          name:
            safeText(app?.name) ||
            firstText([
              "h1",
              "header h1",
              '[role="heading"][aria-level="1"]',
            ]) ||
            "Unknown Extension",
          description:
            safeText(app?.description) ||
            descriptionFromDom ||
            extractField("Overview") ||
            "",
          shortDescription:
            firstText(['meta[name="description"]']) ||
            safeText(
              document
                .querySelector('meta[name="description"]')
                ?.getAttribute("content"),
            ) ||
            "",
          category:
            extractField("Category") || safeText(app?.applicationCategory),
          version: extractField("Version") || safeText(app?.softwareVersion),
          installs: extractField("Users") || extractField("Installs"),
          ratingText:
            extractField("Rating") ||
            safeText(app?.aggregateRating?.ratingValue?.toString()),
          ratingCountText:
            extractField("Ratings") ||
            safeText(app?.aggregateRating?.ratingCount?.toString()) ||
            safeText(app?.aggregateRating?.reviewCount?.toString()),
          lastUpdated: extractField("Updated") || extractField("Last updated"),
          size: extractField("Size"),
          developerName:
            safeText(app?.author?.name) ||
            firstText([
              '[data-testid="publisher-name"]',
              'a[href*="developer"]',
            ]),
          developerWebsite:
            firstAttr(['a[href*="website"]', 'a[href^="http"]'], "href") ||
            null,
          developerEmail:
            firstAttr(['a[href^="mailto:"]'], "href")?.replace("mailto:", "") ||
            null,
          privacyPolicyUrl:
            firstAttr(['a[href*="privacy"]', 'a[href*="policy"]'], "href") ||
            null,
          permissions: extractListAfterHeading("Permissions").slice(0, 25),
          supportedLanguages: extractListAfterHeading("Languages").slice(0, 20),
          icon:
            firstAttr(
              [
                'meta[property="og:image"]',
                'img[alt*="icon"]',
                'img[aria-label*="icon"]',
              ],
              "content",
            ) ||
            firstAttr(['img[alt*="icon"]', 'img[aria-label*="icon"]'], "src") ||
            null,
          screenshotUrls: collectScreenshots(imageUrls).slice(0, 12),
          imageUrls,
          reviews,
          competitors,
        };
      },
      { reviewsLimit, competitorsLimit },
    );

    const screenshots = await attachDimensions(scraped.screenshotUrls);
    const allImageAssets = await attachDimensions(
      scraped.imageUrls.slice(0, 40),
    );

    const findPromo = (targetW: number, targetH: number): string | null => {
      const match = allImageAssets.find(
        (asset) => asset.width === targetW && asset.height === targetH,
      );
      return match?.url ?? null;
    };

    const extension: ExtensionData = {
      name: scraped.name,
      id: extensionId,
      version: scraped.version,
      description: scraped.description,
      shortDescription: scraped.shortDescription,
      category: scraped.category,
      installs: scraped.installs,
      rating: parseDecimal(scraped.ratingText),
      ratingCount: parseCount(scraped.ratingCountText),
      lastUpdated: scraped.lastUpdated,
      size: scraped.size,
      developer: {
        name: scraped.developerName,
        website: scraped.developerWebsite,
        email: scraped.developerEmail,
      },
      permissions: scraped.permissions,
      supportedLanguages: scraped.supportedLanguages,
      privacyPolicyUrl: scraped.privacyPolicyUrl,
      screenshots,
      icon: scraped.icon,
      promoTiles: {
        small: findPromo(440, 280),
        large: findPromo(920, 680),
        marquee: findPromo(1400, 560),
      },
    };

    const reviews: ReviewData[] = scraped.reviews.slice(0, reviewsLimit);

    const competitors: CompetitorData[] = scraped.competitors
      .slice(0, competitorsLimit)
      .map((competitor) => ({
        ...competitor,
        screenshotCount: null,
        descriptionLength: null,
        lastUpdated: null,
      }));

    return {
      extension,
      reviews,
      competitors,
    };
  } finally {
    await browser.close();
  }
}
