// @vitest-environment node
import { describe, expect, it } from 'vitest';

import sampleFixture from '../fixtures/sampleListing.json';
import { scoreSeo } from '../../server/analysis/seo';

describe('scoreSeo', () => {
  it('scores keyword in first 3 words positively', () => {
    const extension = structuredClone(sampleFixture.extension);
    extension.name = 'Research Assistant Pro';
    const result = scoreSeo(extension);
    expect(result.score).toBeGreaterThan(55);
  });

  it('penalizes overly long titles', () => {
    const extension = structuredClone(sampleFixture.extension);
    extension.name = 'This Is An Extremely Long Extension Title That Goes Well Beyond The Recommended Limit';
    const result = scoreSeo(extension);
    expect(result.issues.some((issue) => issue.id === 'title-length')).toBe(true);
  });

  it('rewards full short description usage', () => {
    const extension = structuredClone(sampleFixture.extension);
    extension.shortDescription = 'A'.repeat(132);
    const result = scoreSeo(extension);
    expect(result.score).toBeGreaterThan(50);
  });

  it('returns low score when short description is empty', () => {
    const extension = structuredClone(sampleFixture.extension);
    extension.shortDescription = '';
    const result = scoreSeo(extension);
    expect(result.issues.some((issue) => issue.id === 'short-description-empty')).toBe(true);
  });
});
