# Codex Prompt: Chrome Extension Listing Optimizer MVP

## Project Overview

Build a **single-page web application** (no auth, no backend database) that analyzes Chrome Web Store extension listings and provides actionable optimization recommendations. The user pastes a Chrome Web Store URL, the app scrapes all listing data, runs rule-based analysis, and uses an LLM to generate improved copy and strategic suggestions.

Think of it like **PageSpeed Insights but for Chrome Extension listings** — paste a URL, get a score and prioritized fixes.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Node.js + Express API (single server)
- **Scraping**: Puppeteer (headless Chrome) for Chrome Web Store extraction
- **LLM**: Anthropic Claude API (claude-sonnet-4-5-20250929) for AI-powered suggestions
- **No database** — everything is computed on-the-fly per request
- **Deployment-ready**: Dockerfile included

## Core User Flow

1. User lands on single page with a URL input field
2. User pastes a Chrome Web Store extension URL (e.g., `https://chromewebstore.google.com/detail/extension-name/abcdef123456`)
3. App shows a loading state with progress indicators ("Scraping listing...", "Analyzing...", "Generating suggestions...")
4. App displays a comprehensive analysis dashboard with scores and recommendations

## Feature Specification

### 1. Data Extraction Module (`/api/scrape`)

Scrape the following from any Chrome Web Store listing URL:

**Metadata:**
- Extension name, short description, full description
- Category, version, last updated date, size
- Developer name, developer website URL, developer email (if visible)
- Total installs (parse "10,000+" format), rating (stars), number of ratings/reviews
- Required permissions list
- Supported languages

**Visual Assets:**
- All screenshot/promo image URLs (store the URLs, don't download)
- Icon URL (all sizes if available)
- Promo tile images (small, large, marquee if present)
- Count of screenshots, dimensions detection via image headers

**Reviews:**
- Scrape the most recent 30 reviews (text, rating, date, author)
- If fewer than 30 exist, scrape all available

**Competitor Context:**
- From the "Related" or "Similar" section on the listing page, extract the top 5 related extensions with their names, ratings, install counts, and URLs

### 2. Rule-Based Analysis Engine (`/api/analyze`)

Score the listing on a 0-100 scale across these dimensions:

**Listing Completeness Score (0-100):**
| Check | Points | Rule |
|-------|--------|------|
| Has description > 250 chars | 10 | Length check |
| Has description > 1000 chars | 10 | Longer = better discovery |
| Has 3+ screenshots | 15 | Google recommends 3-5 |
| Has 5+ screenshots | 10 | Bonus for full coverage |
| Screenshots are 1280x800 or 640x400 | 10 | Chrome Web Store recommended sizes |
| Has promo tile (small 440x280) | 10 | Required for featuring |
| Has promo tile (large 920x680) | 5 | Optional but recommended |
| Has marquee promo (1400x560) | 5 | For featured placement |
| Description uses formatting (newlines/bullets) | 5 | Readability |
| Has developer website | 5 | Trust signal |
| Has privacy policy URL | 10 | Required by Chrome policies |
| Minimal permissions requested | 5 | Fewer = higher trust |

**SEO & Discovery Score (0-100):**
- Keyword density in title (is the primary keyword in the first 3 words?)
- Keyword presence in short description (first 132 chars shown in search)
- Description keyword coverage (compare against category norms)
- Title length optimization (30-45 chars is ideal for display)
- Short description uses full 132 character allowance

**Social Proof Score (0-100):**
- Rating >= 4.5 stars
- Rating count relative to install count (engagement ratio)
- Recent review sentiment (positive/negative/neutral from last 10)
- Developer responsiveness (does developer reply to reviews?)
- Last update recency (within 3 months = good, 6+ months = warning)

**Trust & Safety Score (0-100):**
- Permission scope (fewer = better, flag broad permissions like `<all_urls>`)
- Has privacy policy
- Has developer contact info
- No concerning review patterns (spam reviews, fake reviews indicators)
- Update frequency signals active maintenance

**Overall Score:** Weighted average (Completeness 30%, SEO 25%, Social Proof 25%, Trust 20%)

### 3. AI-Powered Suggestions Module (`/api/suggest`)

Send the scraped data + rule-based analysis to Claude API with a structured prompt to generate:

**a) Improved Listing Copy:**
- Rewritten title (with SEO optimization, max 45 chars)
- Rewritten short description (exactly 132 chars, keyword-optimized)
- Rewritten full description (structured with features, benefits, use cases)
- 5 suggested keywords/phrases for the listing

