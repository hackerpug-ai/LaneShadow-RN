# DATA-003: Add optional curatedRouteRef to saved_routes (additive; make plan-payload fields optional + XOR-validate)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** S · **Estimate:** 120 min
**Agent:** convex-implementer
**Proposed By:** convex-planner
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes
**Agent rationale:** convex-implementer owns the Convex schema + save mutations; this task evolves savedRouteValidator non-destructively, adds XOR validation in the save mutation, verified by integration tests against live dev.

## Outcome

saved_routes can store either a planned-route save (planInput + routeSnapshot + routeIndex) or a curated-route bookmark (curatedRouteRef). Existing rows remain valid without backfill. A write with neither or both is rejected.

## Specification

Evolve `savedRouteValidator` so planInput, routeSnapshot, routeIndex become `v.optional(...)`, and add `curatedRouteRef: v.optional(v.id('curated_routes'))`. In the save mutation, after auth, compute `hasCurated = !!args.curatedRouteRef` and `hasPlanned = !!(args.planInput && args.routeSnapshot && args.routeIndex)`, then throw `ConvexError` (code VALIDATION_ERROR) unless exactly one is true. Schema evolution stance: add optional → ship (non-destructive).

## Critical Constraints

- MUST add `curatedRouteRef: v.optional(v.id('curated_routes'))` to savedRouteValidator.
- MUST make planInput, routeSnapshot, routeIndex `v.optional` (existing planned saves keep working).
- MUST validate XOR at write time: exactly one of (curatedRouteRef) OR (planInput+routeSnapshot+routeIndex) is true.
- NEVER delete/rewrite existing saved_routes documents. NEVER persist a row with neither curatedRouteRef nor a planned payload. NEVER mock ctx.db.

## Acceptance Criteria

### AC-1: schema deploys non-destructively; existing rows remain valid
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DATA-03/core-curatedrouteref-field`
- **GIVEN** a live dev deployment with existing saved_routes rows (full planned payload, no curatedRouteRef)
- **WHEN** the schema adds optional curatedRouteRef + makes plan-payload fields optional
- **THEN** `pnpm convex:dev --once` succeeds; validated row count == existing count (no backfill); existing planInput.start.lat == seeded value (unchanged)
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts`
- **Scenario** (start `convex_existing_planned_save`): must observe validated count == existing, planInput.start.lat unchanged; must NOT observe validation error / row deletion / empty signature; would fail if schema change required existing rows to change.

### AC-2: curated bookmark persisted with curatedRouteRef only
- **GIVEN** a curated_routes document (_id 'k123') and an authenticated user
- **WHEN** the save mutation receives `{ curatedRouteRef: 'k123', name: 'Bookmarked Route' }` with no planInput/routeSnapshot/routeIndex
- **THEN** a new row has curatedRouteRef == 'k123', planInput == undefined, routeSnapshot == undefined
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts`
- **Scenario** (start `convex_polyline_route`): must observe curatedRouteRef == 'k123', planInput == undefined; must NOT observe fabricated planInput; would fail if mutation auto-generates fake planInput.

### AC-3: planned save still works with full payload
- **GIVEN** an authenticated user + a complete planned payload
- **WHEN** the save mutation receives planInput + routeSnapshot + routeIndex (no curatedRouteRef)
- **THEN** the new row has routeSnapshot.provider == 'mapbox', routeIndex.routeFingerprint == seeded, curatedRouteRef == undefined
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts`
- **Scenario** (start `convex_existing_planned_save`): must observe routeSnapshot.provider == 'mapbox', curatedRouteRef == undefined; would fail if plan fields still treated as required.

