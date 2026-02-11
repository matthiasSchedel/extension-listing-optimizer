# Prompt 04: Build Conversion Driver Module

Implement the "Conversion Driver" page inspired by the second screenshot set.

## Goal

Identify and rank the reasons users choose/install the extension, grounded in reviews and listing signals.

## Required UI

- Intro card: "What makes people buy".
- Conversion driver table with columns:
  - Rank
  - Relevance (dot scale)
  - Driver statement
  - Customer journey
  - Data points count
  - Drill-in action
- Export action in header.

## Required logic

Create `conversionDrivers` derived data with fields:

- `statement`
- `relevance` (1-5)
- `journeyStage`
- `supportingReviewIds`
- `dataPointCount`
- optional `counterSignals`

Derive from:
- positive/neutral reviews
- title/short description/value proposition alignment
- screenshot strategy hints

## Feature quality requirements

- Rank should combine frequency, sentiment strength, and textual specificity.
- Deduplicate semantically similar drivers.
- Attach drill-in evidence list per row.

## Acceptance criteria

- At least top 5 drivers when enough data exists.
- If insufficient data, show explicit uncertainty state (not fake precision).
- Unit tests for ranking and dedup behavior.
