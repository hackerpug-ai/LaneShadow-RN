# DTL-001: Create app/(app)/curated-route/[id].tsx route + useCuratedRouteDetail hook, wire plan-view card/pin tap to router.push

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 150 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist — the nominal `react-native-ui-planner` is non-responsive in this harness; the implementer holds the same RN domain expertise and is the assigned implementer)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

Tapping a curated-route chat card OR its map pin on the plan view navigates to `/(app)/curated-route/{id}`, which renders the route's real name (and, when present, its polyline) from live Convex — with a graceful "Route not found" fallback when the query fails. Both entry points share one push target.

## Specification

Create `app/(app)/curated-route/[id].tsx` (mirror of `app/(app)/saved-route/[id].tsx` scaffold: useLocalSearchParams `{id}`, loading skeleton, error boundary) + `hooks/use-curated-route-detail.ts` (typed useQuery over `api.curatedRoutes.getCuratedRouteDetail`, DATA-006). In `app/(app)/(tabs)/index.tsx` wire BOTH the curated chat-card onPress AND the map-pin onPress to `router.push('/(app)/curated-route/{id}')` via a shared `goToCuratedRoute(id)` helper. Loading skeleton reuses the saved-route detail skeleton; error fallback is a centered "Route not found" in `semantic.type.body.md` / `onSurface.muted`.

## Critical Constraints

- MUST wire BOTH the curated chat-card tap AND the map-pin tap to the SAME `router.push('/(app)/curated-route/{id}')` target.
- MUST seed every behavioral test against live Convex dev via public_api — NEVER stub the Convex client or Map.
- MUST mirror the file structure of `app/(app)/saved-route/[id].tsx` (Expo Router params, error boundary, loading state).
- NEVER modify `convex/*` (DATA-006 owns) or `components/ui/score-dimension-bar.tsx` (DESIGN-001 owns).
- Do NOT bake geometry/centroid rendering here (DESIGN-003 owns); this task only asserts no-crash + name renders for the no-polyline case.

## Acceptance Criteria

### AC-1: tap curated chat card WITH geometry → detail opens with real name + polyline
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DTL-01/happy-with-polyline`
- **GIVEN** the plan tab is mounted with a curated chat card backed by a real route with geometry
- **WHEN** the user taps the card `curated-chat-card-{id}`
- **THEN** current route path == '/(app)/curated-route/{id}' AND `curated-route-detail-name` text == 'Cherohala Skyway' AND `curated-route-detail-map` has rendered a polyline layer (child count ≥ 1)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/curated-route-detail.yaml`
- **Scenario** (start `plan_tab_with_card`): must observe path == '/(app)/curated-route/{id}', name == 'Cherohala Skyway', map child count ≥ 1; must NOT observe blank screen / red error box / 'undefined'; would fail if Convex stubbed / Map statically rendered / route id disconnected / name hard-coded.

### AC-2: curated route with NO polyline → no crash, name still renders
- **GIVEN** a curated route in dev whose routePolyline is null/absent
- **WHEN** the user deep-links / pushes to '/(app)/curated-route/{no-polyline-id}'
- **THEN** the screen opens without crashing AND `curated-route-detail-name` text == 'Blue Ridge Overlook'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/curated-route-detail.yaml`
- **Scenario** (start `convex_no_polyline_route`): must observe path == the no-polyline route, name == 'Blue Ridge Overlook'; must NOT observe red error box / blank screen; would fail if map renderer not guarded against null geometry.

### AC-3: tap MAP PIN → same curated detail route opens
- **GIVEN** a curated map pin `curated-map-pin-{id}` is visible on the plan tab
- **WHEN** the user taps the pin
- **THEN** current route path == '/(app)/curated-route/{id}' AND name text == matching route name
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/curated-route-detail.yaml`
- **Scenario** (start `plan_tab_with_pin`): must observe path == '/(app)/curated-route/{id}', name matches; must NOT observe navigation to saved-route/{id} / no-op; would fail if only chat-card onPress is wired.

