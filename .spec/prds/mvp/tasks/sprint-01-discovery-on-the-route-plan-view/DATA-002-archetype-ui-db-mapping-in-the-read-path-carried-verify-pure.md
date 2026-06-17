# DATA-002: Archetype UI↔DB mapping in the read path (carried — verify pure + applied)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P0 · **Effort:** S · **Estimate:** 30 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** Pure transform (util/archetypeMap.ts) plus its application inside listCuratedRoutes — Convex query-layer behavior. convex-implementer owns both the transform and the query and can run the unit suite plus a live listCuratedRoutes assertion.  

## Outcome

listCuratedRoutes filters scenic→{scenic_byway,coastal}, technical→{mountain}, cruising→{scenic_byway}, sport→{twisties}, adventure→{adventure,desert} and always returns a UI-enum primaryArchetype (never a raw DB value).

## Specification

util/archetypeMap.ts defines UI_TO_DB (scenic→[scenic_byway,coastal], technical→[mountain], cruising→[scenic_byway], sport→[twisties], adventure→[adventure,desert], twisties→[twisties]) and DB_TO_UI (scenic_byway→scenic, coastal→scenic, mountain→technical, desert→adventure, twisties→twisties, adventure→adventure), matching the locked archetype table in 04-api-design.md. listCuratedRoutes (curatedRoutes.ts) expands args.archetypes via uiArchetypeToDbSet into dbArchetypeSet for geo filterKeys / post-load matchesArchetype, and buildRouteCard maps DB→UI via dbArchetypeToUi for the returned primaryArchetype. This task re-verifies the ARCHETYPE-ALIGN gate per T-DATA-003 (filter correctness + UI-enum return + no-drop) and T-DATA-004 (purity + no DB mutation): (1) the existing pure unit suite stays green; (2) listCuratedRoutes against live dev with archetypes=['scenic'] returns only routes whose DB primaryArchetype is scenic_byway/coastal, every returned primaryArchetype is a valid UI enum; (3) a sample of curated_routes primaryArchetype values is byte-identical before and after (no write-back). The exact mapping table is the implementer's to ratify against 04-api-design; the stance (map in read path, never mutate DB) is locked.

## Critical Constraints

- VERIFY ONLY — archetypeMap.ts and its use in curatedRoutes.ts are built. Do NOT rewrite; correct only a proven mapping defect bonded to a failing AC.
- NEVER mutate any curated_routes document's primaryArchetype — mapping is read-path only (verify a DB sample is byte-identical pre/post).
- A raw DB-only value (mountain/coastal/scenic_byway/desert) returned to the client is a hard failure — every card's primaryArchetype MUST be a UI enum.
- UNIT_TEST_JUSTIFIED: uiArchetypeToDbSet / dbArchetypeToUi are pure, zero-I/O transforms — unit tests are justified for the transform; the APPLIED behavior still requires an integration assertion via listCuratedRoutes.

## Acceptance Criteria

### AC-1: scenic filter returns only scenic-mapped routes with UI-enum archetypes
*(PRIMARY)*
- **GIVEN** the seeded live Convex dev catalog
- **WHEN** listCuratedRoutes is called with archetypes=['scenic']
- **THEN** every returned route's source DB primaryArchetype ∈ {scenic_byway,coastal} and every returned primaryArchetype === 'scenic' (a UI enum, never a raw DB value)
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` → `scenicFilterReturnsOnlyScenicMappedUiEnumRoutes`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: ≥1 route returned; every returned primaryArchetype === 'scenic'
  - must NOT observe: primaryArchetype === 'scenic_byway'; primaryArchetype === 'coastal'; primaryArchetype === 'mountain'; primaryArchetype === 'desert'; 0 routes
  - negative control (would fail if): mapping is a no-op returning raw DB values; filter not applied so non-scenic routes leak; query disconnected/empty returns []

### AC-2: DB-only archetypes deterministically bucket to a UI enum (no route dropped)
- **GIVEN** DB archetypes with no exact UI equivalent (mountain, coastal, scenic_byway, desert)
- **WHEN** dbArchetypeToUi maps each
- **THEN** mountain→technical, coastal→scenic, scenic_byway→scenic, desert→adventure deterministically — every DB value resolves to a UI enum
- **Test tier:** `unit`
- **Verify:** `pnpm test convex/__tests__/archetypeMap.test.ts` → `dbArchetypeToUi`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: >=1 route returned; every returned primaryArchetype === 'technical'
  - must NOT observe: primaryArchetype === 'mountain'; primaryArchetype === undefined; 0 routes; [] (empty result)
  - negative control (would fail if): the archetype map is a no-op returning raw DB values (mountain/coastal/scenic_byway/desert) so primaryArchetype is not a UI enum; dbArchetypeToUi is hardcoded/stubbed to a single spelling so some DB values map to undefined and routes are dropped; listCuratedRoutes is disconnected/empty and returns [] so no mapped result is observable

### AC-3: no curated_routes primaryArchetype mutated by the gate
- **GIVEN** a sample of curated_routes rows on live dev
- **WHEN** the mapping gate is exercised via listCuratedRoutes
- **THEN** the sampled DB primaryArchetype values are byte-identical before and after (read-path only, no write-back)
- **Test tier:** `integration` · **Service:** live Convex dev (curated_routes sample read before/after)
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` → `gatePerformsNoDbWriteBack`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: pre-sample === post-sample (all 20 primaryArchetype values byte-identical); 0 sampled primaryArchetype values changed
  - must NOT observe: any sampled primaryArchetype changed; 0 rows sampled (empty sample); [] (empty pre- or post-sample)
  - negative control (would fail if): the mapping gate writes back to curated_routes (mutates primaryArchetype) instead of being read-path only; a migration is hardcoded to normalize the stored DB enum so the sampled rows differ pre/post; the sample read is stubbed/static so a real pre-vs-post difference is masked

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: listCuratedRoutes archetypes=['scenic'] returns only scenic-mapped routes, all primaryArchetype UI enums, no route dropped (T-DATA-003). | AC-1 | `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` |
| TC-2 | Unit: archetype map is a pure deterministic transform, all DB values bucket to a UI enum (T-DATA-004). | AC-2 | `pnpm test convex/__tests__/archetypeMap.test.ts` |
| TC-3 | Integration: sampled curated_routes primaryArchetype byte-identical pre/post — no write-back (T-DATA-004). | AC-3 | `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` |