**b) Screenshot Strategy:**
- Recommended number of screenshots based on category benchmarks
- Suggested content for each screenshot (what to show)
- Recommended text overlay suggestions for each screenshot
- Note on recommended dimensions (1280x800)

**c) Top 5 Improvements:**
- Based on review sentiment analysis, identify the top 5 feature requests or complaints
- For each, provide a priority (high/medium/low) and estimated user impact
- Include specific quotes from reviews as evidence

**d) Competitive Positioning:**
- How this extension's listing compares to the top 3 competitors
- Specific gaps in the listing vs. competitors
- Unique selling points to emphasize

### 4. Frontend Dashboard

**Layout:**
Single page, responsive, with these sections (scrollable):

```
┌─────────────────────────────────────────────────┐
│  [Logo] Chrome Listing Optimizer    [Dark mode]  │
├─────────────────────────────────────────────────┤
│  [  Paste Chrome Web Store URL here...  ] [GO]   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────┐  Extension Name v1.2.3             │
│  │  [icon]  │  ★★★★☆ 4.2 (1,234 ratings)       │
│  └──────────┘  10,000+ users | Category          │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Overall Score: 72/100  [████████░░] B      │ │
│  │                                               │ │
│  │  Completeness: 85  SEO: 62  Social: 78       │ │
│  │  Trust: 64                                    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [Tab: Issues] [Tab: AI Suggestions] [Tab: Copy] │
│  [Tab: Screenshots] [Tab: Reviews] [Tab: Comp.]  │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Tab content rendered here                    │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Tab: Issues (default)**
- Sorted by impact, each issue shows: severity badge (critical/warning/info), what's wrong, how to fix it, expected impact

**Tab: AI Suggestions**
- Improved title, description, keywords — each with a "Copy" button
- Screenshot strategy recommendations

**Tab: Reviews Intelligence**
- Sentiment breakdown (pie chart or bar)
- Top 5 feature requests from reviews
- Top 5 complaints
- Word cloud of common terms

**Tab: Competitor Comparison**
- Table comparing this extension vs. top 3 related extensions
- Columns: name, rating, installs, screenshot count, description length, last updated

## File Structure

```
chrome-listing-optimizer/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
├── .env.example          # ANTHROPIC_API_KEY=sk-...
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── UrlInput.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ScoreDimension.tsx
│   │   ├── IssuesTab.tsx
│   │   ├── SuggestionsTab.tsx
│   │   ├── ReviewsTab.tsx
│   │   ├── CompetitorTab.tsx
│   │   ├── ScreenshotTab.tsx
│   │   └── CopyButton.tsx
│   ├── types/
│   │   └── index.ts       # All TypeScript interfaces
│   ├── utils/
│   │   └── scoring.ts     # Client-side score display helpers
│   └── styles/
│       └── globals.css
├── server/
│   ├── index.ts           # Express server entry
│   ├── routes/
│   │   └── analyze.ts     # POST /api/analyze (orchestrates everything)
│   ├── scraper/
│   │   ├── chromeStore.ts # Puppeteer scraping logic
│   │   └── imageAnalyzer.ts # Screenshot dimension detection
│   ├── analysis/
│   │   ├── completeness.ts
│   │   ├── seo.ts
│   │   ├── socialProof.ts
│   │   ├── trust.ts
│   │   └── scorer.ts      # Aggregates all dimension scores
│   ├── ai/
│   │   └── suggestions.ts # Claude API integration
│   └── types/
│       └── index.ts
└── tests/
    ├── unit/
    │   ├── scraper.test.ts
    │   ├── completeness.test.ts
    │   ├── seo.test.ts
    │   ├── socialProof.test.ts
    │   ├── trust.test.ts
    │   ├── scorer.test.ts
    │   └── suggestions.test.ts
    ├── integration/
    │   ├── analyzeEndpoint.test.ts
    │   └── scrapeAndScore.test.ts
    ├── e2e/
    │   ├── happyPath.test.ts
    │   ├── invalidUrl.test.ts
    │   └── edgeCases.test.ts
    └── fixtures/
        ├── sampleListing.json        # Full scraped data for a real extension
        ├── minimalListing.json        # Extension with very little info
        ├── perfectListing.json        # Extension with everything filled out
        └── mockReviews.json           # Sample review data
