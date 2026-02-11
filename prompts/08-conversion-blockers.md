# Prompt 08: Build Conversion Blockers Module

Implement a "Conversion Blockers" page that exposes what shoppers care about but cannot find in the listing.

## Goal

Identify communication gaps that suppress conversion and rank them by severity.

## Required UI

- Intro card: "What shoppers don't see, but care about".
- Conversion blockers table with columns:
  - Rank
  - Relevance (dot scale)
  - Blocker statement
  - Data points
  - Drill-in action
- Export action.

## Required logic

Derive blockers by comparing:

- recurring concerns in negative/neutral reviews
- claims present in title/description/screenshots
- trust signal availability (privacy policy, support, update cadence)

Each blocker must include:

- `statement`
- `relevance` (1-5)
- `supportingEvidenceIds`
- `suggestedFix`
- `estimatedLift` (low/med/high)

## Feature quality requirements

- Avoid duplicates and near-duplicates.
- Prefer concrete blockers over abstract labels.
- Make row drill-in show evidence snippets and linked listing fields.

## Acceptance criteria

- Produces meaningful blockers on noisy review sets.
- Zero-review scenario shows missing-data diagnostics rather than fake blockers.
- Includes unit tests for blocker extraction heuristics.
