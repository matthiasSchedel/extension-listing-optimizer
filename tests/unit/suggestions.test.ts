// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import sampleFixture from '../fixtures/sampleListing.json';
import { aggregateScores } from '../../server/analysis/scorer';

const createMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: createMock
      };
    }
  };
});

describe('generateSuggestions', () => {
  beforeEach(() => {
    vi.resetModules();
    createMock.mockReset();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('returns fallback suggestions when api key is missing', async () => {
    const { generateSuggestions } = await import('../../server/ai/suggestions');
    const scores = aggregateScores(sampleFixture);

    const result = await generateSuggestions({ scraped: sampleFixture, scores });
    expect(result.keywords.length).toBe(5);
    expect(result.shortDescription.length).toBeLessThanOrEqual(132);
  });

  it('parses structured claude response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test';
    createMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Better Title',
            shortDescription: 'a'.repeat(132),
            fullDescription: 'Long body',
            keywords: ['a', 'b', 'c', 'd', 'e'],
            screenshotStrategy: [
              { title: 'One', description: 'Desc', overlayText: 'Overlay' }
            ],
            topImprovements: [
              {
                title: 'Fix bugs',
                priority: 'high',
                userImpact: 'Higher retention',
                evidence: 'Users report crashes'
              }
            ],
            competitiveInsights: ['Differentiate opening message']
          })
        }
      ]
    });

    const { generateSuggestions } = await import('../../server/ai/suggestions');
    const scores = aggregateScores(sampleFixture);
    const result = await generateSuggestions({ scraped: sampleFixture, scores });

    expect(result.title).toBe('Better Title');
    expect(result.keywords).toHaveLength(5);
  });

  it('retries on 429 and falls back gracefully', async () => {
    process.env.ANTHROPIC_API_KEY = 'test';
    createMock.mockRejectedValue({ status: 429, message: 'rate limit' });

    const { generateSuggestions } = await import('../../server/ai/suggestions');
    const scores = aggregateScores(sampleFixture);
    const result = await generateSuggestions({ scraped: sampleFixture, scores });

    expect(createMock).toHaveBeenCalledTimes(3);
    expect(result.title.length).toBeGreaterThan(0);
  });
});
