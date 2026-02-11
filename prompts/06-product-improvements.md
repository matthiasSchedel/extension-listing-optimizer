# Prompt 06: Build Product Improvements Module

Implement a "Product Improvements" page in the new layout.

## Goal

Convert weaknesses and complaints into prioritized, practical improvement recommendations.

## Required UI

- Intro card: "How to build a better product".
- Prioritized improvements table with columns:
  - Rank
  - Impact (dot scale)
  - Difficulty
  - Improvement recommendation
  - Linked weakness
  - Row action
- Export action.

## Required logic

Derive `productImprovements` with fields:

- `recommendation`
- `impact` (1-5)
- `difficulty` (`Low|Medium|High`)
- `linkedWeaknessId`
- `expectedOutcome`
- `supportingEvidenceIds`

Ranking formula should combine:
- weakness severity
- evidence count
- estimated effort
- potential conversion uplift

## Feature quality requirements

- Recommendations must be implementation-specific, not generic.
- Each recommendation must map to a concrete weakness.
- Include explanatory rationale for ranking.

## Acceptance criteria

- Table is sortable and stable.
- Edge case: if no clear weaknesses, show optimization opportunities instead.
- Unit tests for prioritization logic.
