import { Router } from 'express';
import { z } from 'zod';

import { aggregateScores } from '../analysis/scorer';
import { buildAnalyzeResponse, generateSuggestions } from '../ai/suggestions';
import {
  extractExtensionId,
  scrapeChromeStoreListing,
  validateChromeWebStoreUrl
} from '../scraper/chromeStore';
import type { AnalyzeResponse } from '../types';

const requestSchema = z.object({
  url: z.string().min(1)
});

const ONE_MINUTE = 60_000;
const ONE_HOUR = 60 * ONE_MINUTE;

const rateLimitState = new Map<string, number[]>();
const responseCache = new Map<
  string,
  {
    expiresAt: number;
    response: AnalyzeResponse;
  }
>();

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitState.get(ip) || []).filter(
    (time) => now - time < ONE_MINUTE
  );

  if (timestamps.length >= 10) {
    rateLimitState.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  rateLimitState.set(ip, timestamps);
  return true;
}

function getFromCache(cacheKey: string): AnalyzeResponse | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.response;
}

function setInCache(cacheKey: string, response: AnalyzeResponse): void {
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + ONE_HOUR,
    response
  });
}

async function runAnalyze(url: string): Promise<AnalyzeResponse> {
  const extensionId = extractExtensionId(url);
  const cacheKey = extensionId ? `extension:${extensionId}` : `url:${url}`;

  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const scraped = await withTimeout(
    scrapeChromeStoreListing(url, { timeoutMs: 30_000 }),
    30_000,
    'Scraping request timed out.'
  );

  const scores = aggregateScores(scraped);
  const suggestions = await withTimeout(
    generateSuggestions({ scraped, scores }),
    60_000,
    'Suggestion generation timed out.'
  );

  const response = buildAnalyzeResponse(scraped, scores, suggestions);
  setInCache(cacheKey, response);
  return response;
}

export const analyzeRouter = Router();

analyzeRouter.post('/scrape', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Request body must include a URL.' });
  }

  const validation = validateChromeWebStoreUrl(parsed.data.url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const scraped = await withTimeout(
      scrapeChromeStoreListing(parsed.data.url, { timeoutMs: 30_000 }),
      30_000,
      'Scraping request timed out.'
    );

    return res.status(200).json(scraped);
  } catch (error: any) {
    if (String(error?.message).toLowerCase().includes('timed out')) {
      return res.status(504).json({ error: 'Scraping timed out.' });
    }

    return res
      .status(500)
      .json({ error: error?.message || 'Failed to scrape listing.' });
  }
});

analyzeRouter.post('/analyze', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Request body must include a URL.' });
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  const validation = validateChromeWebStoreUrl(parsed.data.url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const response = await withTimeout(
      runAnalyze(parsed.data.url),
      90_000,
      'Full analysis timed out.'
    );

    return res.status(200).json(response);
  } catch (error: any) {
    const message = String(error?.message || 'Unknown error');
    if (message.toLowerCase().includes('timed out')) {
      return res.status(504).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
});
