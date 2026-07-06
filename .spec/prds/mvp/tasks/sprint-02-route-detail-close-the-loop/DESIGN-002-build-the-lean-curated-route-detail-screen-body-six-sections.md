# DESIGN-002: Build the lean curated-route detail screen body (six sections; ~40% map + scrollable body, mirrors saved-route/[id].tsx)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** L · **Estimate:** 180 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

The curated-route detail shell (DTL-001) becomes a lean detail screen: top ~40% non-scrolling map (curated-detail-map), below it a ScrollView body with five sections in order — header (name + archetype Badge), summary (or italic content.secondary "No description yet" when absent), score bars (ScoreDimensionBar + composite headline), conditions (basic weather via existing getCurrentWeather action on centroid, or "conditions unavailable"), actions row (Save + Ride It buttons — rendered here, wired by DESIGN-004). Actions row inside the ScrollView (scrolls with body, NOT pinned).

## Specification

Render a non-scrolling ~40% map at top (curated-detail-map), then a ScrollView body with FIVE sections in order: header (name + archetype Badge), summary (or italic content.secondary "No description yet" when absent), score bars (ScoreDimensionBar + composite headline), conditions (basic weather via getCurrentWeather on centroid, or "conditions unavailable"), actions row (Save + Ride It — rendered here, wired by DESIGN-004). Actions row inside the ScrollView (scrolls with body, NOT pinned).

## Critical Constraints

- MUST render all six sections; absent summary MUST show italic muted "No description yet" (not a blank gap).
- MUST keep Save/Ride It inside the ScrollView (scroll with body on long pages; NOT position:absolute/pinned).
- MUST NOT block the whole screen when getCurrentWeather fails — show "conditions unavailable" in that one section only.
- MUST seed every AC against a real curated_routes row via public_api — NEVER mock Convex or Map.
- NEVER implement geometry degradation (DESIGN-003 owns) or Save/Ride It behavior (DESIGN-004 owns); this task renders buttons only.

## Acceptance Criteria

### AC-1: all six sections render for a route WITH geometry + summary + live weather
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DTL-01/`
- **GIVEN** a dev row 'Wasatch Ridge Traverse' (routePolyline present, summary present, compositeScore 0.85, getCurrentWeather succeeds)
- **WHEN** the reviewer navigates to /curated-route/<id>
- **THEN** header contains 'Wasatch Ridge Traverse'; header Badge shows the UI-mapped archetype label (e.g. 'Scenic Byway'); composite headline == '85/100'; ScoreDimensionBar count == 5; polyline layer present (map children ≥ 1); conditions section shows a real temperature value from getCurrentWeather (not 'conditions unavailable'); 'Save' label == 'Save'; 'Ride It' label == 'Ride It'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_polyline_route`): must observe the literal name, headline '81/100', 5 bars, polyline, both buttons; must NOT observe 'No description yet' / 'conditions unavailable' / 'Approximate location'; would fail if Convex mocked / Map stubbed / score section hard-coded / actions omitted.

### AC-2: route with NO summary → italic muted 'No description yet' placeholder
- **GIVEN** a dev row whose getCuratedRouteDetail returns summary=null or empty string
- **WHEN** navigated to
- **THEN** summary section text == 'No description yet' in italic content.secondary style *(enrichment supersedes PRD UC-DTL-01 AC5's onSurface.muted — same visual result, content.secondary is the token to use)*
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_no_summary`): must observe text == 'No description yet', style == italic content.secondary; must NOT observe blank gap / 'undefined'; would fail if placeholder text differs or section omitted.

### AC-3: long-content route → Save/Ride It scroll WITH the body (not pinned)
- **GIVEN** a row whose summary+conditions push actions below the fold
- **WHEN** scrolled to bottom
- **THEN** after scroll both 'Save' and 'Ride It' on-screen (y within viewport); before scroll both y > viewport height (below fold)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_long_content`): must observe buttons reachable after scroll, below-fold before scroll; would fail if actions row position:absolute/fixed / outside ScrollView.

### AC-4: getCurrentWeather failure → 'conditions unavailable' without blocking other sections
- **GIVEN** getCurrentWeather throws/returns error for the centroid
- **WHEN** navigated
- **THEN** conditions text == 'conditions unavailable'; header still contains 'Wasatch Ridge Traverse'; headline still == '81/100'; 'Save' label still == 'Save'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_polyline_route`, forced weather failure): must observe literal 'conditions unavailable' + other sections intact; must NOT observe full-screen error / blank; would fail if weather failure unmounts the screen or weather mocked to always succeed.

### AC-5: weather success path renders a real temperature value
- **GIVEN** a dev row 'Wasatch Ridge Traverse' with a valid centroid and getCurrentWeather succeeds
- **WHEN** navigated to
- **THEN** the conditions section renders a non-empty temperature/wind value (not 'conditions unavailable', not blank)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_polyline_route`): must observe conditions section non-empty with a real numeric temperature; would fail if weather call skipped or conditions section always shows fallback.

