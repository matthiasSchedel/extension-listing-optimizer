import { describe, expect, it } from 'vitest';

import { modulePath, parseRoute } from '@/routing/routes';

describe('route parsing', () => {
  it('parses product and module routes', () => {
    expect(parseRoute('/products')).toEqual({ type: 'products' });
    expect(parseRoute('/legacy')).toEqual({ type: 'legacy' });
    expect(parseRoute('/products/abc/review-insights')).toEqual({
      type: 'module',
      extensionId: 'abc',
      module: 'review-insights',
    });
  });

  it('creates deep links for module pages', () => {
    expect(modulePath('a b', 'conversion-driver')).toBe('/products/a%20b/conversion-driver');
  });

  it('returns not-found for unsupported paths', () => {
    expect(parseRoute('/products/abc/unknown')).toEqual({ type: 'not-found' });
    expect(parseRoute('/missing')).toEqual({ type: 'not-found' });
  });
});
