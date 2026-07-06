# DESIGN-001: Build ScoreDimensionBar primitive in components/ui/ (labeled % bar, copper fill on inset track; composite "/100" headline above the five bars)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

A pure-display `ScoreDimensionBar` primitive + `CompositeScoreHeadline` renders five correctly-proportioned copper bars (e.g. scenic 0.74 → 74% fill) with labels and JetBrains-Mono percentages, topped by a composite "NN/100" headline — driven entirely by props sourced from getCuratedRouteDetail.

## Specification

Create `components/ui/score-dimension-bar.tsx` — a pure presentational primitive (props in, JSX out, NO Convex hooks, NO Map, NO navigation). Bar fill width = `Math.round(score*100)%` of an inset track. Includes a pure `scoreToPercent(score)` helper. NOTE: PRD UC-DTL-02 text mentions `components/discovery/`; resolved per roadmap to `components/ui/` (generic reusable primitive) — discrepancy recorded below.

## Critical Constraints

- MUST use semantic tokens only (copper-500 #EE7C2B fill, surface.inset track, semantic.radius.full pill, spacing.3 ≈ 8dp height, semantic.type.label.sm / title.lg).
- MUST derive fill from `Math.round(score*100)` — NEVER hard-code a percent.
- MUST gracefully omit the entire score section (render null) when all five dimension scores are null/undefined.
- NEVER call useQuery / Convex hooks inside this primitive (scores arrive as props).
- NEVER mock the Convex client in the PRIMARY integration test — seed via public_api with a real curated_routes row.

## Acceptance Criteria

### AC-1: renders five bars at correct widths + composite headline against a live Convex score row
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DTL-02/`
- **GIVEN** a live dev curated_routes row (compositeScore 0.85, scores {curvature:0.62, scenic:0.74, technical:0.55, traffic:0.30, remoteness:0.88})
- **WHEN** the section renders with the real getCuratedRouteDetail payload as props
- **THEN** headline text == '81/100'; scenic bar fill == 74% of track; remoteness == 75%; curvature == 60%; technical == 45%; traffic == 30%
- **Test tier:** `integration` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test react-native/__tests__/score-dimension-bar.test.tsx`
- **Scenario** (start `convex_score_row`): must observe headline == '85/100', scenic == 90%, remoteness == 75%, curvature == 60%, technical == 45%, traffic == 30%; must NOT observe hard-coded '74%' / hex literal / Convex hook imported; would fail if Convex mocked / table empty / fill hard-coded / score passed as 0–100.

### AC-2: pure scoreToPercent transform (UNIT — pure arithmetic, zero I/O)
- **UNIT_TEST_JUSTIFIED:** pure closed-form integer-rounding function — no network, no DB, no render, no side effects; integration harness adds no signal at the boundaries.
- **GIVEN** the scoreToPercent helper
- **WHEN** invoked with 0, 0.5, 0.745, 1, null
- **THEN** scoreToPercent(0) == 0; (0.5) == 50; (0.745) == 75; (1) == 100; null → omit sentinel
- **Test tier:** `unit` · **Service:** vitest pure-function runner
- **Verify:** `pnpm test react-native/__tests__/score-dimension-bar.test.tsx`
- **Scenario** (start `convex_score_row`): must observe the exact boundary outputs; must NOT observe floating-point like 74.5 / throw on null; would fail if multiplies by 10 / forgets to round / ceiling's.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: seeds a real row (composite 0.81) and asserts each bar fill == Math.round(score*100)% and headline == '85/100'. | AC-1 | `pnpm test react-native/__tests__/score-dimension-bar.test.tsx` |
| TC-2 | Unit: scoreToPercent boundary outputs for 0, 0.5, 0.745, 1, null. | AC-2 | `pnpm test react-native/__tests__/score-dimension-bar.test.tsx` |

## Reading List

- `app/(app)/saved-route/[id].tsx` (1-120) — sibling detail layout; reuse the same data-into-props seam
- `convex/curatedRoutes.ts` (1-80) — getCuratedRouteDetail return shape (0–1 scores, NO 0–100 pre-scaling)
- `tokens/semantic.json` — semantic.color.primary.default (#EE7C2B), surface.inset, type.label.sm, type.title.lg, radius.full, spacing.3
- `components/ui/` — primitive library conventions
- `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-02 · `.spec/scenarios/UC-DTL-02/`

## Guardrails

- WRITE-ALLOWED: `components/ui/score-dimension-bar.tsx (NEW)` · its component + unit tests
- WRITE-PROHIBITED: `app/**` (DESIGN-002 owns the detail screen) · `convex/**` · `components/discovery/**` (do NOT create the PRD-text directory — see note)

## Design

- ref: `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-02 · `.spec/scenarios/UC-DTL-02/`
- pattern: pure functional display primitive (props in, JSX out; useState/useMemo only for derived widths).
- pattern_source: `components/ui/` existing primitives + Rule-of-2 extraction (renders 5× per detail screen).
- anti_pattern: do NOT wrap in a data-fetching container; do NOT hard-code widths; do NOT inline StyleSheet colors; do NOT animate bar widths on mount (static for Sprint 02).
- **Design enrichment (frontend-designer):** Track = surface.inset bg, height spacing.3 (~8dp), radius semantic.radius.full (pill). Fill = copper-500, same height/radius, width = Math.round(score*100)%. Headline composite ABOVE the 5 bars: semantic.type.title.lg content.primary, format exactly 'NN/100'. Each row label: semantic.type.label.sm content.secondary, minWidth 80dp, left-aligned; percent value right-aligned, semantic.type.label.sm JetBrains Mono content.primary, format 'NN%'. testID per bar row (score-bar-scenic, score-bar-curvature, …). Vertical rhythm between bars spacing.3; headline-to-first-bar gap spacing.4 (~12dp). Graceful null-omission: if all 5 scores null → render nothing (no headline/bars/divider); caller layout must not collapse. Display-only (no onPress), but each row minHeight 44pt to reserve a future tap affordance without reflow. Accept an ordered `dimensions` array prop (do NOT hardcode score keys in a switch).
- **Path discrepancy note:** PRD UC-DTL-02 text places this primitive under `components/discovery/`; roadmap resolves to `components/ui/` (generic reusable primitive, not discovery-scoped). Recorded for reviewer; do not edit the PRD text here.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| Integration | `pnpm test react-native/__tests__/score-dimension-bar.test.tsx` |
| Unit | `pnpm test react-native/__tests__/score-dimension-bar.test.tsx` |
| Biome | `pnpm exec biome check components/ui/score-dimension-bar.tsx` |

## Coding Standards

- TDD RED→GREEN→REFACTOR; semantic tokens only; TypeScript strict, no `any`.
- Stable testIDs on each bar row.

## Dependencies

- Depends on: (none)
- Blocks: DESIGN-002

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DESIGN-001",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "convex_score_row": { "description": "live Convex dev curated_routes row with real 0-1 scores", "seed_method": "public_api", "records": ["compositeScore 0.85 scenic 0.74 remoteness 0.88 traffic 0.30 curvature 0.62 technical 0.55"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a real curated_routes row with 0-1 scores WHEN ScoreDimensionBarSection renders with the live payload THEN each bar fill == Math.round(score*100)% and headline == '85/100'.", "verify": "pnpm test react-native/__tests__/score-dimension-bar.test.tsx", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN the scoreToPercent helper WHEN invoked at boundaries THEN 0->0, 0.5->50, 0.745->75, 1->100, null->omit (UNIT_TEST_JUSTIFIED: pure arithmetic, zero I/O).", "verify": "pnpm test react-native/__tests__/score-dimension-bar.test.tsx", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "integration: bar widths + headline track the live score.", "verify": "pnpm test react-native/__tests__/score-dimension-bar.test.tsx", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "unit: scoreToPercent boundary outputs.", "verify": "pnpm test react-native/__tests__/score-dimension-bar.test.tsx", "maps_to_ac": "AC-2" }
  ]
}
-->
