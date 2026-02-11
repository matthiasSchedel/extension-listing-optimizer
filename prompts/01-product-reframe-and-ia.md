# Prompt 01: Product Reframe + Information Architecture

You are editing the repo in-place.

Goal: transform the app from a single results page into a workspace product that matches the second screenshot set's structure and depth.

## Desired UX direction

Rebuild around this model:

- Workspace shell with left navigation.
- Product context hero at top of detail pages.
- Dedicated module pages:
  - Review Insights
  - Conversion Driver
  - Strengths & Weaknesses
  - Product Improvements
  - Image Audit
  - Conversion Blockers
- Dense, readable data tables and score cards.

This should feel analytical, premium, and operational, not "toy dashboard".

## What to implement

1. Introduce page-level routing (React Router) with at least:
   - `/products`
   - `/products/:extensionId/review-insights`
   - `/products/:extensionId/conversion-driver`
   - `/products/:extensionId/strengths-weaknesses`
   - `/products/:extensionId/product-improvements`
   - `/products/:extensionId/image-audit`
   - `/products/:extensionId/conversion-blockers`
2. Keep URL analysis input accessible from product list view and/or top action area.
3. Preserve existing analyze flow and response shape as baseline.
4. Create a shared typed client-side view model that maps `AnalyzeResponse` into module-specific views.
5. Keep legacy tab components available behind a temporary compatibility route until migration is complete.

## Data/architecture constraints

- Do not break `POST /api/analyze` consumers.
- Do not remove existing score dimensions (`completeness`, `seo`, `socialProof`, `trust`).
- Add new derived metrics as additive fields (client-derived first, server later where needed).

## Deliverables

- New route structure and app shell wiring.
- Product list page with cards/rows for analyzed extensions.
- Product detail layout scaffold with left rail section navigation.
- Migration notes in code comments or `README.md` section.

## Acceptance criteria

- Deep-linking between module pages works.
- Reloading a module route preserves context (or restores from cache/store).
- Existing analyze request still works and populates the new workspace.
- No TypeScript errors.

## Execution expectations

- Make concrete edits.
- Add/update tests for routing and state persistence logic.
- Provide a concise change summary with file references.
