# Chrome Listing Optimizer

Chrome Listing Optimizer is a single-page app that analyzes a Chrome Web Store extension listing and returns a scored optimization report with AI suggestions.

## Features

- Analyze a Chrome Web Store URL with a single request (`POST /api/analyze`)
- Listing quality scoring across 4 dimensions:
  - Completeness
  - SEO & Discovery
  - Social Proof
  - Trust & Safety
- Overall weighted score + grade
- AI-generated optimization suggestions (Claude) with fallback if API key is not set
- Review scraping pipeline targeting up to 200 reviews (if available):
  - Opens the reviews section
  - Scrolls to load more
  - Parses review network responses
  - Falls back to DOM parsing
  - Deduplicates and returns first 200
- In-memory protections:
  - Rate limiting (10 requests/minute/IP)
  - 1-hour response cache by extension ID
- Frontend dashboard tabs:
  - Issues
  - AI Suggestions
  - Copy
  - Screenshots
  - Reviews

## Current Scope Notes

- Competitor extraction is currently disabled intentionally.
- `competitors` is returned as an empty array for now.

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Express + TypeScript
- Scraping: Puppeteer
- AI: Anthropic Claude API
- Tests: Vitest + Playwright

## Project Structure

- `src/`: frontend app
- `server/`: backend API, scraping, scoring, AI integration
- `tests/`: unit/integration/e2e tests

## Environment Variables

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
NODE_ENV=development
REVIEW_SCRAPE_DEBUG=0
# optional, defaults to logs/review-scrape
# REVIEW_SCRAPE_DEBUG_DIR=logs/review-scrape
```

Notes:
- If `ANTHROPIC_API_KEY` is missing, the app still works and returns fallback suggestions.
- Set `REVIEW_SCRAPE_DEBUG=1` to persist raw review scraping debug artifacts to disk.

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

This starts:
- Vite frontend on `http://localhost:5173`
- Express API on `http://localhost:3000`
- Vite proxy forwards `/api/*` to backend

## Build

```bash
npm run build
```

Outputs:
- Frontend build in `dist/`
- Backend JS in `dist/server/`

## Start (Production-style)

```bash
npm run start
```

## API

### Health

- `GET /api/health`

### Analyze

- `POST /api/analyze`
- Body:

```json
{ "url": "https://chromewebstore.google.com/detail/<slug>/<extension-id>" }
```

Returns:
- `extension`
- `reviews` (up to 200 if available)
- `competitors` (currently `[]`)
- `scores`
- `suggestions`

### Scrape-only

- `POST /api/scrape`
- Same request body as analyze
- Returns scraped data without full score+suggestion orchestration

## Review Scrape Debug Logs

The backend prints structured logs during scrape/analyze.  
If `REVIEW_SCRAPE_DEBUG=1`, it also writes a JSON debug artifact that includes:
- progress events
- matched network review response metadata
- raw response bodies (capped per payload size/count)

Examples:
- `[review-scrape] reviews-tab {...}`
- `[review-scrape] scroll-progress {...}`
- `[review-scrape] result {...}`
- `[review-scrape] debug-file {"path":"..."}`
- `[analyze] scrape-complete {...}`
- `[analyze] response-ready {...}`

This helps validate whether reviews are being loaded from network, DOM fallback, and final output counts.

## Testing

Run all unit/integration tests:

```bash
npm test
```

Run Playwright e2e:

```bash
npm run test:e2e
```

## Docker

Build image:

```bash
docker build -t chrome-listing-optimizer .
```

Run container:

```bash
docker run --rm -p 3000:3000 --env PORT=3000 --env NODE_ENV=production --env ANTHROPIC_API_KEY=sk-ant-... chrome-listing-optimizer
```

## Troubleshooting

- If `/api/analyze` returns few/no reviews:
  - Check backend logs for `[review-scrape]` entries.
  - Confirm the listing has publicly visible reviews.
  - Try another extension listing to compare behavior.
- If AI suggestions are generic:
  - Verify `ANTHROPIC_API_KEY` is set and valid.
- If frontend cannot hit API:
  - Ensure backend is running on port `3000` and Vite proxy is active.

## Test Sect