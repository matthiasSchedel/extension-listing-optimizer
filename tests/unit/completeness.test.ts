// @vitest-environment node
import { describe, expect, it } from 'vitest';

import minimalFixture from '../fixtures/minimalListing.json';
import perfectFixture from '../fixtures/perfectListing.json';
import { scoreCompleteness } from '../../server/analysis/completeness';

describe('scoreCompleteness', () => {
  it('scores perfect listing at 100', () => {
    const result = scoreCompleteness(perfectFixture.extension);
    expect(result.score).toBe(100);
  });

  it('scores minimal listing below 30', () => {
    const result = scoreCompleteness(minimalFixture.extension);
    expect(result.score).toBeLessThan(30);
  });

  it('handles description length thresholds', () => {
    const base = structuredClone(perfectFixture.extension);

    base.description = 'x'.repeat(251);
    expect(scoreCompleteness(base).score).toBeLessThan(100);

    base.description = 'x'.repeat(1200);
    expect(scoreCompleteness(base).score).toBeGreaterThan(90);
  });

  it('handles screenshot count thresholds', () => {
    const base = structuredClone(perfectFixture.extension);

    base.screenshots = base.screenshots.slice(0, 2);
    expect(scoreCompleteness(base).issues.some((issue) => issue.id === 'screenshots-minimum')).toBe(true);

    base.screenshots = perfectFixture.extension.screenshots;
    expect(scoreCompleteness(base).issues.some((issue) => issue.id === 'screenshots-minimum')).toBe(false);
  });

  it('flags missing privacy policy', () => {
    const base = structuredClone(perfectFixture.extension);
    base.privacyPolicyUrl = null;

    const result = scoreCompleteness(base);
    expect(result.issues.some((issue) => issue.id === 'privacy-policy')).toBe(true);
  });
});
