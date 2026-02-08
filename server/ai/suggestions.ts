import Anthropic from '@anthropic-ai/sdk';
import { setTimeout as sleep } from 'node:timers/promises';

import type {
  AnalyzeResponse,
  ImprovementItem,
  ScrapeResult,
  ScoreSummary,
  ScreenshotStrategyItem,
  Suggestions
} from '../types';

interface SuggestionContext {
  scraped: ScrapeResult;
  scores: ScoreSummary;
}

interface SuggestionEnvelope {
  title: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  screenshotStrategy: ScreenshotStrategyItem[];
  topImprovements: ImprovementItem[];
  competitiveInsights: string[];
}

const MODEL = 'claude-sonnet-4-5-20250929';

function truncate(text: string, max = 132): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max - 1).trimEnd() + '…';
}

function ensureShortDescriptionLength(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'Save time with a streamlined Chrome workflow that automates repetitive tasks, improves focus, and keeps your browsing organized.';
  }

  if (trimmed.length === 132) {
    return trimmed;
  }

  if (trimmed.length > 132) {
    return truncate(trimmed, 132);
  }

  const padded = `${trimmed} Built for speed, privacy, and reliability.`;
  return truncate(padded, 132);
}

function fallbackSuggestions({ scraped, scores }: SuggestionContext): Suggestions {
  const extension = scraped.extension;

  const focusKeyword = extension.category || extension.name.split(' ')[0] || 'Chrome';
  const title = truncate(`${focusKeyword} Workflow Booster`, 45);

  const reviewQuotes = scraped.reviews
    .slice(0, 3)
    .map((review) => review.text)
    .filter(Boolean);

  const highestIssues = [
    ...scores.completeness.issues,
    ...scores.seo.issues,
    ...scores.socialProof.issues,
    ...scores.trust.issues
  ]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  const topImprovements: ImprovementItem[] = highestIssues.map((item, index) => ({
    title: item.title,
    priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
    userImpact: item.fix,
    evidence: reviewQuotes[index] ?? item.description
  }));

  const screenshotStrategy: ScreenshotStrategyItem[] = [
    {
      title: 'Core Workflow',
      description: 'Show the extension solving the primary problem in one glance.',
      overlayText: 'Solve the main task in seconds'
    },
    {
      title: 'Before vs After',
      description: 'Visualize measurable improvement after enabling the extension.',
      overlayText: 'From manual steps to one click'
    },
    {
      title: 'Trust Signals',
      description: 'Highlight privacy settings, support contact, and reliability proof.',
      overlayText: 'Private by design, supported by real humans'
    },
    {
      title: 'Power Features',
      description: 'Demonstrate advanced functionality for serious users.',
      overlayText: 'Advanced controls when you need them'
    },
    {
      title: 'Social Proof',
      description: 'Include ratings/review highlights or customer outcomes.',
      overlayText: 'Loved by teams and power users'
    }
  ];

  return {
    title,
    shortDescription: ensureShortDescriptionLength(
      `Boost productivity with ${extension.name}, a smarter way to work inside Chrome every day with less friction and more consistent outcomes.`
    ),
    fullDescription: [
      `## Why ${extension.name}`,
      extension.shortDescription ||
        'This extension streamlines your work by reducing repetitive effort and improving consistency.',
      '',
      '## Key Benefits',
      '- Faster completion of repetitive tasks',
      '- Cleaner, more predictable browsing workflow',
      '- Lower cognitive load for daily operations',
      '',
      '## Ideal For',
      `- ${extension.category || 'Productivity'} users who need reliability`,
      '- Teams that want standardized browser workflows',
      '- Individuals optimizing focus and speed',
      '',
      '## What Makes It Different',
      'Purpose-built UX, clear defaults, and practical automation designed for everyday use.'
    ].join('\n'),
    keywords: [
      focusKeyword.toLowerCase(),
      'chrome extension',
      'productivity',
      'workflow automation',
      'browser optimization'
    ],
    screenshotStrategy,
    topImprovements,
    competitiveInsights: [
      'Emphasize differentiation in the first sentence of your short description.',
      'Increase screenshot narrative depth to outperform generic competitor galleries.',
      'Highlight trust signals (privacy + support) earlier to improve conversion.'
    ]
  };
}

function tryParseJson(raw: string): SuggestionEnvelope | null {
  const trimmed = raw.trim();
  const direct = (() => {
    try {
      return JSON.parse(trimmed) as SuggestionEnvelope;
    } catch {
      return null;
    }
  })();

  if (direct) {
    return direct;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as SuggestionEnvelope;
  } catch {
    return null;
  }
}

async function callClaude(
  client: Anthropic,
  context: SuggestionContext,
  timeoutMs = 60_000
): Promise<Suggestions> {
  const prompt = [
    'You are an expert ASO specialist for Chrome Web Store listings.',
    'Return ONLY JSON matching this schema:',
    '{"title": string<=45 chars, "shortDescription": string exactly 132 chars, "fullDescription": string, "keywords": string[5], "screenshotStrategy": [{"title": string, "description": string, "overlayText": string}], "topImprovements": [{"title": string, "priority": "high"|"medium"|"low", "userImpact": string, "evidence": string}], "competitiveInsights": string[]}',
    '',
    '<listing_data>',
    JSON.stringify(context.scraped),
    '</listing_data>',
    '',
    '<analysis>',
    JSON.stringify(context.scores),
    '</analysis>'
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 3000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      },
      { signal: controller.signal }
    );

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    const parsed = tryParseJson(text);
    if (!parsed) {
      throw new Error('Could not parse Claude response JSON.');
    }

    return {
      ...parsed,
      title: truncate(parsed.title.trim(), 45),
      shortDescription: ensureShortDescriptionLength(parsed.shortDescription),
      keywords: parsed.keywords.slice(0, 5),
      screenshotStrategy: parsed.screenshotStrategy.slice(0, 8),
      topImprovements: parsed.topImprovements.slice(0, 5),
      competitiveInsights: parsed.competitiveInsights.slice(0, 6)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateSuggestions(
  context: SuggestionContext
): Promise<Suggestions> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackSuggestions(context);
  }

  const client = new Anthropic({ apiKey });

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await callClaude(client, context, 60_000);
    } catch (error: any) {
      lastError = error;
      const status = error?.status;
      const isRateLimit = status === 429 || String(error?.message).includes('429');

      if (isRateLimit && attempt < 2) {
        await sleep(500 * 2 ** attempt);
        continue;
      }

      break;
    }
  }

  console.warn('Falling back to heuristic suggestions', lastError);
  return fallbackSuggestions(context);
}

export function buildAnalyzeResponse(
  scraped: ScrapeResult,
  scores: ScoreSummary,
  suggestions: Suggestions
): AnalyzeResponse {
  return {
    extension: scraped.extension,
    reviews: scraped.reviews,
    competitors: scraped.competitors,
    scores,
    suggestions
  };
}