### AC-4: write with NEITHER curatedRouteRef NOR planned payload is rejected
- **flow_ref:** `.spec/scenarios/UC-DATA-03/edge-xor-validation`
- **GIVEN** a save request with only name/ownerType/ownerId
- **WHEN** the save mutation receives neither curatedRouteRef nor plan-payload fields
- **THEN** error.code == 'VALIDATION_ERROR' AND saved_routes row count for owner == 0 after the rejected call
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts`
- **Scenario** (start `convex_existing_planned_save`): must observe error.code == 'VALIDATION_ERROR', count == 0; would fail if empty save is accepted or validation is client-side only.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Existing saved_routes rows validate after schema evolution without backfill. | AC-1 | `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts` |
| TC-2 | A curated bookmark persists with only curatedRouteRef (no fabricated payload). | AC-2 | same |
| TC-3 | A planned-route save still works with all original fields. | AC-3 | same |
| TC-4 | Saving with neither curatedRouteRef nor planned payload throws and writes nothing. | AC-4 | same |

## Reading List

- `convex/schema.ts` (54-58) — saved_routes indexes + validator usage
- `shared/models/saved-routes.ts` (367-392) — savedRouteValidator fields to evolve
- `convex/guards.ts` (1-29) — requireIdentity for write guards
- `convex/_generated/ai/guidelines.md` — validator-first + migration-safety rules
- `.spec/prds/mvp/04-uc-data.md`#uc-data-03

## Guardrails

- WRITE-ALLOWED: `convex/schema.ts (MODIFY — add optional curatedRouteRef + make plan-payload optional + add curated index)` · `shared/models/saved-routes.ts (MODIFY — savedRouteValidator)` · `convex/__tests__/savedRoutesCuratedRef.integration.test.ts (NEW)`
- WRITE-PROHIBITED: any migration script that rewrites existing rows · client save code outside scope

## Design

- ref: `.spec/prds/mvp/04-uc-data.md`#uc-data-03 · `.spec/scenarios/UC-DATA-03/`
- pattern: keep a single flat document shape with optional fields + runtime XOR validation; compute hasCurated/hasPlanned booleans and throw VALIDATION_ERROR unless exactly one is true.
- pattern_source: `shared/models/saved-routes.ts:savedRouteValidator`
- anti_pattern: do NOT use a union type at the table level (would force migrating existing rows).

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| Integration vs live Convex | `pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts` |
| Biome | `pnpm exec biome check convex/schema.ts shared/models/saved-routes.ts` |
| Convex build | `pnpm convex:dev --once` |

## Coding Standards

- Validator-first; schema evolution = add optional → ship.
- Integration tests against live Convex dev — no ctx.db mocks.

## Dependencies

- Depends on: (none)
- Blocks: SAVE-001

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DATA-003",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "convex_existing_planned_save": { "description": "existing saved_routes row with full planned payload (routeSnapshot.provider 'mapbox') pre-schema-change", "seed_method": "migration_fixture", "records": ["saved_routes row planInput+routeSnapshot+routeIndex present no curatedRouteRef"] },
    "convex_polyline_route": { "description": "live Convex dev curated_routes row used as the curatedRouteRef target (_id k123)", "seed_method": "public_api", "records": ["curated_routes _id k123"] },
    "convex_curated_bookmark": { "description": "saved_routes row written with curatedRouteRef only", "seed_method": "public_api", "records": ["saved_routes row curatedRouteRef set plan fields absent"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN existing saved_routes rows WHEN the schema adds optional curatedRouteRef + optional plan-payload THEN convex:dev --once succeeds and existing rows remain valid without backfill.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a curated_routes document WHEN the save mutation receives curatedRouteRef only THEN a saved_routes row is created with curatedRouteRef set and no fabricated planInput/routeSnapshot/routeIndex.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a complete planned payload WHEN the save mutation receives no curatedRouteRef THEN a row is created with planInput/routeSnapshot/routeIndex populated and curatedRouteRef undefined.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a save request with only metadata WHEN neither curatedRouteRef nor plan-payload is provided THEN the mutation rejects VALIDATION_ERROR and writes no row.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "non-destructive schema evolution on existing rows.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "curated bookmark persistence.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "planned save still functions.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "rejection of empty save.", "verify": "pnpm test convex/__tests__/savedRoutesCuratedRef.integration.test.ts", "maps_to_ac": "AC-4" }
  ]
}
-->
