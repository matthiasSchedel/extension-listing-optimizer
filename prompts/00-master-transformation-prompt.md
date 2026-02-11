# Prompt 00: Master Transformation Prompt (End-to-End)

You are editing this repository directly to transform Chrome Listing Optimizer into a premium, Scalable-style analytics workspace.

## Context

Current state:

- Single-page app with tabs (`Issues`, `AI Suggestions`, `Copy`, `Screenshots`, `Reviews`)
- `POST /api/analyze` returns `AnalyzeResponse`
- Existing dimensions: completeness, seo, socialProof, trust

Target state (based on second screenshot set):

- Workspace shell with left sidebar groups and top action bar
- Product hero with metadata and compact KPI stack
- Dedicated module pages:
  - Review Insights
  - Conversion Driver
  - Strengths & Weaknesses
  - Product Improvements
  - Image Audit
  - Conversion Blockers
- Dense tables, confidence semantics, evidence traceability, export quality

## Implementation phases

1. Re-architecture
- Add route-driven IA for products list + product detail modules.
- Keep current analyze endpoint and core flow intact.

2. Design system
- Build reusable UI primitives and tokenized style system.
- Match visual language from target screenshots: refined grayscale, subtle borders, compact premium typography, restrained accents.

3. Module buildout
- Implement each module page with meaningful derived data and drill-in evidence.
- Ensure all modules share consistent underlying review clustering/insight model.

4. Feature quality hardening
- Add confidence scoring framework, evidence drawers, exports, and edge-case handling.
- Add tests for derived logic and critical route flows.

## Quality constraints

- No fake precision: clearly indicate low confidence.
- No generic recommendations: every major recommendation links to evidence.
- No one-off styles: use shared primitives.
- Responsive behavior required.

## Required deliverables

- Fully wired route-based workspace
- New pages/components for all six modules
- Shared derived-analysis utilities
- Tests for scoring, ranking, dedup, and route-level rendering
- Short migration notes in `README.md`

## Done means

- TypeScript clean
- tests pass
- analyze flow works
- module pages render real data
- outputs are explainable with evidence

Use the detailed prompts in `prompts/01-...` through `prompts/09-...` as sub-specs while implementing.
