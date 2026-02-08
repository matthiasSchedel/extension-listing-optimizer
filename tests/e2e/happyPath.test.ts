import { expect, test } from '@playwright/test';

const mockResponse = {
  extension: {
    name: 'Demo Extension',
    id: 'cccccccccccccccccccccccccccccccc',
    version: '1.0.0',
    description: 'A long form description with sections.\n- one\n- two\n- three',
    shortDescription: 'A short description that is specifically crafted to be around one hundred and thirty two characters for testing output formatting!',
    category: 'Productivity',
    installs: '10,000+',
    rating: 4.2,
    ratingCount: 1234,
    lastUpdated: '2026-01-01',
    size: '2MB',
    developer: {
      name: 'Dev Co',
      website: 'https://example.com',
      email: 'dev@example.com'
    },
    permissions: ['storage', 'activeTab'],
    supportedLanguages: ['English'],
    privacyPolicyUrl: 'https://example.com/privacy',
    screenshots: [{ url: 'https://picsum.photos/640/400', width: 640, height: 400 }],
    icon: 'https://picsum.photos/100/100',
    promoTiles: { small: null, large: null, marquee: null }
  },
  reviews: [
    {
      author: 'User',
      rating: 5,
      text: 'Great extension',
      date: '2026-01-01',
      developerReply: 'Thanks'
    }
  ],
  competitors: [
    {
      name: 'Comp One',
      url: 'https://chromewebstore.google.com/detail/comp/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      rating: 4.5,
      installs: '50,000+',
      ratingCount: 500,
      screenshotCount: 3,
      descriptionLength: 700,
      lastUpdated: '2025-12-12'
    }
  ],
  scores: {
    overall: 72,
    grade: 'B',
    completeness: { score: 75, issues: [] },
    seo: { score: 62, issues: [] },
    socialProof: { score: 78, issues: [] },
    trust: { score: 64, issues: [] }
  },
  suggestions: {
    title: 'Improved Extension Title',
    shortDescription: 'Optimized short description with strong value proposition and keyword focus for better search visibility in listings now!',
    fullDescription: 'Long optimized copy',
    keywords: ['productivity', 'automation', 'workflow', 'chrome extension', 'focus'],
    screenshotStrategy: [
      {
        title: 'Core flow',
        description: 'Show main flow',
        overlayText: 'Get results quickly'
      }
    ],
    topImprovements: [
      {
        title: 'Improve onboarding',
        priority: 'high',
        userImpact: 'Higher activation',
        evidence: 'Users mention confusion'
      }
    ],
    competitiveInsights: ['Competitors emphasize speed.']
  }
};

test('happy path renders dashboard and tabs', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.route('**/api/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  await page.goto('/');

  await expect(page.getByLabel('Chrome Web Store URL')).toBeVisible();

  await page.getByLabel('Chrome Web Store URL').fill(
    'https://chromewebstore.google.com/detail/demo/cccccccccccccccccccccccccccccccc'
  );

  await page.getByRole('button', { name: 'Analyze' }).click();

  await expect(page.getByText('Running analysis')).toBeVisible();
  await expect(page.getByText('Overall Score')).toBeVisible();
  await expect(page.getByText('72/100 B')).toBeVisible();

  await page.getByRole('button', { name: 'AI Suggestions' }).click();
  await expect(page.getByText('Top 5 Improvements')).toBeVisible();

  await page.getByRole('button', { name: 'Copy' }).click();

  await page.getByRole('button', { name: 'Screenshots' }).click();
  await expect(page.getByText('Recommended Screenshot Strategy')).toBeVisible();

  await page.getByRole('button', { name: 'Reviews' }).click();
  await expect(page.getByText('Sentiment Breakdown')).toBeVisible();

  await page.getByRole('button', { name: 'Competitors' }).click();
  await expect(page.getByText('Comp One')).toBeVisible();
});