### AC-4: getCuratedRouteDetail throws/returns null → graceful 'Route not found' fallback
- **flow_ref:** `.spec/scenarios/UC-DTL-01/error-fallback`
- **GIVEN** getCuratedRouteDetail returns null for an id (e.g. a non-existent id)
- **WHEN** the user navigates to '/(app)/curated-route/{bad-id}'
- **THEN** `curated-route-detail-fallback` text == 'Route not found' with no uncaught error
- **Test tier:** `integration` · **Service:** vitest against live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].integration.test.tsx`
- **Scenario** (start `convex_bad_id`): must observe fallback text == 'Route not found'; must NOT observe blank screen / uncaught exception; would fail if query error uncaught to error boundary.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Tapping a curated chat card with geometry navigates to the detail route and renders the literal name + polyline. | AC-1 | `maestro test .maestro/curated-route-detail.yaml` |
| TC-2 | Opening a no-polyline curated route does not crash and renders the literal name. | AC-2 | same |
| TC-3 | Tapping the map pin navigates to the same detail route as the chat card. | AC-3 | same |
| TC-4 | A null/throwing query renders the literal 'Route not found' fallback with no uncaught error. | AC-4 | `pnpm test app/(app)/curated-route/[id].integration.test.tsx` |

## Reading List

- `app/(app)/saved-route/[id].tsx` (1-140) — detail screen structure to mirror (params, useQuery wiring, loading/error states, map + name block)
- `app/(app)/(tabs)/index.tsx` (1-80) — plan view; locate curated chat-card + map-pin onPress sites
- `hooks/use-saved-routes.ts` / `hooks/use-is-route-saved.ts` — sibling hook patterns
- `convex/curatedRoutes.ts` (1-60) — getCuratedRouteDetail return shape (DATA-006) the hook must match
- `.spec/scenarios/UC-DTL-01/`

## Guardrails

- WRITE-ALLOWED: `app/(app)/curated-route/[id].tsx (NEW)` · `hooks/use-curated-route-detail.ts (NEW)` · `app/(app)/(tabs)/index.tsx (MODIFY — wire card + pin tap to router.push)` · `.maestro/curated-route-detail.yaml (NEW)`
- WRITE-PROHIBITED: `convex/*` (DATA-006 owns) · `components/ui/score-dimension-bar.tsx` (DESIGN-001 owns) · `tokens/**`

## Design

- ref: `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-01 · `.spec/scenarios/UC-DTL-01/`
- pattern: two entry points (card + pin) → one push target → standard [id] detail shell with shared loading skeleton + error fallback; reuse saved-route scaffold.
- pattern_source: `app/(app)/saved-route/[id].tsx`
- anti_pattern: do NOT bypass router.push with Link href strings (breaks deep-link back-stack); do NOT author a bespoke loading skeleton; do NOT render the fallback inside the ScrollView (it replaces the whole body).
- **Design enrichment (frontend-designer):** Card tap and pin tap BOTH `router.push` to `/(app)/curated-route/{id}` — identical target, identical push semantics. testIDs: `curated-chat-card-{id}` (card root), `curated-map-pin-{id}` (pin), `curated-route-detail-name` (header name, `semantic.type.title.lg` content.primary), `curated-route-detail-fallback` (fallback root). Loading skeleton reuses the saved-route detail skeleton (token-derived placeholder colors). Error fallback "Route not found" centered in `semantic.type.body.md` / `onSurface.muted`. Read `{id}` via `useLocalSearchParams` (never a query prop / global state). Tap targets ≥44pt hit slop; pin uses the same parameterized onPress as the card.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E Maestro | `maestro test .maestro/curated-route-detail.yaml` |
| Biome | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx' hooks/use-curated-route-detail.ts` |

## Coding Standards

- TDD RED→GREEN→REFACTOR per AC; semantic tokens only; TypeScript strict, no `any`.
- testIDs on card root, pin, name, fallback.

## Dependencies

- Depends on: DATA-006
- Blocks: DESIGN-002, DESIGN-003, SAVE-001

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DTL-001",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "plan_tab_with_card": { "description": "plan view showing a curated chat card backed by real route 'Cherohala Skyway'", "seed_method": "ui_flow", "records": ["app on plan tab against live Convex curated chat card visible"] },
    "convex_no_polyline_route": { "description": "live Convex dev curated_routes row routePolyline=null centroid present (name 'Blue Ridge Overlook')", "seed_method": "public_api", "records": ["routePolyline null centroidLat/Lng set"] },
    "plan_tab_with_pin": { "description": "plan view showing a curated map pin", "seed_method": "ui_flow", "records": ["curated map pin visible on plan tab"] },
    "convex_bad_id": { "description": "a curated-route id absent from live Convex dev", "seed_method": "public_api", "records": ["unknown curated id"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN the plan tab shows a curated chat card backed by a route with geometry WHEN the user taps it THEN the app navigates to '/(app)/curated-route/{id}' and renders the literal name + polyline.", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a curated route with no polyline WHEN the user opens its detail THEN no crash and the literal name renders.", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a curated map pin is visible WHEN the user taps it THEN the app navigates to '/(app)/curated-route/{id}' (same as the card).", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN getCuratedRouteDetail returns null/throws WHEN the user opens the detail THEN a graceful 'Route not found' fallback renders with no uncaught error.", "verify": "pnpm test app/(app)/curated-route/[id].integration.test.tsx", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "card tap with geometry navigates + renders name + polyline.", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "no-polyline route opens without crash + renders name.", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "pin tap navigates to the same detail route as the card.", "verify": "maestro test .maestro/curated-route-detail.yaml", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "null/throwing query renders the 'Route not found' fallback.", "verify": "pnpm test app/(app)/curated-route/[id].integration.test.tsx", "maps_to_ac": "AC-4" }
  ]
}
-->
