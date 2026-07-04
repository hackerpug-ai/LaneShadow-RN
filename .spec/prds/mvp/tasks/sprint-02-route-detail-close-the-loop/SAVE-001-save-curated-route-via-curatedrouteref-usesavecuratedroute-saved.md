# SAVE-001: Save curated route via curatedRouteRef (useSaveCuratedRoute, fires recordRouteFeedback('save')); Saved-screen + SavedRouteCard tolerance

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 180 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

A curated route saves via `curatedRouteRef` (no synthesized legs), appears in the Saved list, reopens to its detail without a legs/PlanInput error, and toggles Save↔Unsave — all against live Convex.

## Specification

NEW `hooks/use-save-curated-route.ts` — `useSaveCuratedRoute({curatedRouteId, name})` mutation that persists a saved_routes row via `curatedRouteRef` (DATA-003) AND fires `recordRouteFeedback('save')` (`convex/db/routeFeedback.ts`). MODIFY `app/(app)/(tabs)/saved-routes.tsx` + `saved-routes.components.tsx` SavedRouteCard to tolerate a curated row (curatedRouteRef present, no legs) — lean preview (name, centroid, score, archetype). MODIFY `app/(app)/saved-route/[id].tsx` reopen path: if curatedRouteRef present, dereference via getCuratedRouteDetail (do NOT read planInput/routeSnapshot/routeIndex). A useIsRouteSaved-style check keyed on curatedRouteId toggles Save↔Unsave.

## Critical Constraints

- MUST seed via public_api against live Convex (real saved_routes mutation + recordRouteFeedback).
- MUST assert concrete literals (route name in Saved list, planInput absent on the saved row, saved_routes row count).
- MUST set curatedRouteRef and MUST NOT set planInput/routeSnapshot/routeIndex (DATA-003 XOR).
- NEVER mock Convex (saved_routes mutation, recordRouteFeedback, getCuratedRouteDetail). NEVER synthesize legs. NEVER reuse legacy useSaveRoute for curated saves.

## Acceptance Criteria

### AC-1: Save persists via curatedRouteRef + fires feedback
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-SAVE-01/primary`
- **GIVEN** a curated route open on detail against live Convex dev
- **WHEN** the user taps Save (`save-curated-button`)
- **THEN** a saved_routes row exists with curatedRouteRef == <curated id>; new row planInput == undefined; saved_routes row count for owner increments by == 1; control text == 'Saved'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/save-curated.yaml`
- **Scenario** (start `auth_curated_unsaved`): must observe count +1, curatedRouteRef set, planInput undefined, text 'Saved'; must NOT observe 'Save' after tap / planInput set / synthesized legs; would fail if Convex disconnected / mutation stubbed / recordRouteFeedback mocked.

### AC-2: Saved screen renders curated row without legs
- **GIVEN** a saved_routes row with curatedRouteRef + no legs
- **WHEN** the user opens Saved
- **THEN** card text == 'Wasatch Ridge Loop'; Saved list count ≥ 1 (no crash, no 'undefined' legs)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/save-curated.yaml`
- **Scenario** (start `convex_curated_bookmark`): must observe card name literal, list count ≥ 1; must NOT observe crash / 'undefined' legs / planInput-derived legs; would fail if SavedRouteCard requires legs.

### AC-3: reopen saved curated row via getCuratedRouteDetail without legs error
- **GIVEN** a saved_routes row with curatedRouteRef
- **WHEN** the user taps the saved curated row
- **THEN** detail header text == 'Wasatch Ridge Loop'; getCuratedRouteDetail call count == 1 with the curated id (no legs/PlanInput error)
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/save-curated.yaml`
- **Scenario** (start `convex_curated_bookmark`): must observe header name literal, getCuratedRouteDetail called; must NOT observe legs/PlanInput error / crash; would fail if reopen path reads planInput.

### AC-4: Unsave toggles state
- **GIVEN** a curated route already saved
- **WHEN** the user taps the Saved/Unsave control
- **THEN** control text == 'Save'; saved_routes row count for the curated id == 0 after unsave
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `maestro test .maestro/save-curated.yaml`
- **Scenario** (start `auth_curated_saved`): must observe text 'Save', count == 0; must NOT observe control stuck on 'Saved'; would fail if removeSavedRoute stubbed.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | E2e Save persists curatedRouteRef, planInput absent, count +1, control 'Saved'. | AC-1 | `maestro test .maestro/save-curated.yaml` |
| TC-2 | E2e Saved renders curated SavedRouteCard (name/centroid/score/archetype) without crash. | AC-2 | same |
| TC-3 | E2e tap saved curated row reopens via getCuratedRouteDetail, no legs error. | AC-3 | same |
| TC-4 | E2e Unsave reflects 'Save' + removes row. | AC-4 | same |

