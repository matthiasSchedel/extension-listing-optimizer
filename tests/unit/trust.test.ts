// @vitest-environment node
import { describe, expect, it } from 'vitest';

import minimalFixture from '../fixtures/minimalListing.json';
import perfectFixture from '../fixtures/perfectListing.json';
import { scoreTrust } from '../../server/analysis/trust';

describe('scoreTrust', () => {
  it('scores minimal permissions highly', () => {
    const result = scoreTrust(perfectFixture.extension, perfectFixture.reviews);
    expect(result.score).toBeGreaterThan(70);
  });

  it('penalizes <all_urls> permission', () => {
    const result = scoreTrust(minimalFixture.extension, minimalFixture.reviews);
    expect(result.issues.some((issue) => issue.id === 'permissions-broad')).toBe(true);
  });

  it('rewards privacy policy presence', () => {
    const withPolicy = scoreTrust(perfectFixture.extension, perfectFixture.reviews).score;

    const noPolicyExtension = structuredClone(perfectFixture.extension);
    noPolicyExtension.privacyPolicyUrl = null;

    const withoutPolicy = scoreTrust(noPolicyExtension, perfectFixture.reviews).score;
    expect(withPolicy).toBeGreaterThan(withoutPolicy);
  });

  it('rewards developer contact info', () => {
    const withContact = scoreTrust(perfectFixture.extension, perfectFixture.reviews).score;

    const noContact = structuredClone(perfectFixture.extension);
    noContact.developer.website = null;
    noContact.developer.email = null;

    const withoutContact = scoreTrust(noContact, perfectFixture.reviews).score;
    expect(withContact).toBeGreaterThan(withoutContact);
  });
});