### AC-6: short-content route → Save/Ride It visible WITHOUT scrolling
- **GIVEN** a row whose summary+conditions fit above the fold on a 375pt-wide device (iPhone SE)
- **WHEN** the detail opens
- **THEN** both 'Save' and 'Ride It' buttons' y-coordinates are within the viewport (no scroll required)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx`
- **Scenario** (start `convex_polyline_route`): must observe both buttons visible without scrolling on a short page; would fail if buttons are below the fold on short content.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | E2e navigates to a real 'Wasatch Ridge Traverse' row and asserts all six sections. | AC-1 | `pnpm test app/\(app\)/curated-route/\[id\].six-section.integration.test.tsx` |
| TC-2 | E2e asserts literal 'No description yet' for a summary=null row. | AC-2 | same |
| TC-3 | E2e scrolls a long-content route and asserts Save/Ride It reachable (not pinned). | AC-3 | same |
| TC-4 | E2e forces a weather failure and asserts 'conditions unavailable' + other sections intact. | AC-4 | same |
| TC-5 | E2e asserts conditions section shows a real temperature value on weather success. | AC-5 | same |
| TC-6 | E2e asserts Save/Ride It visible without scrolling on a short-content route. | AC-6 | same |

## Reading List

- `app/(app)/saved-route/[id].tsx` (1-200) — MIRROR THIS LAYOUT (section order, ~40% map + ScrollView body, actions placement)
- `app/(app)/curated-route/[id].tsx` (1-80) — DTL-001 shell to expand
- `convex/curatedRoutes.ts` (1-100) — getCuratedRouteDetail return shape
- `convex/weather.ts` (1-60) — getCurrentWeather action signature + failure modes
- `components/ui/score-dimension-bar.tsx` — DESIGN-001 component API
- `tokens/semantic.json` — placeholder typography/colors
- `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-01 · `.spec/scenarios/UC-DTL-01/`

## Guardrails

- WRITE-ALLOWED: `app/(app)/curated-route/[id].tsx (MODIFY — six-section body)` · its e2e suite
- WRITE-PROHIBITED: `components/ui/**` (DESIGN-001) · `convex/**` · `app/(app)/saved-route/**` (read-only) · `components/discovery/**`

## Design

- ref: `app/(app)/saved-route/[id].tsx` (mirror) · DESIGN-001 · DESIGN-003 · `.spec/scenarios/UC-DTL-01/`
- pattern: screen composition over a single Convex query + one action, with per-section null/error guards.
- pattern_source: `app/(app)/saved-route/[id].tsx`
- anti_pattern: do NOT wrap the whole screen in a single error boundary that swallows per-section failures; do NOT pin the actions row; do NOT mock the Map.
- **Design enrichment (frontend-designer):** Layout split: top ~40% screen = `curated-detail-map` (non-scrolling, absolute above body); bottom ~60% = ScrollView body, contentContainer horizontal padding spacing.4, section-to-section vertical gap spacing.6. Header: name semantic.type.title.lg content.primary + archetype Badge variant='secondary' inline. Summary: semantic.type.body.md content.secondary; when empty → italic 'No description yet' in content.secondary italic (NOT onSurface.muted — same color, italic face only). Scores: render ScoreDimensionBar inside `curated-detail-scores`; do not duplicate its headline. Actions row INSIDE the ScrollView (`curated-detail-actions`) — explicitly NOT position:absolute/pinned. Section order top→bottom: header → summary → scores → conditions → actions. testIDs on section root Views: curated-detail-header, curated-detail-summary, curated-detail-scores, curated-detail-map, curated-detail-conditions, curated-detail-actions.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E | `pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx` |
| Biome | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx'` |

## Coding Standards

- TDD RED→GREEN→REFACTOR; semantic tokens only; TypeScript strict; per-section null/error guards (no screen-level catch-all for weather); mirror saved-route/[id].tsx layout.

## Dependencies

- Depends on: DTL-001, DESIGN-001
- Blocks: DESIGN-003, DESIGN-004, SAVE-001

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DESIGN-002",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "convex_polyline_route": { "description": "live Convex dev curated_routes row WITH routePolyline + scores + summary (name 'Wasatch Ridge Traverse', compositeScore 0.85)", "seed_method": "public_api", "records": ["routePolyline non-null compositeScore 0.85 summary present"] },
    "convex_no_summary": { "description": "live Convex dev curated_routes row with summary=null", "seed_method": "public_api", "records": ["summary null/empty"] },
    "convex_long_content": { "description": "live Convex dev curated_routes row with long summary pushing actions below fold", "seed_method": "public_api", "records": ["long summary + conditions"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a real route WITH geometry+summary+weather WHEN opened THEN all six sections render with literal content.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN summary=null WHEN opened THEN the italic muted 'No description yet' placeholder renders (not a blank gap).", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a long-content route WHEN scrolled THEN Save/Ride It are reachable at scroll-end (not pinned).", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a getCurrentWeather failure WHEN opened THEN 'conditions unavailable' renders while the other five sections stay intact.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "primary": false, "description": "GIVEN getCurrentWeather succeeds WHEN opened THEN conditions section shows a real temperature value.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "AC-6", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a short-content route on 375pt device WHEN opened THEN Save/Ride It visible without scrolling.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "six-section render for a real row.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "'No description yet' placeholder.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Save/Ride It scroll with body (not pinned).", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "'conditions unavailable' non-blocking.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "Weather success renders real temperature.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-5" },
    { "id": "TC-6", "type": "test_criterion", "description": "Short-content route: buttons visible without scrolling.", "verify": "pnpm test app/(app)/curated-route/[id].six-section.integration.test.tsx", "maps_to_ac": "AC-6" }
  ]
}
-->