## Reading List

- `convex/db/routeFeedback.ts` (1-60) — recordRouteFeedback('save')
- `hooks/use-is-route-saved.ts` (1-80) — saved-state check pattern
- `hooks/use-saved-routes.ts` (1-100) — legacy useSaveRoute (DO NOT reuse for curated)
- `app/(app)/(tabs)/saved-routes.tsx` + `saved-routes.components.tsx` — Saved list + SavedRouteCard
- `app/(app)/saved-route/[id].tsx` — reopen path
- `.spec/prds/mvp/07-uc-save.md`#uc-save-01 · `.spec/scenarios/UC-SAVE-01/`

## Guardrails

- WRITE-ALLOWED: `hooks/use-save-curated-route.ts (NEW)` · `app/(app)/(tabs)/saved-routes.tsx (MODIFY)` · `app/(app)/(tabs)/saved-routes.components.tsx (MODIFY)` · `app/(app)/saved-route/[id].tsx (MODIFY)` · `.maestro/save-curated.yaml (NEW)`
- WRITE-PROHIBITED: `convex/**` · `lib/**`

## Design

- ref: `.spec/prds/mvp/07-uc-save.md`#uc-save-01 · `.spec/scenarios/UC-SAVE-01/`
- pattern: hook-per-mutation (mirror use-is-route-saved + useSaveRoute structure, curated variant).
- pattern_source: `hooks/use-is-route-saved.ts`, `hooks/use-saved-routes.ts`
- anti_pattern: synthesizing legs; coercing curated rows through the legacy PlanInput path.
- interaction notes: lean curated preview = name + centroid + score + archetype (no synthesized legs). Save/Unsave control testID `save-curated-button`. *(No dedicated frontend-designer enrichment for this task — visual spec inherits SavedRouteCard's existing styling; the only new visual is the curated lean preview which reuses the route-card atom.)*

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E | `maestro test .maestro/save-curated.yaml` |
| Biome | `pnpm exec biome check hooks/use-save-curated-route.ts 'app/(app)/(tabs)/saved-routes.tsx' 'app/(app)/(tabs)/saved-routes.components.tsx' 'app/(app)/saved-route/[id].tsx'` |

## Coding Standards

- Theme tokens only; testID on Save/Unsave control; RED→GREEN→REFACTOR per AC.

## Dependencies

- Depends on: DATA-003, DATA-006, DESIGN-002
- Blocks: DESIGN-004

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "SAVE-001",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "auth_curated_unsaved": { "description": "authenticated user + curated route 'Wasatch Ridge Loop' not yet saved", "seed_method": "ui_flow", "records": ["signed-in user curated route detail open not in saved_routes"] },
    "convex_curated_bookmark": { "description": "live Convex dev saved_routes row written with curatedRouteRef only", "seed_method": "public_api", "records": ["saved_routes row curatedRouteRef set plan fields absent name 'Wasatch Ridge Loop'"] },
    "auth_curated_saved": { "description": "authenticated user with curated route already saved via curatedRouteRef (1 row)", "seed_method": "public_api", "records": ["1 saved_routes row with curatedRouteRef for this user"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a curated route open on detail WHEN the user taps Save THEN a saved_routes row with curatedRouteRef (planInput absent) is persisted, recordRouteFeedback('save') fires, control reads 'Saved'.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a saved curated row WHEN the user opens Saved THEN the curated route appears (lean preview) without crashing SavedRouteCard.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a saved curated row WHEN the user taps it THEN it reopens via getCuratedRouteDetail without a legs/PlanInput error.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a saved curated route WHEN the user taps Unsave THEN the control reads 'Save' and the row is removed.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Save persists curatedRouteRef, planInput absent.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Saved renders curated card without crash.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Reopen via getCuratedRouteDetail, no legs error.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Unsave toggles + removes row.", "verify": "maestro test .maestro/save-curated.yaml", "maps_to_ac": "AC-4" }
  ]
}
-->
