// @vitest-environment node
import { describe, expect, it } from 'vitest';

import minimalFixture from '../fixtures/minimalListing.json';
import perfectFixture from '../fixtures/perfectListing.json';
import { aggregateScores } from '../../server/analysis/scorer';

describe('aggregateScores', () => {
  it('calculates weighted averages correctly', () => {
    const score = aggregateScores(perfectFixture);

    const expected = Math.round(
      score.completeness.score * 0.3 +
        score.seo.score * 0.25 +
        score.socialProof.score * 0.25 +
        score.trust.score * 0.2
    );

    expect(score.overall).toBe(expected);
  });

  it('returns 100 when all dimensions are 100', () => {
    const result = aggregateScores(perfectFixture);
    expect(result.completeness.score).toBe(100);
  });

  it('returns bounded values', () => {
    const low = aggregateScores(minimalFixture);
    expect(low.overall).toBeGreaterThanOrEqual(0);
    expect(low.overall).toBeLessThanOrEqual(100);
  });

  it('maps grades correctly', () => {
    expect(aggregateScores(perfectFixture).grade).toBe('A');
    expect(aggregateScores(minimalFixture).grade).toBe('F');
  });
});
