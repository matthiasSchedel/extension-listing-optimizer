# Prompt 05: Build Strengths & Weaknesses Module

Implement a "Strengths & Weaknesses" page matching the target style and analytical depth.

## Goal

Provide a concise market-fit view and ranked strengths/weaknesses derived from customer evidence.

## Required UI

- Intro card: "What customers love/dislike".
- Market fit score panel (numeric score + bar + narrative summary).
- Table with columns:
  - Rank
  - Reviews
  - Product insight
  - Sentiment ratio (positive vs negative)
  - Classification (`Primary Strength`, `Weakness`, etc.)
  - Data points
  - Row drill-in

## Required logic

Derive a `marketFitScore` and row-level insights from review clusters:

- score formula should include confidence weighting (sample size and variance)
- classify each insight by sentiment ratio thresholds + confidence
- generate short narratives for top strengths and top weakness

## Quality requirements

- Do not overstate confidence when evidence is sparse.
- Keep sentiment ratio transparent and reproducible.
- Store source review references for each row.

## Acceptance criteria

- Strong visual parity with target table/card patterns.
- Recomputed values update correctly when review data changes.
- Tests for score calculation and classification thresholds.
