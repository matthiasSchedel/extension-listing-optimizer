# Prompt 07: Build Image Audit Module

Implement an "Image Audit" page with detailed creative diagnostics.

## Goal

Move beyond a simple screenshot gallery to objective communication and quality scoring for listing visuals.

## Required UI

- Intro card: "Objective feedback on your images".
- Overview panel:
  - overall image score (out of 5)
  - sub-metrics (Design Quality, Message Clarity, Perceived Value, Message Strength)
- Horizontal image strip/carousel with selectable assets.
- "Recommended fixes" panel with prioritized actions.
- "Why you got this score" narrative panel.

## Required logic

Add screenshot audit derivation pipeline:

- measure text-overlay presence/readability heuristic (if possible)
- visual diversity and narrative sequencing heuristic
- alignment with top conversion drivers and blockers
- detect missing story frames (benefit proof, trust proof, comparison, CTA)

If CV analysis is limited, implement deterministic heuristics from metadata and suggestion strategy first, with clear TODO extension points.

## Feature quality requirements

- Per-image diagnostics and global diagnostics must be consistent.
- Recommendations must reference specific image indices/assets.
- Include confidence label per recommendation.

## Acceptance criteria

- Works even when only 1-2 screenshots exist.
- Graceful fallback when image metadata is partial.
- Tests for scoring fallbacks and recommendation generation.
