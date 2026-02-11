# Prompt 03: Build Review Insights Page

Implement a full "Review Insights" module page in the new workspace style.

## Goal

Turn raw scraped reviews into a reliable, explainable insights model similar in depth to the second screenshot set.

## Required UI sections

1. Section intro card: "What matters to customers".
2. Confidence/coverage banner (e.g., analyzed reviews vs available estimate).
3. Three analytics cards:
   - Statistical significance / confidence
   - Processing flow summary (reviews -> aspects -> insights)
   - Sentiment summary donut/gauge
4. Customer insights table with columns:
   - Rank
   - Review count
   - Review aspects count
   - Customer insight statement
   - Sentiment
   - Customer journey stage
   - Data reliability

## Required backend/domain work

Add a dedicated review insight derivation layer (server-side preferred):

- aspect extraction and clustering
- insight statement synthesis
- review count by insight
- sentiment ratio per insight
- journey stage heuristic (`Pre-Purchase`, `Post-Purchase`, `Retention`)
- reliability score based on sample size + sentiment consistency

If time-boxed, ship deterministic heuristic implementation first, but structure for future model-based upgrades.

## Quality bar

- Every insight row must be traceable to source reviews.
- Reliability scoring method must be documented in code.
- Avoid keyword-only trivial outputs.

## Acceptance criteria

- Handles low-review edge cases gracefully.
- Produces stable outputs across repeated runs on same input.
- Includes tests for clustering/scoring heuristics.
- UI table supports sorting by reliability and review volume.
