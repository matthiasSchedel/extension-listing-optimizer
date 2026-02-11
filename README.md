# Chrome Listing Optimizer

Chrome Listing Optimizer is a route-based analytics workspace for Chrome Web Store listings. It keeps the existing `POST /api/analyze` API flow and layers a premium, module-driven UI with explainable insights, confidence scoring, evidence traceability, and export-ready outputs.

## What Changed

- Migrated from a single tabbed results page to a workspace model.
- Added product-level routing and deep-linkable module pages.
- Added shared derived-analysis utilities (`src/analysis/`) used by all modules.
- Added confidence semantics and evidence drill-in across module tables.
- Added CSV/JSON exports with metadata (`extensionId`, `generatedAt`).
- Kept a compatibility route for legacy tabs at `/legacy`.

## Core Features

- Analyze one Chrome Web Store URL via `POST /api/analyze`.
- Keep existing score dimensions intact:
  - Completeness
  - SEO & Discovery
  - Social Proof
  - Trust & Safety
- Weighted overall score + grade.
- AI suggestions via Anthropic Claude with fallback behavior when key is missing.
- Review scrape pipeline (target up to 200 reviews when available).
- In-memory API protections:
  - 10 requests/minute/IP rate limit
  - 1-hour response cache by extension ID
- Workspace modules:
  - Review Insights
  - Conversion Driver
  - Strengths & Weaknesses
  - Product Improvements
  - Image Audit
  - Conversion Blockers

## Workspace Routes

- `/products`
- `/products/:extensionId/review-insights`
- `/products/:extensionId/conversion-driver`
- `/products/:extensionId/strengths-weaknesses`
- `/products/:extensionId/product-improvements`
- `/products/:extensionId/image-audit`
- `/products/:extensionId/conversion-blockers`
- `/legacy` (temporary compatibility view)

## Architecture Notes

- `POST /api/analyze` response shape is unchanged to avoid breaking existing consumers.
- New analytics fields are additive and client-derived in `src/analysis/viewModel.ts`.
- Shared confidence framework: `src/analysis/confidence.ts`.
- Shared evidence mapping + drill-in drawer used across modules.
- Product context is persisted in local storage under:
  - `chrome-listing-optimizer.workspace.v2`
- UI design system primitives live in:
  - `src/components/ui/`
- Tokenized style system lives in:
  - `src/styles/globals.css`

## Project Structure

- `src/`: frontend app, workspace shell, routes, modules, UI primitives, derived analytics.
- `server/`: backend API, scraping, scoring, AI integration.
- `tests/`: unit/integration/app tests and Playwright e2e specs.
- `prompts/`: transformation spec prompts used for implementation.

## Environment Variables

Create `.env` in project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
NODE_ENV=development
REVIEW_SCRAPE_DEBUG=0
# optional, defaults to logs/review-scrape
# REVIEW_SCRAPE_DEBUG_DIR=logs/review-scrape
```

Notes:
- Without `ANTHROPIC_API_KEY`, API still returns fallback suggestions.
- Set `REVIEW_SCRAPE_DEBUG=1` to persist scrape debug artifacts.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Vite proxy forwards `/api/*` to backend.

## Build

```bash
npm run build
```

Outputs:
- Frontend: `dist/`
- Backend JS: `dist/server/`

## Start (Production-style)

```bash
npm run start
```

## API

### Health

- `GET /api/health`

### Analyze

- `POST /api/analyze`
- Request body:

```json
{ "url": "https://chromewebstore.google.com/detail/<slug>/<extension-id>" }
```

- Response includes:
  - `extension`
  - `reviews` (up to 200 if available)
  - `competitors` (currently `[]`)
  - `scores`
  - `suggestions`

### Scrape-only

- `POST /api/scrape`
- Same request body as analyze.
- Returns scraped data without scoring/suggestions orchestration.

## Testing

Run unit/integration/app tests:

```bash
npm test
```

Run Playwright e2e:

```bash
npm run test:e2e
```

Run type checks:

```bash
npm run typecheck
```

## Review Scrape Debug Logs

When enabled (`REVIEW_SCRAPE_DEBUG=1`), backend emits structured logs and JSON artifacts:
- progress events
- matched review network response metadata
- capped raw response payloads

Example log lines:
- `[review-scrape] reviews-tab {...}`
- `[review-scrape] scroll-progress {...}`
- `[review-scrape] result {...}`
- `[review-scrape] debug-file {"path":"..."}`
- `[analyze] scrape-complete {...}`
- `[analyze] response-ready {...}`

## Current Scope Notes

- Competitor extraction remains intentionally disabled.
- `competitors` is returned as an empty array.

## Troubleshooting

- If `/api/analyze` returns few/no reviews:
  - inspect `[review-scrape]` logs
  - confirm listing has public reviews
  - compare with another listing
- If AI suggestions are generic:
  - verify `ANTHROPIC_API_KEY`
- If frontend cannot hit API:
  - confirm backend is running on `3000`
  - confirm Vite proxy is active
