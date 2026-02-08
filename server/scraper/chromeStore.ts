import fs from "node:fs/promises";
import path from "node:path";
import puppeteer, { type HTTPResponse, type Page } from "puppeteer";

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
  reviewDebug?: boolean;
  reviewDebugDir?: string;
}

const DEFAULT_REVIEWS_LIMIT = 200;
const MAX_REVIEWS_LIMIT = 200;

interface ReviewDebugState {
  enabled: boolean;
  outputPath: string;
  events: Array<Record<string, unknown>>;
  networkPayloads: Array<Record<string, unknown>>;
}

function createReviewDebugState(
  enabled: boolean,
  extensionId: string,
  outputDir = "logs/review-scrape",
): ReviewDebugState {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${timestamp}-${extensionId}.json`;
  return {
    enabled,
    outputPath: path.join(process.cwd(), outputDir, fileName),
    events: [],
    networkPayloads: [],
  };
}

async function flushReviewDebug(state: ReviewDebugState): Promise<void> {
  if (!state.enabled) {
    return;
  }

  const payload = {
    writtenAt: new Date().toISOString(),
    events: state.events,
    networkPayloads: state.networkPayloads,
  };

  const dir = path.dirname(state.outputPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    state.outputPath,
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log(
    `[review-scrape] debug-file ${JSON.stringify({
      path: state.outputPath,
      events: state.events.length,
      payloads: state.networkPayloads.length,
    })}`,
  );
}

function debugReviewScrape(
  phase: string,
  payload: Record<string, unknown>,
  state?: ReviewDebugState,
): void {
  const event = {
    at: new Date().toISOString(),
    phase,
    ...payload,
  };
  if (state?.enabled) {
    state.events.push(event);
  }
  console.log(`[review-scrape] ${phase} ${JSON.stringify(payload)}`);
}

function buildReviewsUrl(listingUrl: string): string {
  const url = new URL(listingUrl);
  const pathname = url.pathname.replace(/\/+$/, "");
  if (!pathname.endsWith("/reviews")) {
    url.pathname = `${pathname}/reviews`;
  }
  return url.toString();
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

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function installBrowserContextShims(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    const globalScope = globalThis as Record<string, unknown>;
    if (typeof globalScope.__name !== "function") {
      globalScope.__name = (target: unknown) => target;
    }
  });
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function reviewKey(review: ReviewData): string {
  return `${review.author.toLowerCase()}|${normalizeWhitespace(review.text).toLowerCase()}`.slice(
    0,
    512,
  );
}

function dedupeReviews(reviews: ReviewData[]): ReviewData[] {
  const map = new Map<string, ReviewData>();
  for (const review of reviews) {
    if (!review.text || review.text.trim().length < 3) {
      continue;
    }
    const normalized: ReviewData = {
      author: review.author?.trim() || "Anonymous",
      rating: review.rating,
      text: normalizeWhitespace(review.text),
      date: review.date?.trim() || null,
      developerReply: review.developerReply?.trim() || null,
    };
    map.set(reviewKey(normalized), normalized);
  }
  return [...map.values()];
}

function parseNumericRating(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 1 && value <= 5) {
      return value;
    }
    return null;
  }

  if (typeof value === "string") {
    const match = value.match(/([1-5](?:\.[0-9])?)/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return parsed >= 1 && parsed <= 5 ? parsed : null;
  }

  return null;
}

function parseUnixTimestampDate(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const seconds = value[0];
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return null;
  }
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function isLikelyReviewText(value: string): boolean {
  const normalized = normalizeWhitespace(value);
  if (normalized.length < 8 || normalized.length > 5000) {
    return false;
  }
  if (/^https?:\/\/\S+$/i.test(normalized)) {
    return false;
  }
  return /[a-z]/i.test(normalized);
}

function parseGoogleDeveloperReply(value: unknown): string | null {
  if (!Array.isArray(value) || value.length < 3) {
    return null;
  }
  const replyText = value[2];
  if (typeof replyText !== "string" || !isLikelyReviewText(replyText)) {
    return null;
  }
  return normalizeWhitespace(replyText);
}

// Chrome Web Store review tuple shape from AF_initDataCallback ds:1 payloads:
// [id, [author, avatar], rating, text, createdAt, updatedAt, helpful, total, developerReply, ...]
function normalizeReviewTuple(tuple: unknown[]): ReviewData | null {
  if (tuple.length < 4) {
    return null;
  }

  const reviewId = tuple[0];
  const authorBlock = tuple[1];
  const rating = parseNumericRating(tuple[2]);
  const textRaw = tuple[3];

  if (typeof reviewId !== "string" || reviewId.length < 8) {
    return null;
  }
  if (!Array.isArray(authorBlock) || typeof authorBlock[0] !== "string") {
    return null;
  }
  if (rating === null) {
    return null;
  }
  if (typeof textRaw !== "string" || !isLikelyReviewText(textRaw)) {
    return null;
  }

  const author = normalizeWhitespace(authorBlock[0]) || "Anonymous";
  const date =
    parseUnixTimestampDate(tuple[4]) ?? parseUnixTimestampDate(tuple[5]);
  const developerReply = parseGoogleDeveloperReply(tuple[8]);

  return {
    author,
    rating,
    text: normalizeWhitespace(textRaw),
    date,
    developerReply,
  };
}

function getStringFromRecord(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function getNestedString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const nested = getNestedString(record[key]);
      if (nested) {
        return nested;
      }
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = getNestedString(item);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function normalizeReviewRecord(
  record: Record<string, unknown>,
): ReviewData | null {
  const keyText = Object.keys(record).join(" ").toLowerCase();
  const looksLikeReviewObject =
    /review|rating|author|comment|reply|star|text/.test(keyText);
  if (!looksLikeReviewObject) {
    return null;
  }

  const rawText =
    getStringFromRecord(record, [
      "reviewText",
      "text",
      "comment",
      "content",
      "body",
      "message",
      "review",
      "snippet",
    ]) || getNestedString(record["review"]);

  if (!rawText || !isLikelyReviewText(rawText)) {
    return null;
  }

  const author =
    getStringFromRecord(record, [
      "author",
      "authorName",
      "reviewer",
      "userName",
      "displayName",
      "name",
    ]) ||
    getNestedString(record["author"]) ||
    "Anonymous";

  const date =
    getStringFromRecord(record, [
      "date",
      "updatedAt",
      "createdAt",
      "time",
      "timestamp",
    ]) || null;

  const developerReply =
    getStringFromRecord(record, [
      "developerReply",
      "reply",
      "response",
      "developerResponse",
    ]) ||
    getNestedString(record["developerReply"]) ||
    null;

  const rating =
    parseNumericRating(record["rating"]) ??
    parseNumericRating(record["starRating"]) ??
    parseNumericRating(record["score"]) ??
    parseNumericRating(record["stars"]);

  return {
    author,
    rating,
    text: normalizeWhitespace(rawText),
    date,
    developerReply,
  };
}

function extractReviewsFromUnknown(value: unknown): ReviewData[] {
  const collected: ReviewData[] = [];
  const seen = new WeakSet<object>();

  const visit = (node: unknown): void => {
    if (!node) {
      return;
    }

    if (typeof node === "string") {
      const trimmed = node.trim();
      if (
        trimmed.length > 2 &&
        trimmed.length < 2_000_000 &&
        (trimmed.startsWith("{") || trimmed.startsWith("["))
      ) {
        try {
          visit(JSON.parse(trimmed));
        } catch {
          // ignore strings that are not valid JSON
        }
      }
      return;
    }

    if (Array.isArray(node)) {
      const tupleReview = normalizeReviewTuple(node);
      if (tupleReview) {
        collected.push(tupleReview);
        // Review tuples include nested reply/metadata arrays; don't descend to avoid false positives.
        return;
      }
      for (const item of node) {
        visit(item);
      }
      return;
    }

    if (typeof node === "object") {
      const objectNode = node as Record<string, unknown>;
      if (seen.has(objectNode)) {
        return;
      }
      seen.add(objectNode);

      const normalized = normalizeReviewRecord(objectNode);
      if (normalized) {
        collected.push(normalized);
      }

      for (const child of Object.values(objectNode)) {
        visit(child);
      }
    }
  };

  visit(value);
  return dedupeReviews(collected);
}

function stripXssiPrefix(value: string): string {
  return value.replace(/^\)\]\}'\s*/, "");
}

function parseReviewsFromNetworkBody(body: string): ReviewData[] {
  const cleaned = stripXssiPrefix(body).trim();
  if (!cleaned) {
    return [];
  }

  const attempts: unknown[] = [];

  try {
    attempts.push(JSON.parse(cleaned));
  } catch {
    // ignore
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!(line.startsWith("{") || line.startsWith("["))) {
      continue;
    }
    try {
      attempts.push(JSON.parse(line));
    } catch {
      // ignore
    }
  }

  const reviews = attempts.flatMap((candidate) =>
    extractReviewsFromUnknown(candidate),
  );
  return dedupeReviews(reviews);
}

export const __internal = {
  parseReviewsFromNetworkBody,
};

function isReviewResponse(response: HTTPResponse): boolean {
  const url = response.url().toLowerCase();
  const headers = response.headers();
  const contentType = (headers["content-type"] || "").toLowerCase();

  if (/review|reviews/.test(url)) {
    return true;
  }

  if (
    /batchexecute|rpc|_/i.test(url) &&
    /json|text|javascript/.test(contentType)
  ) {
    return true;
  }

  return false;
}

async function openReviewsSection(page: Page): Promise<boolean> {
  const selectorCandidates = [
    "aria/Reviews",
    "aria/All reviews",
    "aria/Ratings",
    "aria/Rating",
  ];

  for (const selector of selectorCandidates) {
    const handle = await page.$(selector);
    if (handle) {
      await handle.click();
      await pause(700);
      return true;
    }
  }

  const clickedInPage = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('button, [role="tab"], a, div'),
    );

    for (const element of elements) {
      const label =
        `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`
          .toLowerCase()
          .trim();
      if (!label) {
        continue;
      }
      if (/review|rating/.test(label) && element.click) {
        element.click();
        return true;
      }
    }
    return false;
  });

  if (clickedInPage) {
    await pause(700);
  }

  return clickedInPage;
}

async function clickReviewExpansionActions(page: Page): Promise<number> {
  return page.evaluate(() => {
    const labels = [
      "show more",
      "more reviews",
      "load more",
      "read more",
      "expand",
      "next",
    ];
    let clicked = 0;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('button, a, [role="button"]'),
    );
    for (const element of elements) {
      const label =
        `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`
          .toLowerCase()
          .trim();
      if (!label) {
        continue;
      }
      if (!labels.some((token) => label.includes(token))) {
        continue;
      }
      element.click();
      clicked += 1;
    }
    return clicked;
  });
}

async function scrollReviewSurface(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const roots: Array<Document | ShadowRoot> = [document];
    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      const hosts = Array.from(root.querySelectorAll<HTMLElement>("*"));
      for (const host of hosts) {
        if (host.shadowRoot) {
          roots.push(host.shadowRoot);
        }
      }
    }

    const scrollable: HTMLElement[] = [];
    for (const root of roots) {
      for (const element of Array.from(
        root.querySelectorAll<HTMLElement>("*"),
      )) {
        if (element.scrollHeight > element.clientHeight + 120) {
          scrollable.push(element);
        }
      }
    }

    const targets = scrollable
      .sort((a, b) => {
        const aScore =
          a.scrollHeight -
          a.clientHeight +
          (/review|star|rating/i.test(a.innerText) ? 1 : 0) * 10_000;
        const bScore =
          b.scrollHeight -
          b.clientHeight +
          (/review|star|rating/i.test(b.innerText) ? 1 : 0) * 10_000;
        return bScore - aScore;
      })
      .slice(0, 6);

    let moved = false;
    for (const target of targets) {
      const previous = target.scrollTop;
      target.scrollTop += Math.max(target.clientHeight * 0.9, 420);
      if (target.scrollTop !== previous) {
        moved = true;
      }
    }

    const previousWindowY = window.scrollY;
    window.scrollBy(0, Math.max(window.innerHeight * 0.8, 600));
    if (window.scrollY !== previousWindowY) {
      moved = true;
    }

    return moved;
  });
}

async function extractReviewsFromDom(
  page: Page,
  maxReviews: number,
): Promise<ReviewData[]> {
  const extracted = await page.evaluate((limit) => {
    type BrowserReview = {
      author: string;
      rating: number | null;
      text: string;
      date: string | null;
      developerReply: string | null;
    };

    const safeText = (value: string | null | undefined): string | null => {
      if (!value) {
        return null;
      }
      const normalized = value.replace(/\s+/g, " ").trim();
      return normalized || null;
    };

    const normalizeRating = (
      value: string | null | undefined,
    ): number | null => {
      if (!value) {
        return null;
      }
      const match = value.match(/([1-5](?:\.[0-9])?)/);
      if (!match) {
        return null;
      }
      const parsed = Number(match[1]);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
        return null;
      }
      return parsed;
    };

    const roots: Array<Document | ShadowRoot> = [document];
    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      const hosts = Array.from(root.querySelectorAll<HTMLElement>("*"));
      for (const host of hosts) {
        if (host.shadowRoot) {
          roots.push(host.shadowRoot);
        }
      }
    }

    const seedSelectors = [
      "[data-review-id]",
      '[data-testid*="review"]',
      '[aria-label*="star"]',
      '[role="listitem"]',
      "article",
    ];

    const cardCandidates = new Set<HTMLElement>();
    for (const root of roots) {
      for (const selector of seedSelectors) {
        const seeds = Array.from(root.querySelectorAll<HTMLElement>(selector));
        for (const seed of seeds) {
          const card = seed.closest<HTMLElement>(
            '[data-review-id], [role="listitem"], article, div',
          );
          if (!card) {
            continue;
          }
          if ((card.textContent || "").trim().length < 30) {
            continue;
          }
          if (!/star|review|rating/i.test(card.textContent || card.innerHTML)) {
            continue;
          }
          cardCandidates.add(card);
        }
      }
    }

    const reviews: BrowserReview[] = [];
    for (const card of cardCandidates) {
      const textCandidates = Array.from(
        card.querySelectorAll<HTMLElement>(
          '[data-testid*="review"], [id*="review"], p, span, div',
        ),
      )
        .map((element) => safeText(element.textContent))
        .filter((text): text is string => Boolean(text))
        .filter((text) => text.length > 20)
        .sort((a, b) => b.length - a.length);

      const text = textCandidates[0];
      if (!text) {
        continue;
      }

      const author =
        safeText(
          card.querySelector(
            '[data-testid*="author"], [id*="author"], a[href*="profile"], h3, h4',
          )?.textContent,
        ) || "Anonymous";

      const date =
        safeText(
          card.querySelector('time, [data-testid*="date"], [id*="date"]')
            ?.textContent,
        ) ||
        safeText(
          card.textContent?.match(
            /(?:\b\d{4}-\d{2}-\d{2}\b|\b\w+\s+\d{1,2},\s+\d{4}\b|\b\d+\s+(?:day|week|month|year)s?\s+ago\b)/i,
          )?.[0],
        ) ||
        null;

      const rating =
        normalizeRating(
          card
            .querySelector(
              '[aria-label*="star"], [aria-label*="rating"], [role="img"]',
            )
            ?.getAttribute("aria-label"),
        ) ||
        normalizeRating(
          card.textContent?.match(/([1-5](?:\.[0-9])?)\s*(?:star|\/5)/i)?.[0],
        ) ||
        null;

      const developerReply =
        safeText(
          card.querySelector(
            '[data-testid*="reply"], [id*="reply"], .developer-reply',
          )?.textContent,
        ) || null;

      reviews.push({
        author,
        rating,
        text,
        date,
        developerReply,
      });
    }

    const deduped = new Map<string, BrowserReview>();
    for (const review of reviews) {
      const key =
        `${review.author.toLowerCase()}|${review.text.toLowerCase()}`.slice(
          0,
          512,
        );
      deduped.set(key, review);
    }

    return [...deduped.values()].slice(0, limit);
  }, maxReviews);

  return extracted.map((review) => ({
    author: review.author,
    rating: review.rating,
    text: review.text,
    date: review.date,
    developerReply: review.developerReply,
  }));
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
  const reviewsLimit = Math.max(
    1,
    Math.min(options.reviewsLimit ?? DEFAULT_REVIEWS_LIMIT, MAX_REVIEWS_LIMIT),
  );
  const competitorsLimit = options.competitorsLimit ?? 5;
  const extensionId = extractExtensionId(listingUrl);
  const reviewDebugState = createReviewDebugState(
    Boolean(options.reviewDebug ?? process.env.REVIEW_SCRAPE_DEBUG === "1"),
    extensionId ?? "unknown-extension",
    options.reviewDebugDir,
  );

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
    await installBrowserContextShims(page);

    await page.goto(listingUrl, {
      waitUntil: "networkidle2",
      timeout: timeoutMs,
    });
    await page.waitForSelector("body", {
      timeout: Math.min(timeoutMs, 10_000),
    });

    const networkReviewMap = new Map<string, ReviewData>();
    let networkReviewResponsesSeen = 0;
    let networkReviewPayloadsParsed = 0;
    const reviewPage = await browser.newPage();
    reviewPage.setDefaultNavigationTimeout(timeoutMs);
    reviewPage.setDefaultTimeout(timeoutMs);
    await installBrowserContextShims(reviewPage);

    const reviewsUrl = buildReviewsUrl(listingUrl);
    debugReviewScrape(
      "start",
      {
        listingUrl,
        reviewsUrl,
        requestedLimit: reviewsLimit,
      },
      reviewDebugState,
    );

    const mergeNetworkReviews = (items: ReviewData[]) => {
      for (const review of items) {
        networkReviewMap.set(reviewKey(review), review);
      }
    };

    const onResponse = async (response: HTTPResponse) => {
      if (!isReviewResponse(response)) {
        return;
      }
      networkReviewResponsesSeen += 1;
      try {
        const body = await response.text();
        if (!body) {
          return;
        }
        if (reviewDebugState.enabled) {
          const maxPayloads = 40;
          const maxBodySize = 300_000;
          reviewDebugState.networkPayloads.push({
            at: new Date().toISOString(),
            url: response.url(),
            status: response.status(),
            contentType: response.headers()["content-type"] || null,
            bodyLength: body.length,
            body: body.length > maxBodySize ? body.slice(0, maxBodySize) : body,
            bodyTruncated: body.length > maxBodySize,
          });
          if (reviewDebugState.networkPayloads.length > maxPayloads) {
            reviewDebugState.networkPayloads.shift();
          }
        }
        const parsed = parseReviewsFromNetworkBody(body);
        if (parsed.length > 0) {
          networkReviewPayloadsParsed += 1;
          mergeNetworkReviews(parsed);
        }
      } catch {
        // ignore per-response parse failures
      }
    };

    reviewPage.on("response", onResponse);
    await reviewPage.goto(reviewsUrl, {
      waitUntil: "networkidle2",
      timeout: timeoutMs,
    });
    await reviewPage.waitForSelector("body", {
      timeout: Math.min(timeoutMs, 10_000),
    });

    const openedReviews = await openReviewsSection(reviewPage);
    if (openedReviews) {
      await pause(500);
    }
    debugReviewScrape(
      "reviews-tab",
      {
        openedReviews,
        requestedLimit: reviewsLimit,
      },
      reviewDebugState,
    );

    const domReviewMap = new Map<string, ReviewData>();
    const mergeDomReviews = (items: ReviewData[]) => {
      for (const review of items) {
        domReviewMap.set(reviewKey(review), review);
      }
    };

    for (let iteration = 0; iteration < 80; iteration += 1) {
      if (iteration % 2 === 0 || iteration === 79) {
        const extracted = await extractReviewsFromDom(reviewPage, reviewsLimit);
        mergeDomReviews(extracted);
      }

      const combinedCount = dedupeReviews([
        ...networkReviewMap.values(),
        ...domReviewMap.values(),
      ]).length;
      if (combinedCount >= reviewsLimit) {
        break;
      }

      const expansions = await clickReviewExpansionActions(reviewPage);
      const moved = await scrollReviewSurface(reviewPage);
      await pause(moved ? 350 : 500);
      if (iteration % 10 === 0) {
        debugReviewScrape(
          "scroll-progress",
          {
            iteration,
            moved,
            expansions,
            networkReviews: networkReviewMap.size,
            domReviews: domReviewMap.size,
            combinedCount,
          },
          reviewDebugState,
        );
      }
      if (!moved && iteration > 10) {
        break;
      }
    }

    await pause(400);
    const finalDomReviews = await extractReviewsFromDom(
      reviewPage,
      reviewsLimit,
    );
    mergeDomReviews(finalDomReviews);

    reviewPage.off("response", onResponse);
    await reviewPage.close();

    const scraped = await page.evaluate(() => {
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

      const firstAttr = (selectors: string[], attr: string): string | null => {
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

      return {
        name:
          safeText(app?.name) ||
          firstText(["h1", "header h1", '[role="heading"][aria-level="1"]']) ||
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
          firstText(['[data-testid="publisher-name"]', 'a[href*="developer"]']),
        developerWebsite:
          firstAttr(['a[href*="website"]', 'a[href^="http"]'], "href") || null,
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
        competitors: [] as Array<{
          name: string;
          url: string;
          rating: number | null;
          installs: string | null;
          ratingCount: number | null;
        }>,
      };
    });

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

    const reviews = dedupeReviews([
      ...networkReviewMap.values(),
      ...domReviewMap.values(),
    ]).slice(0, reviewsLimit);
    debugReviewScrape(
      "result",
      {
        networkReviewResponsesSeen,
        networkReviewPayloadsParsed,
        networkReviews: networkReviewMap.size,
        domReviews: domReviewMap.size,
        finalReviews: reviews.length,
        competitorsDisabled: true,
        competitorsLimitRequested: competitorsLimit,
      },
      reviewDebugState,
    );

    const competitors: CompetitorData[] = [];

    return {
      extension,
      reviews,
      competitors,
    };
  } catch (error) {
    debugReviewScrape(
      "error",
      {
        message: error instanceof Error ? error.message : String(error),
      },
      reviewDebugState,
    );
    throw error;
  } finally {
    await flushReviewDebug(reviewDebugState);
    await browser.close();
  }
}
