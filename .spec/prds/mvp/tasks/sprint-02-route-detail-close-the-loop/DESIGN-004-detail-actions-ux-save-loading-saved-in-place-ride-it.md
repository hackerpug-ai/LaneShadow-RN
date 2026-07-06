# DESIGN-004: Detail actions UX — Save (loading→'Saved' in place) + Ride It affordances

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

Save and Ride It on the curated-route detail actions row are wired with explicit in-place behavior: Save shows loading then a confirmed 'Saved' state without navigating away; Ride It hands off to Apple/Google Maps via SAVE-002's util; a failed Save restores the tappable 'Save' state.

## Specification

Modify the actions row of `app/(app)/curated-route/[id].tsx` (rendered by DESIGN-002) to wire button BEHAVIOR. Save: variant='primary', onPress → ActivityIndicator while the Convex mutation (useSaveCuratedRoute from SAVE-001) pending → on resolve swap to checkmark + 'Saved' + Badge variant='success' IN PLACE (no navigation). Ride It: variant='outline', onPress → `openRouteInMaps({lat,lng,name})` (SAVE-002 `lib/maps-deeplink.ts`). Explicit status state machine (idle|loading|saved|error); onError → idle. Layout/scroll owned by DESIGN-002; this task wires onPress + state.

## Critical Constraints

- MUST show ActivityIndicator during the pending Save mutation; MUST switch IN PLACE to 'Saved' (checkmark + success Badge) on success — NO navigation away.
- MUST call SAVE-002 `openRouteInMaps` for Ride It (never hardcode a maps URL).
- MUST restore the tappable 'Save' label on mutation failure (never stuck loading).
- MUST seed auth + saved-state via public_api. NEVER mock useSaveCuratedRoute in PRIMARY.
- Both buttons ≥44pt, visually distinct (primary vs outline). Edit ONLY actions-row onPress + state.

## Acceptance Criteria

### AC-1: tap Save → loading → 'Saved' in place, no navigation away
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DTL-04/save`
- **GIVEN** an authenticated user + a curated route not yet saved
- **WHEN** the user taps Save (`save-curated-button`)
- **THEN** ActivityIndicator node count == 1 during pending; button label == 'Saved' with checkmark after resolve; current route path still == '/(app)/curated-route/{id}'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/uc-dtl-04-save.yaml`
- **Scenario** (start `auth_curated_unsaved`): must observe ActivityIndicator count == 1, label 'Saved', path unchanged; must NOT observe navigation away / stuck loading / duplicate buttons; would fail if useSaveCuratedRoute stubbed / no loading indicator / navigates on success.

### AC-2: tap Ride It → opens Apple/Google Maps at centroid with name
- **flow_ref:** `.spec/scenarios/UC-DTL-04/ride-it`
- **GIVEN** a curated route with centroid + name
- **WHEN** the user taps Ride It (`ride-it-button`)
- **THEN** Linking.openURL called == 1 time; opened URL host == 'maps.apple.com' (iOS); URL contains 'll=40.6,-111.6' and 'q=Wasatch'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/uc-dtl-04-ride-it.yaml`
- **Scenario** (start `convex_polyline_route`): must observe openURL count == 1, host 'maps.apple.com', centroid+name in URL; must NOT observe no-op / wrong coords; would fail if deeplink util stubbed / centroid disconnected.

### AC-3: Save mutation fails → button returns to tappable 'Save' (not stuck loading)
- **flow_ref:** `.spec/scenarios/UC-DTL-04/save-failure`
- **GIVEN** the save mutation rejects
- **WHEN** Save is tapped
- **THEN** button label == 'Save' restored (not loading); Linking.openURL call count == 0 during the failed save
- **Test tier:** `integration` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test app/(app)/curated-route/[id].actions.integration.test.tsx`
- **Scenario** (start `mutation_failure`): must observe label 'Save' restored, openURL count == 0; must NOT observe perpetual ActivityIndicator / 'Saved' false-positive; would fail if mutation error swallowed / no onError.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | E2e Save: loading → literal 'Saved' in place, same screen. | AC-1 | `maestro test .maestro/uc-dtl-04-save.yaml` |
| TC-2 | E2e Ride It: openRouteInMaps invoked with centroid+name; Apple Maps on iOS. | AC-2 | `maestro test .maestro/uc-dtl-04-ride-it.yaml` |
| TC-3 | Integration Save failure: button returns to 'Save'. | AC-3 | `pnpm test app/(app)/curated-route/[id].actions.integration.test.tsx` |

