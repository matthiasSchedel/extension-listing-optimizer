import { describe, expect, it } from 'vitest';

import { buildConfidenceScore, confidenceScoreToDots } from '@/analysis/confidence';

describe('confidence framework', () => {
  it('returns low/medium/high levels based on weighted inputs', () => {
    const low = buildConfidenceScore({
      sampleSize: 3,
      sampleTarget: 40,
      consistency: 0.3,
      evidenceCoverage: 0.1,
      specificity: 0.4,
    });

    const medium = buildConfidenceScore({
      sampleSize: 18,
      sampleTarget: 40,
      consistency: 0.58,
      evidenceCoverage: 0.5,
      specificity: 0.7,
    });

    const high = buildConfidenceScore({
      sampleSize: 56,
      sampleTarget: 40,
      consistency: 0.9,
      evidenceCoverage: 0.85,
      specificity: 0.82,
    });

    expect(low.level).toBe('low');
    expect(medium.level).toBe('medium');
    expect(high.level).toBe('high');
    expect(low.score).toBeLessThan(medium.score);
    expect(medium.score).toBeLessThan(high.score);
  });

  it('maps confidence score to 1-5 dot scale', () => {
    expect(confidenceScoreToDots(10)).toBe(1);
    expect(confidenceScoreToDots(45)).toBe(2);
    expect(confidenceScoreToDots(56)).toBe(3);
    expect(confidenceScoreToDots(74)).toBe(4);
    expect(confidenceScoreToDots(95)).toBe(5);
  });
});
