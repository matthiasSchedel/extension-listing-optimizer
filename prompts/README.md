# Codex Prompt Pack: Chrome Listing Optimizer -> Scalable-Style Workspace

Use these prompts in order. Each prompt is written so you can paste it directly into Codex.

## Why this pack exists

The current app is a single-page tab interface (`Issues`, `AI Suggestions`, `Copy`, `Screenshots`, `Reviews`).
The target direction from the second screenshot set is a product workspace with:

- left rail navigation
- top action bar and product hero
- section-level pages with rich cards and dense data tables
- stronger scoring explainability, confidence, and evidence traceability

## Prompt sequence

1. `01-product-reframe-and-ia.md`
2. `02-design-system-and-shell.md`
3. `03-review-insights.md`
4. `04-conversion-driver.md`
5. `05-strengths-weaknesses.md`
6. `06-product-improvements.md`
7. `07-image-audit.md`
8. `08-conversion-blockers.md`
9. `09-quality-hardening-and-polish.md`

## Repo context to include in every run

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Express + TypeScript
- Existing API: `POST /api/analyze`, `POST /api/scrape`
- Existing key files:
  - `src/App.tsx`
  - `src/components/ScoreCard.tsx`
  - `src/components/IssuesTab.tsx`
  - `src/components/SuggestionsTab.tsx`
  - `src/components/CopyTab.tsx`
  - `src/components/ScreenshotTab.tsx`
  - `src/components/ReviewsTab.tsx`
  - `server/routes/analyze.ts`
  - `server/analysis/*`
  - `server/ai/suggestions.ts`

## Non-negotiables for Codex

- Keep existing endpoints working while introducing the new UI architecture.
- Preserve existing scoring dimensions and add new derived dimensions rather than replacing blindly.
- Ship responsive desktop + mobile behavior.
- Use a restrained grayscale + muted-accent aesthetic inspired by the second screenshot set.
- Favor reusable primitives over one-off page CSS.
- Add tests for newly introduced analysis logic and critical UI rendering paths.