## Reading List

- `app/(app)/curated-route/[id].tsx` (DESIGN-002 actions row)
- `hooks/use-save-curated-route.ts` (SAVE-001) · `lib/maps-deeplink.ts` (SAVE-002)
- `tokens/semantic.json` — primary.default (copper), type.title.lg
- `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-04 · `.spec/scenarios/UC-DTL-04/`

## Guardrails

- WRITE-ALLOWED: `app/(app)/curated-route/[id].tsx (MODIFY — actions row onPress + state)` · `.maestro/uc-dtl-04-*.yaml (NEW)`
- WRITE-PROHIBITED: `convex/**` · `lib/maps-deeplink.ts` (SAVE-002 owns) · `tokens/**` · other screens

## Design

- ref: `.spec/prds/mvp/06-uc-dtl.md`#uc-dtl-04 · `.spec/scenarios/UC-DTL-04/`
- pattern: in-place optimistic action with explicit status state machine (idle|loading|saved|error).
- pattern_source: DRY/UI action-state convention.
- anti_pattern: navigate-on-success; fire-and-forget mutation with no error recovery; hardcoded maps URL; two primary buttons.
- **Design enrichment (frontend-designer):** Save Button variant='primary' (filled copper-500), label 'Save', minHeight 44pt, fullWidth or flex:1. Loading: replace label with ActivityIndicator (keep button dimensions stable — no layout shift), disable onPress to prevent double-save. Success (in place): swap label to checkmark + 'Saved' AND Badge variant='success' inline; NO navigation; disable re-press until reverted. Ride It Button variant='outline' (border.default border, onSurface.default text, transparent fill), minHeight 44pt — visually distinct via outline-vs-filled (do NOT use variant='secondary'). Actions row: flexbox row, gap spacing.4, both flex:1, reachable without scrolling on short screens (test iPhone SE 375pt). testIDs: `save-curated-button`, `ride-it-button`.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E | `maestro test .maestro/uc-dtl-04-save.yaml` AND `maestro test .maestro/uc-dtl-04-ride-it.yaml` |
| Integration | `pnpm test app/(app)/curated-route/[id].actions.integration.test.tsx` |
| Biome | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx'` |

## Coding Standards

- Semantic tokens only; testIDs on both buttons; ≥44pt targets; explicit error handling on mutation + deeplink; StyleSheet.create.

## Dependencies

- Depends on: DESIGN-002, SAVE-001, SAVE-002
- Blocks: (none)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DESIGN-004",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "auth_curated_unsaved": { "description": "authenticated user + curated route 'Wasatch Ridge Traverse' not yet saved", "seed_method": "ui_flow", "records": ["signed-in user curated route detail open not in saved_routes"] },
    "convex_polyline_route": { "description": "live Convex dev curated_routes row with centroid {40.6,-111.6} + name", "seed_method": "public_api", "records": ["centroid 40.6,-111.6 name 'Wasatch Ridge Traverse'"] },
    "mutation_failure": { "description": "Convex save mutation rejects", "seed_method": "ui_flow", "records": ["save mutation onError path"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN auth + unsaved curated route WHEN the user taps Save THEN loading then literal 'Saved' in place, no navigation away.", "verify": "maestro test .maestro/uc-dtl-04-save.yaml", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a curated route with centroid+name WHEN the user taps Ride It THEN openRouteInMaps opens Apple/Google Maps at the centroid with the name.", "verify": "maestro test .maestro/uc-dtl-04-ride-it.yaml", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN the save mutation rejects WHEN Save is tapped THEN the button returns to the tappable 'Save' state (not stuck loading).", "verify": "pnpm test app/(app)/curated-route/[id].actions.integration.test.tsx", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Save loading->'Saved' in place.", "verify": "maestro test .maestro/uc-dtl-04-save.yaml", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Ride It opens maps with centroid+name.", "verify": "maestro test .maestro/uc-dtl-04-ride-it.yaml", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Save failure restores 'Save'.", "verify": "pnpm test app/(app)/curated-route/[id].actions.integration.test.tsx", "maps_to_ac": "AC-3" }
  ]
}
-->
