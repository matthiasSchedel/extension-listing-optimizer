import type { AnalyzeResponse } from '@/types';

export function buildAnalyzeResponseFixture(overrides?: Partial<AnalyzeResponse>): AnalyzeResponse {
  const base: AnalyzeResponse = {
    extension: {
      name: 'Optimizer Demo',
      id: 'cccccccccccccccccccccccccccccccc',
      version: '1.0.2',
      description:
        'Optimize workflows with automation, reliable sync, and faster reporting across your browser tasks.',
      shortDescription:
        'Automation extension with fast setup, reliable sync, and visible productivity outcomes.',
      category: 'Productivity',
      installs: '50,000+',
      rating: 4.2,
      ratingCount: 1280,
      lastUpdated: '2026-01-10',
      size: '2MB',
      developer: {
        name: 'Optimizer Inc',
        website: 'https://example.com',
        email: 'support@example.com',
      },
      permissions: ['storage', 'activeTab'],
      supportedLanguages: ['English'],
      privacyPolicyUrl: 'https://example.com/privacy',
      screenshots: [
        { url: 'https://picsum.photos/640/400?1', width: 640, height: 400 },
        { url: 'https://picsum.photos/640/400?2', width: 640, height: 400 },
        { url: 'https://picsum.photos/640/400?3', width: 640, height: 400 },
      ],
      icon: 'https://picsum.photos/100/100',
      promoTiles: { small: null, large: null, marquee: null },
    },
    reviews: [
      {
        author: 'Alice',
        rating: 5,
        text: 'Fast setup and excellent automation. Saves time every day.',
        date: '2026-01-01',
        developerReply: null,
      },
      {
        author: 'Ben',
        rating: 4,
        text: 'Great workflow and productivity boost, but sync can lag sometimes.',
        date: '2026-01-02',
        developerReply: null,
      },
      {
        author: 'Cara',
        rating: 2,
        text: 'Sync bug still appears and support response is slow.',
        date: '2026-01-03',
        developerReply: 'Working on it',
      },
      {
        author: 'Dan',
        rating: 5,
        text: 'Reliable and easy interface. Automation outcomes are clear.',
        date: '2026-01-04',
        developerReply: null,
      },
      {
        author: 'Ema',
        rating: 3,
        text: 'Useful value, but integration with other tools is missing.',
        date: '2026-01-05',
        developerReply: null,
      },
      {
        author: 'Finn',
        rating: 1,
        text: 'Crashes often. Performance is slow and confusing.',
        date: '2026-01-06',
        developerReply: null,
      },
    ],
    competitors: [],
    scores: {
      overall: 71,
      grade: 'B',
      completeness: { score: 74, issues: [] },
      seo: { score: 65, issues: [] },
      socialProof: { score: 73, issues: [] },
      trust: { score: 68, issues: [] },
    },
    suggestions: {
      title: 'Optimize workflows in seconds',
      shortDescription:
        'Automate repetitive tasks, improve reliability, and deliver measurable time savings directly in Chrome.',
      fullDescription: 'Detailed long description',
      keywords: ['automation', 'productivity', 'workflow', 'chrome extension', 'sync'],
      screenshotStrategy: [
        {
          title: 'Fast setup',
          description: 'Show onboarding sequence',
          overlayText: 'Start in under 60 seconds',
        },
        {
          title: 'Automation flow',
          description: 'Show repeat task execution',
          overlayText: 'Automate repetitive work',
        },
      ],
      topImprovements: [
        {
          title: 'Fix sync stability',
          priority: 'high',
          userImpact: 'Higher retention',
          evidence: 'Negative sync reviews',
        },
      ],
      competitiveInsights: ['Competitors emphasize reliability proof.'],
    },
  };

  return {
    ...base,
    ...overrides,
    extension: {
      ...base.extension,
      ...overrides?.extension,
    },
    scores: {
      ...base.scores,
      ...overrides?.scores,
      completeness: {
        ...base.scores.completeness,
        ...overrides?.scores?.completeness,
      },
      seo: {
        ...base.scores.seo,
        ...overrides?.scores?.seo,
      },
      socialProof: {
        ...base.scores.socialProof,
        ...overrides?.scores?.socialProof,
      },
      trust: {
        ...base.scores.trust,
        ...overrides?.scores?.trust,
      },
    },
    suggestions: {
      ...base.suggestions,
      ...overrides?.suggestions,
    },
  };
}
