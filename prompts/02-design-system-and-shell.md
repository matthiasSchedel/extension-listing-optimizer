# Prompt 02: Design System + Shell (Scalable-Style)

You are editing this repo to match the second screenshot set's visual language.

Goal: establish a production-quality design system and application shell that feels like a serious SaaS analytics workspace.

## Visual style requirements

- Overall look: quiet grayscale base, high contrast text, restrained accent colors.
- Surface language: soft radius, subtle borders, minimal shadows, clean spacing rhythm.
- Typography: confident, compact hierarchy; avoid default-looking stacks.
- Tables/cards should feel information-dense but still breathable.
- Buttons and pills should follow consistent semantic states.

## Build these primitives

Create reusable components under `src/components/ui/`:

- `AppShell`
- `SidebarNav`
- `TopActionBar`
- `ProductHero`
- `SectionIntroCard` (eyebrow + icon + heading + supporting text)
- `KpiCard`
- `MetricBar`
- `DataTable`
- `Badge` / `Pill`
- `ScoreDots` / `ConfidenceRing`
- `EmptyState`

## Token system

Move style constants into CSS variables (and Tailwind extension if needed):

- neutrals (`--bg`, `--surface`, `--border`, `--text`, `--muted`)
- semantic accents (`--good`, `--warn`, `--bad`, `--info`)
- spacing scale
- radius scale
- table row heights and header styles

Refactor existing pages/components to consume these tokens.

## UX details

- Sidebar grouping labels similar to the target (Understand Customer, Improve Product, Optimize Marketing).
- Top action bar with: back button, share toggle, destructive secondary action, external link CTA.
- Product hero with title, metadata, and right-aligned compact KPI stack.

## Accessibility requirements

- Keyboard focus states visible and consistent.
- Color contrast AA minimum for text and important controls.
- Table headers and row actions accessible with screen readers.

## Acceptance criteria

- New shell and primitives are reused by all module pages.
- Styling duplication is reduced materially.
- Desktop and mobile layouts are both usable.
- No visual regressions in core analyze flow.
