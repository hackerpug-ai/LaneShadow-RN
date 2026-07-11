---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# UI Infrastructure

## Target surface (verified in code)

`app/(app)/curated-route/[id].tsx` (`CuratedRouteDetailScreen` / internal
`PolylineGuardedBody`) — a **full-screen pushed stack route** (SubpageLayout; fixed
`flex: 0.4` map above a `flex: 0.6` ScrollView body). NOT a bottom sheet. Section order
today: Map → Header → Summary → Scores → Conditions → Actions.

**Enrichment placement:** new section **between Summary and Scores** — narrative flow:
name → blurb → the grounded "why" (flagship) → the quantified scores that back it → the
rest. High in the scroll body; typically at least the label + first lines land above the
fold on a 390×844pt viewport.

## New component — `EnrichmentSection`

`components/ui/enrichment-section.tsx`, mirroring `ScoreDimensionBarSection`'s architecture
precedent exactly: **pure presentational**, props in (`state: 'enriched' | 'absent'`,
`why?`, `generatedAt?`), JSX out — no Convex hooks inside `components/ui/` primitives.
Data arrives via the existing detail hook (`use-curated-route-detail.ts`) from the extended
`getCuratedRouteDetail` (single-query join → shares the existing `isLoading` gate; **no
separate enrichment spinner**).

## Content spec (v1 = paragraph only)

- **Section label** "Why ride it": `semantic.type.label.sm`, uppercase,
  `letterSpacing: 0.5`, `fontWeight: '600'`, `semantic.color.onSurface.subtle` — the
  `sectionLabel` idiom borrowed from `route-details-sheet.tsx` (first use on this screen;
  deliberate, to give R1's flagship content an anchor). **Renders in ALL states.**
- **Paragraph**: `semantic.type.body.md`, color `semantic.color.onSurface.default` (one
  step STRONGER than Summary's `onSurface.subtle` — intentional hierarchy). One flowing
  `Text` node; the lead-sentence rule is a generation-time constraint, not a UI split.
- **Length budget** (at ~358pt content width, ~48–55 chars/line): lead sentence ≤100 chars;
  target 180–260 chars; hard cap 320 (~6 lines). UI defends with `numberOfLines={6}` +
  `onTextLayout`-measured "Read more" (`Button variant='link' size='sm'` + **required
  `hitSlop`** — the 36pt link is below the 44pt `semantic.control.minTouchTarget`).
  At target length, Read-more never appears.
- **Provenance caption** (enriched state only): `semantic.type.label.sm` /
  `onSurface.muted`, non-interactive — "Generated from route & terrain data".
- **Deferred seams (v1.1, fully specced, not built):** characterTags as `Badge
  variant='outline'` wrap-row (0–4 tags ≤16 chars; NOT `Chip` — it's a Pressable with a
  sub-44pt target); "Best for" line ≤80 chars; generated headline treatment.

## States

| State | Render |
|---|---|
| `enriched` | Label + paragraph + provenance caption |
| absent (not-generated / abstained / failed / fetch-error — collapsed) | Label + *"No write-up yet"* — italic `body.md`, `onSurface.subtle`: the screen's established honest-absence idiom (3rd use) |
| **Combined absence** (summary ALSO missing) | Suppress the Summary section's empty line; show a single absence line in the enrichment slot only — two stacked near-identical italics read as broken |
| stale | Renders as `enriched` (last QA-passed text) — **no rider-facing staleness UI in v1** |

Contrast note: the body is opaque `background.default` (NOT glass) — `onSurface.default`/
`onSurface.subtle` pairings as used by Summary/Conditions today.

## testIDs (repo convention: `curated-detail-{section}[-{leaf}]`)

| testID | Node |
|---|---|
| `curated-detail-enrichment` | Section root (always rendered) |
| `curated-detail-enrichment-label` | "Why ride it" label |
| `curated-detail-enrichment-paragraph` | Why text (enriched) |
| `curated-detail-enrichment-empty` | Honest-absence line |
| `curated-detail-enrichment-read-more` | Read-more button (only when truncated) |
| `curated-detail-enrichment-provenance` | Provenance caption |

## Accessibility

- Dynamic type: no `allowFontScaling` override (screen default). Larger fonts trigger
  Read-more earlier — expected; do NOT clamp scaling to avoid it.
- Screen-reader order: label → paragraph → provenance (document order; parity with the
  other five sections).
- Touch targets: Read-more requires `hitSlop` to reach ≥44pt effective.

## Cross-doc updates on implementation

The MVP TR constitution (`prds/mvp/09-technical-requirements/09-routing.md` route map +
`10-design-system.md` section inventory) gains the enrichment states/section when this
ships — recorded here so the constitution doesn't silently drift.

## Layout risks (named)

- Scroll distance to Save/Ride-It grows ~90–110pt on every enriched route —
  actions-scroll-with-content is the established pattern; acceptable, named.
- Whole-screen loading today is a centered ActivityIndicator, not a skeleton — a
  pre-existing F-leg gap (FOUNDER-BAR Feel). When the F-leg skeleton lands, it must
  reserve a placeholder block for this section so enrichment causes no layout jump.
