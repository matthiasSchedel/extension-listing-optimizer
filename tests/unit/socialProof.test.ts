// @vitest-environment node
import { describe, expect, it } from 'vitest';

import minimalFixture from '../fixtures/minimalListing.json';
import perfectFixture from '../fixtures/perfectListing.json';
import { scoreSocialProof } from '../../server/analysis/socialProof';

describe('scoreSocialProof', () => {
  it('scores high rating and review volume positively', () => {
    const result = scoreSocialProof(perfectFixture.extension, perfectFixture.reviews);
    expect(result.score).toBeGreaterThan(70);
  });

  it('scores low rating poorly', () => {
    const result = scoreSocialProof(minimalFixture.extension, minimalFixture.reviews);
    expect(result.score).toBeLessThan(45);
  });

  it('handles no reviews', () => {
    const extension = structuredClone(perfectFixture.extension);
    extension.ratingCount = 0;
    const result = scoreSocialProof(extension, []);
    expect(result.issues.some((issue) => issue.id === 'reviews-empty')).toBe(true);
  });

  it('rewards developer replies', () => {
    const extension = structuredClone(perfectFixture.extension);
    const withReplies = scoreSocialProof(extension, perfectFixture.reviews);

    const withoutReplies = scoreSocialProof(
      extension,
      perfectFixture.reviews.map((review) => ({ ...review, developerReply: null }))
    );

    expect(withReplies.score).toBeGreaterThan(withoutReplies.score);
  });

  it('penalizes stale update dates', () => {
    const extension = structuredClone(perfectFixture.extension);
    extension.lastUpdated = '2020-01-01';
    const result = scoreSocialProof(extension, perfectFixture.reviews);
    expect(result.issues.some((issue) => issue.id === 'update-recency-stale')).toBe(true);
  });
});