```

## Testing Specification

### Unit Tests

**Scraper tests (`scraper.test.ts`):**
- Parses valid Chrome Web Store URL formats correctly
- Rejects invalid URLs (not chromewebstore.google.com)
- Extracts extension ID from URL
- Handles URL with and without trailing slug
- Mock: Test HTML parsing with fixture HTML snapshots

**Completeness scoring (`completeness.test.ts`):**
- Perfect listing fixture → 100 score
- Minimal listing fixture → low score (< 30)
- Each rule independently testable:
  - Description length thresholds (0, 250, 1000+ chars)
  - Screenshot count thresholds (0, 3, 5+)
  - Screenshot dimensions (correct vs incorrect)
  - Promo tile presence/absence
  - Privacy policy presence/absence

**SEO scoring (`seo.test.ts`):**
- Title with keyword in first 3 words → high score
- Title too long (>45 chars) → penalty
- Short description using full 132 chars → bonus
- Empty short description → zero
- Keywords present in description body

**Social proof scoring (`socialProof.test.ts`):**
- High rating + many reviews → high score
- Low rating → low score
- No reviews → minimum score
- Developer replies to reviews → bonus
- Stale extension (not updated in 6+ months) → penalty

**Trust scoring (`trust.test.ts`):**
- Minimal permissions → high score
- `<all_urls>` permission → penalty
- Has privacy policy → bonus
- Has developer contact → bonus

**Scorer aggregation (`scorer.test.ts`):**
- Weighted average calculation is correct
- All dimensions at 100 → overall 100
- All dimensions at 0 → overall 0
- Grade mapping: A (90-100), B (75-89), C (60-74), D (40-59), F (<40)

**AI suggestions (`suggestions.test.ts`):**
- Mock Claude API response
- Correctly formats prompt with scraped data
- Parses structured response into suggestion categories
- Handles API error gracefully (returns fallback message)
- Handles rate limiting (429) with retry logic

### Integration Tests

**Analyze endpoint (`analyzeEndpoint.test.ts`):**
- POST `/api/analyze` with valid URL → 200 with full analysis
- POST `/api/analyze` with invalid URL → 400 with error message
- POST `/api/analyze` with non-Chrome-Web-Store URL → 400
- POST `/api/analyze` with empty body → 400
- Response shape matches TypeScript interface
- Response includes all score dimensions
- Timeout handling (scraping takes too long → 504)

**Scrape + Score pipeline (`scrapeAndScore.test.ts`):**
- Using fixture data, verify end-to-end scoring pipeline
- Scraped data flows correctly through all analyzers
- Score boundaries are respected (never > 100, never < 0)

### E2E Tests (Playwright)

**Happy path (`happyPath.test.ts`):**
1. Page loads with URL input visible
2. Paste a known extension URL
3. Click analyze button
4. Loading state appears with progress indicators
5. Results dashboard renders with all sections
6. Overall score is visible with grade
7. All tabs are clickable and render content
8. Copy buttons work (clipboard API)
9. AI suggestions section populates

**Invalid URL (`invalidUrl.test.ts`):**
1. Submit empty URL → error message
2. Submit non-Chrome-Web-Store URL → specific error
3. Submit malformed URL → error message
4. Error states are dismissible

**Edge cases (`edgeCases.test.ts`):**
1. Extension with 0 reviews → reviews tab shows empty state
2. Extension with no screenshots → screenshot tab shows recommendation
3. Very long description → doesn't break layout
4. Rapid re-submissions → debounced, no duplicate requests
5. Network error during scrape → user-friendly error message
6. Dark mode toggle works correctly

## API Contract

### POST `/api/analyze`

**Request:**
```json
{
  "url": "https://chromewebstore.google.com/detail/extension-name/abcdef123456"
}
```

**Response:**
```json
{
  "extension": {
    "name": "Extension Name",
    "id": "abcdef123456",
    "version": "1.2.3",
    "description": "...",
    "shortDescription": "...",
    "category": "Productivity",
    "installs": "10,000+",
    "rating": 4.2,
    "ratingCount": 1234,
    "lastUpdated": "2025-01-15",
    "developer": {
      "name": "Dev Name",
      "website": "https://...",
      "email": "dev@example.com"
    },
    "permissions": ["storage", "activeTab"],
    "screenshots": [
      { "url": "https://...", "width": 1280, "height": 800 }
    ],
    "icon": "https://...",
    "promoTiles": {
      "small": "https://..." | null,
      "large": "https://..." | null,
      "marquee": "https://..." | null
    }
  },
  "reviews": [
    {
      "author": "User",
      "rating": 5,
      "text": "Great extension!",
      "date": "2025-01-10",
      "developerReply": "Thanks!" | null
    }
  ],
  "competitors": [
    {
      "name": "Competitor 1",
      "url": "https://...",
      "rating": 4.5,
      "installs": "50,000+",
      "ratingCount": 5000
    }
  ],
  "scores": {
    "overall": 72,
    "grade": "B",
    "completeness": { "score": 85, "issues": [...] },
    "seo": { "score": 62, "issues": [...] },
    "socialProof": { "score": 78, "issues": [...] },
    "trust": { "score": 64, "issues": [...] }
  },
  "suggestions": {
    "title": "Improved Title Here",
    "shortDescription": "Optimized 132-char description...",
    "fullDescription": "Rewritten full description...",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "screenshotStrategy": [...],
    "topImprovements": [...],
    "competitiveInsights": [...]
  }
}
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...       # Required for AI suggestions
PORT=3000                          # Server port (default 3000)
NODE_ENV=development               # development | production
```

## Important Implementation Notes

1. **Scraping resilience**: Chrome Web Store changes its DOM frequently. Use data attributes and structured data (JSON-LD) where possible. Fall back to meta tags. The scraper should have a graceful degradation strategy — if a field can't be extracted, return null rather than crashing.

2. **Rate limiting**: Add a simple in-memory rate limiter (e.g., 10 requests per minute per IP) to prevent abuse during validation.

3. **LLM prompt structure**: Send the Claude API a structured prompt with the scraped data as JSON in a `<listing_data>` XML tag and the scores in a `<analysis>` tag. Request the response in a specific JSON schema. Use `response_format` or parse carefully.

4. **Error boundaries**: Every async operation should have timeouts. Scraping: 30s max. LLM call: 60s max. Total request: 90s max.

5. **No persistent storage**: This is a stateless tool. Every analysis is computed fresh. Consider adding a simple response cache (in-memory, TTL 1 hour) keyed by extension ID to avoid re-scraping the same extension repeatedly.

6. **Accessibility**: All score visualizations must have text alternatives. Color-coding must not be the only indicator (use icons + text alongside colors).

## Acceptance Criteria

- [ ] User can paste any valid Chrome Web Store URL and receive a complete analysis within 30 seconds
- [ ] All 4 scoring dimensions produce scores between 0-100
- [ ] Overall score is a correctly weighted average
- [ ] AI suggestions are contextual and reference the actual extension data
- [ ] All tabs render without errors
- [ ] Copy buttons work for suggested text
- [ ] Invalid URLs show clear error messages
- [ ] Loading states are informative (not just a spinner)
- [ ] Mobile responsive (usable on phone)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E happy path passes
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] Lighthouse accessibility score >= 90
