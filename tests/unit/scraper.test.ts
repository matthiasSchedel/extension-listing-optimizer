// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  extractExtensionId,
  validateChromeWebStoreUrl
} from '../../server/scraper/chromeStore';

describe('scraper url utilities', () => {
  it('parses valid Chrome Web Store URLs', () => {
    const result = validateChromeWebStoreUrl(
      'https://chromewebstore.google.com/detail/name/abcdefghijklmnopqrstuvwxzyabcdef'
    );
    expect(result.valid).toBe(true);
  });

  it('rejects non chrome web store hosts', () => {
    const result = validateChromeWebStoreUrl('https://example.com/detail/abc');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Chrome Web Store/);
  });

  it('extracts extension id with or without slug', () => {
    expect(
      extractExtensionId(
        'https://chromewebstore.google.com/detail/extension-name/abcdefghijklmnopqrstuvwxzyabcdef'
      )
    ).toBe('abcdefghijklmnopqrstuvwxzyabcdef');

    expect(
      extractExtensionId(
        'https://chromewebstore.google.com/detail/abcdefghijklmnopqrstuvwxzyabcdef'
      )
    ).toBe('abcdefghijklmnopqrstuvwxzyabcdef');
  });

  it('extracts id from query style urls', () => {
    expect(
      extractExtensionId(
        'https://chrome.google.com/webstore/detail/something?id=abcdefghijklmnopqrstuvwxzyabcdef'
      )
    ).toBe('abcdefghijklmnopqrstuvwxzyabcdef');
  });

  it('returns null for malformed ids', () => {
    expect(extractExtensionId('https://chromewebstore.google.com/detail/app/notanid')).toBeNull();
  });
});
