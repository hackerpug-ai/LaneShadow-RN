# DESIGN-003: Geometry graceful degradation — polyline when present, centroid marker + 'Approximate location' badge when absent

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** S · **Estimate:** 60 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

The curated-route detail map degrades gracefully across three geometry states — polyline present (render polyline + fit bounds), centroid-only (single marker + 'Approximate location' badge + zoom ~11), neither (no crash) — so the map never appears blank.

## Specification

Implement the geometry branch in the map section of `app/(app)/curated-route/[id].tsx` (the section DESIGN-002 placed). When routePolyline is a non-empty string (~55%) → render polyline, camera fits bounds. When routePolyline null/absent (~45%) → ONE centroid marker + a react-native-paper `Badge variant='outline'` label 'Approximate location' BELOW the map, camera zoom ~11 centered on centroid. When centroid also null → graceful (no crash). Never show the badge when a polyline is present.

## Critical Constraints

- MUST render the polyline + fit bounds when routePolyline present; MUST show the 'Approximate location' badge ONLY when absent.
- MUST render exactly ONE centroid marker + badge + zoom ~11 when routePolyline null/absent.
- MUST NEVER show a blank or crashed map on any branch.
- MUST seed both branches against real curated_routes rows via public_api. NEVER mock Map or Convex.
- Edit ONLY the map section of `app/(app)/curated-route/[id].tsx`.

## Acceptance Criteria

### AC-1: route WITH polyline → polyline renders, NO 'Approximate location' badge
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DTL-03/with-polyline`
- **GIVEN** a dev row 'Wasatch Ridge Traverse' with routePolyline present
- **WHEN** navigated to /curated-route/<id>
- **THEN** polyline layer drawn (map Polyline child count ≥ 1); 'Approximate location' text occurrence count == 0; camera fits bounds
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/uc-dtl-03-with-polyline.yaml`
- **Scenario** (start `convex_polyline_route`): must observe polyline child count ≥ 1, badge count == 0; must NOT observe 'Approximate location' / empty map / crash; would fail if Map stubbed / routePolyline disconnected / badge shown by conditional bug.

### AC-2: route WITHOUT polyline → single centroid marker + literal 'Approximate location' badge, zoom ~11
- **flow_ref:** `.spec/scenarios/UC-DTL-03/without-polyline`
- **GIVEN** a dev row whose routePolyline is null/absent, centroid present
- **WHEN** navigated to /curated-route/<id>
- **THEN** centroid Marker count == 1; 'Approximate location' badge text == 'Approximate location'; map camera zoom == 11
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/uc-dtl-03-without-polyline.yaml`
- **Scenario** (start `convex_no_polyline_route`): must observe marker count == 1, badge text literal, zoom == 11; must NOT observe polyline / blank map / crash; would fail if Map mocked / centroid disconnected / row has routePolyline.

### AC-3: centroid also null → graceful no-crash
- **GIVEN** a dev row with routePolyline null AND centroid null
- **WHEN** navigated
- **THEN** header name text length ≥ 1 (non-empty); rendered non-map section count ≥ 1 (no white/blank screen, no exception)
- **Test tier:** `integration` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test <integration-test>`
- **Scenario** (start `convex_null_centroid`): must observe header name length ≥ 1, non-map section count ≥ 1; must NOT observe white/blank / unhandled exception; would fail if uncaught TypeError on null centroid.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | E2e WITH polyline: polyline layer renders, 'Approximate location' absent. | AC-1 | `maestro test .maestro/uc-dtl-03-with-polyline.yaml` |
| TC-2 | E2e WITHOUT polyline: single centroid marker + literal badge + zoom 11, no crash. | AC-2 | `maestro test .maestro/uc-dtl-03-without-polyline.yaml` |
| TC-3 | Integration null-centroid: graceful, no crash. | AC-3 | `pnpm test <integration-test>` |

## Reading List

- `app/(app)/curated-route/[id].tsx` (DTL-001 map section)
- `convex/curatedRoutes.ts` — getCuratedRouteDetail routePolyline/centroidLat/Lng/bounds
- `tokens/semantic.json` — surface.inset, border.default, radius.full, spacing.2
- `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-03 · `.spec/scenarios/UC-DTL-03/`

## Guardrails

- WRITE-ALLOWED: `app/(app)/curated-route/[id].tsx (MODIFY — map section)` · `.maestro/uc-dtl-03-*.yaml (NEW)`
- WRITE-PROHIBITED: `convex/**` · other screens · `tokens/**`

## Design

- ref: `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-03 · `.spec/scenarios/UC-DTL-03/`
- pattern: conditional sub-render: polyline → full route; null → centroid pin + outline badge. Caller never sees an empty map.
- pattern_source: DRY/UI graceful-degradation convention.
- anti_pattern: do NOT show an error/empty-state View replacing the map; do NOT render the badge when a polyline is available; do NOT change zoom dynamically on the centroid-only branch.
- **Design enrichment (frontend-designer):** 'Approximate location' Badge variant='outline' (borderWidth 1, borderColor semantic.color.border.default, textColor semantic.color.onSurface.default, padding spacing.2, radius semantic.radius.full, font semantic.type.label.sm), centered BELOW the map, testID `curated-detail-approximate-badge`. Camera fallback: centroid-only at zoomLevel 11 (no padding). Polyline: stroke copper-500 (#EE7C2B), strokeWidth 4, no dashPattern. Map must ALWAYS show the centroid marker even if polyline null. Centroid marker uses the existing pin asset (no special 'approximate' icon — the badge carries the semantics). Badge nulls the moment a real polyline resolves (no fade).

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E | `maestro test .maestro/uc-dtl-03-with-polyline.yaml` AND `maestro test .maestro/uc-dtl-03-without-polyline.yaml` |
| Integration | `pnpm test <integration null-centroid>` |
| Biome | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx'` |

## Coding Standards

- Semantic tokens only; testIDs on map container + badge; StyleSheet.create; handle all three states.

## Dependencies

- Depends on: DTL-001
- Blocks: (none — co-develops with DESIGN-002 map section)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DESIGN-003",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "convex_polyline_route": { "description": "live Convex dev curated_routes row WITH routePolyline", "seed_method": "public_api", "records": ["routePolyline non-null name 'Wasatch Ridge Traverse'"] },
    "convex_no_polyline_route": { "description": "live Convex dev curated_routes row routePolyline=null centroid present", "seed_method": "public_api", "records": ["routePolyline null centroidLat/Lng set name 'Blue Ridge Overlook'"] },
    "convex_null_centroid": { "description": "live Convex dev curated_routes row routePolyline=null AND centroid null", "seed_method": "public_api", "records": ["routePolyline null centroidLat/Lng null"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a route WITH routePolyline WHEN opened THEN the polyline renders and the 'Approximate location' badge is absent.", "verify": "maestro test .maestro/uc-dtl-03-with-polyline.yaml", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a route WITHOUT routePolyline WHEN opened THEN a single centroid marker + literal 'Approximate location' badge render at zoom 11.", "verify": "maestro test .maestro/uc-dtl-03-without-polyline.yaml", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a route with neither polyline nor centroid WHEN opened THEN the screen degrades gracefully (no crash).", "verify": "pnpm test <integration-test>", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "WITH polyline: polyline + no badge.", "verify": "maestro test .maestro/uc-dtl-03-with-polyline.yaml", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "WITHOUT polyline: marker + badge + zoom 11.", "verify": "maestro test .maestro/uc-dtl-03-without-polyline.yaml", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "null centroid: graceful no-crash.", "verify": "pnpm test <integration-test>", "maps_to_ac": "AC-3" }
  ]
}
-->