## Reading List

- `convex/util/archetypeMap.ts` (1-35) — PRIMARY PATTERN — UI_TO_DB / DB_TO_UI tables and the two pure functions under verification
- `convex/curatedRoutes.ts` (119-282) — buildRouteCard DB→UI mapping (line 124) + dbArchetypeSet expansion/matchesArchetype application
- `convex/__tests__/archetypeMap.test.ts` (1-96) — existing pure unit suite — extend, do not rewrite
- `.spec/prds/mvp/09-technical-requirements/04-api-design.md` (101-111) — locked archetype map table (authoritative)
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (36-37) — T-DATA-003 / T-DATA-004 pass/fail

## Guardrails

- WRITE-ALLOWED: `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts (NEW)`
- WRITE-ALLOWED: `convex/__tests__/archetypeMap.test.ts (MODIFY — extend)`
- WRITE-ALLOWED: `convex/util/archetypeMap.ts (MODIFY — only a proven mapping correction)`
- WRITE-ALLOWED: `convex/curatedRoutes.ts (MODIFY — only if application logic is found broken)`
- WRITE-PROHIBITED: convex/schema.ts — DB enum is untouched
- WRITE-PROHIBITED: Any migration that mutates curated_routes.primaryArchetype
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/04-uc-data.md#uc-data-02
- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- pattern: Pure read-path archetype translation: UI→DB set for filtering, DB→UI for the returned card; DB enum immutable.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test convex/__tests__/archetypeMap.test.ts` |
| gate | `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` |
| gate | `pnpm exec biome check convex/util/archetypeMap.ts convex/curatedRoutes.ts` |
| gate | `pnpm --dir server run convex:dev -- --once` |

## Coding Standards

- Validator-first: returnValidator already specifies primaryArchetype: v.string() (UI enum) — keep the contract.
- Composition: keep the mapping a pure function, applied once at the query boundary.
- No DB mutation in a read-path gate.

## Dependencies

- Depends on: DATA-001 (seeded points for the bbox/archetype path)
- Blocks: DATA-005, DATA-008b (the tool maps the same UI archetypes)
- Parallel: DATA-004

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog + seeded geospatial points",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes spanning DB archetypes scenic_byway/coastal/mountain/desert/twisties/adventure"
      ]
    },
    "archetype_inputs": {
      "description": "representative UI and DB archetype literals for the pure transform",
      "seed_method": "cli",
      "records": [
        "UI: scenic, technical, cruising, sport, adventure, twisties",
        "DB: scenic_byway, coastal, mountain, desert, twisties, adventure"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN live dev catalog WHEN listCuratedRoutes archetypes=['scenic'] THEN only scenic_byway/coastal-sourced routes return, every primaryArchetype === 'scenic'",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN DB-only archetypes WHEN dbArchetypeToUi maps THEN each deterministically resolves to a UI enum (mountain\u2192technical etc.)",
      "verify": "pnpm test convex/__tests__/archetypeMap.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN curated_routes sample WHEN gate exercised THEN DB primaryArchetype values byte-identical pre/post",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "scenic filter correctness + UI-enum return + no-drop (T-DATA-003)",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "pure deterministic archetype map (T-DATA-004)",
      "verify": "pnpm test convex/__tests__/archetypeMap.test.ts",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "no DB write-back (T-DATA-004)",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts",
      "maps_to_ac": "AC-3"
    }
  ]
}
-->
