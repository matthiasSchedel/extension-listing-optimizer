# Prompt 09: Quality Hardening, Explainability, and Product Polish

You now have the new workspace modules. This prompt is for world-class quality.

## Goal

Raise feature quality, consistency, and trustworthiness so outputs are decision-grade.

## Implement hardening across the system

1. Evidence traceability
- Every insight row in every module should reference source review IDs/snippets.
- Add reusable evidence drawer/modal component.

2. Confidence framework
- Add shared confidence scoring utility used by all derived modules.
- Surface confidence badges and explain what drives each score.

3. Cross-module consistency
- Ensure the same underlying clusters power Review Insights, Strengths/Weaknesses, Product Improvements, and Conversion Blockers.
- Eliminate contradictory statements between pages.

4. Export/report quality
- Standardize CSV/JSON export schemas per module.
- Include timestamp, extension ID, and confidence metadata in exports.

5. Performance and reliability
- Memoize expensive client transforms.
- Avoid repeated recomputation across routes.
- Add loading/skeleton states tuned to perceived responsiveness.

6. QA + tests
- Add unit tests for shared confidence and evidence linking.
- Add at least one integration/e2e flow that traverses product list -> detail -> two module pages.

## Acceptance criteria

- No TypeScript errors, no failing tests.
- Derived insights are explainable and auditable.
- UI feels coherent across all module pages.
- Low-data edge cases are explicit and graceful.

## Final output requirements

Provide:

- concise summary of architecture changes
- list of new/modified files
- known limitations and next-step opportunities
