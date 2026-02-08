// @vitest-environment node
import { describe, expect, it } from 'vitest';

import minimalFixture from '../fixtures/minimalListing.json';
import perfectFixture from '../fixtures/perfectListing.json';
import sampleFixture from '../fixtures/sampleListing.json';
import { aggregateScores } from '../../server/analysis/scorer';

describe('scrape + score pipeline', () => {
  it('processes fixture data through scorer', () => {
    const result = aggregateScores(sampleFixture);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('perfect fixture scores higher than minimal fixture', () => {
    const perfect = aggregateScores(perfectFixture);
    const minimal = aggregateScores(minimalFixture);

    expect(perfect.overall).toBeGreaterThan(minimal.overall);
  });

  it('enforces score boundaries for all dimensions', () => {
    const result = aggregateScores(sampleFixture);
    expect(result.completeness.score).toBeGreaterThanOrEqual(0);
    expect(result.completeness.score).toBeLessThanOrEqual(100);
    expect(result.seo.score).toBeGreaterThanOrEqual(0);
    expect(result.seo.score).toBeLessThanOrEqual(100);
    expect(result.socialProof.score).toBeGreaterThanOrEqual(0);
    expect(result.socialProof.score).toBeLessThanOrEqual(100);
    expect(result.trust.score).toBeGreaterThanOrEqual(0);
    expect(result.trust.score).toBeLessThanOrEqual(100);
  });
});
