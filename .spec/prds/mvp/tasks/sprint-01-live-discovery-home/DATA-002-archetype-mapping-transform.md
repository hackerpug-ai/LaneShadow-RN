# DATA-002: Archetype mapping transform (UI enum ↔ DB enum) — pure helper

| Field | Value |
|---|---|
| Sprint | sprint-01-live-discovery-home |
| Agent | convex-implementer |
| Estimate | 60 min |
| Type | FEATURE |
| Status | Backlog |
| Proposed By | convex-planner |

## Background
The Discovery UI filter chips use UI archetypes {twisties|scenic|technical|cruising|sport|adventure} but the DB `primaryArchetype` union is {twisties|mountain|coastal|adventure|scenic_byway|desert} — only `twisties` and `adventure` overlap exactly. Without a mapping layer, archetype filters silently miss routes and cards render raw DB values. The fix is a PURE mapping transform applied in the read path (NOT a DB migration): UI archetype → set of DB archetypes for filtering, and DB primaryArchetype → UI archetype for the returned card.

## Critical Constraints
- MUST map in the read path; leave the DB enum untouched (non-destructive).
- MUST use the locked table: scenic→{scenic_byway,coastal}; technical→{mountain}; cruising→{scenic_byway}; sport→{twisties}; adventure→{adventure,desert}. Reverse: scenic_byway→scenic; coastal→scenic; mountain→technical; desert→adventure; twisties→twisties; adventure→adventure.
- MUST never return a raw DB-only value (mountain/desert/scenic_byway/coastal) to the client; every returned primaryArchetype is a UI enum.
- MUST be a pure deterministic function (zero I/O) — unit-tested.
- NEVER mutate any curated_routes document's primaryArchetype.

## Specification
**Objective:** A pure, deterministic UI↔DB archetype map used by `listCuratedRoutes`/`getCuratedRouteDetail` so filters work and cards always return UI enums.
**Success State:** Unit tests for the map are green; filtering by UI 'scenic' returns only routes whose DB archetype maps to scenic; sampled curated_routes primaryArchetype is byte-identical before/after.

## Acceptance Criteria
### AC-1: UI 'scenic' filter returns only mapped routes, all UI enums [PRIMARY]
**GIVEN** live Convex dev with all 6 DB archetypes present **WHEN** a client filters by UI archetype 'scenic' (through listCuratedRoutes once DATA-005 ships, or directly via the map helper over a sample) **THEN** only routes whose DB primaryArchetype ∈ {scenic_byway, coastal} are returned and every returned primaryArchetype is a UI enum (never a raw DB value), and no route is dropped for lacking an exact UI equivalent.
- test_tier: integration · verification_service: live Convex dev deployment
- verify: `cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{"archetypes":["scenic"],"limit":200}' | jq 'all(.primaryArchetype == "scenic")'`
- **Scenario:** start_ref→live_catalog; must_observe:[>=1 scenic route, all primaryArchetype=="scenic"]; must_not_observe:[raw scenic_byway/coastal/mountain/desert in output]; negative_control.would_fail_if:[map not applied, raw DB escapes, route dropped].

### AC-2: Pure deterministic map — unit tests [UNIT]
**GIVEN** the pure archetypeMap helper **WHEN** unit-tested across all UI and DB values **THEN** it is deterministic and zero-I/O (no query/mutation calls).
- test_tier: unit · unit_test_justified: pure transform, zero I/O; the integration AC-1 proves it is wired into the read path.
- verify: `pnpm test -- archetypeMap`
- **Scenario:** must_observe:[all 6 UI→DB and all 6 DB→UI mappings deterministic]; must_not_observe:[any I/O call]; negative_control.would_fail_if:[non-deterministic, hidden I/O].

### AC-3: DB value with no exact UI equivalent maps deterministically (no drop)
**GIVEN** routes with DB archetypes mountain/coastal/scenic_byway/desert (no exact UI name) **WHEN** returned **THEN** each maps to a deterministic UI bucket (mountain→technical, coastal→scenic, scenic_byway→scenic, desert→adventure) so no route is dropped.
- test_tier: integration · verify: query returns those routes with mapped UI enums.
- **Scenario:** must_observe:[mountain route returns primaryArchetype=="technical", etc.]; must_not_observe:[route dropped, raw value]; negative_control.would_fail_if:[drop-on-no-match].

### AC-4: No curated_routes mutation
**GIVEN** a sample of curated_routes primaryArchetype values **WHEN** the gate ships and is exercised **THEN** those values are byte-identical before/after.
- test_tier: integration · verify: sample N rows before, exercise queries, sample after, assert equal.
- **Scenario:** must_observe:[before == after for sampled rows]; must_not_observe:[any byte difference]; negative_control.would_fail_if:[write-back].

## Test Criteria
- **TC-1** (maps_to_ac AC-1): Filtering 'scenic' returns only mapped routes with UI-enum archetypes — verify: live query + jq assertion
- **TC-2** (maps_to_ac AC-2): The archetypeMap is pure + deterministic (unit green) — verify: `pnpm test -- archetypeMap`
- **TC-3** (maps_to_ac AC-3): DB-only values map deterministically (no drop) — verify: mapped routes returned
- **TC-4** (maps_to_ac AC-4): No curated_routes primaryArchetype mutated — verify: before/after sample byte-identical

## Reading List
- `server/models/curated-routes.ts` — primaryArchetype DB union
- `components/discovery/discovery-filter-bar.tsx` — UI archetype enum (twisties|scenic|technical|cruising|sport|adventure)
- PRD `.spec/prds/mvp/04-uc-data.md` UC-DATA-02; `09-technical-requirements/04-api-design.md` §Archetype map

## Guardrails
**Write Allowed:** `server/convex/util/archetypeMap.ts (NEW)` + unit test; import into `server/convex/curatedRoutes.ts` (DATA-005).
**Write Prohibited:** `server/models/curated-routes.ts` (DB enum read-only), `server/convex/schema.ts`.

## Code Pattern / Design
- Pattern: two exported pure fns — `uiArchetypeToDbSet(ui: UiArchetype): DbArchetype[]` and `dbArchetypeToUi(db: DbArchetype): UiArchetype`. O(1) lookup tables.
- Anti-pattern: mutating the DB enum; returning raw DB values; hiding I/O inside the "pure" helper.

## Agent Instructions (TDD)
RED: unit test the map for all 12 directions (fails: helper absent). GREEN: implement the lookup tables. Then integration-verify AC-1/AC-3/AC-4 against live Convex once DATA-005 consumes the helper.

## Dependencies
- depends_on: none
- blocks: DATA-005, DATA-006 (Sprint 3) — both queries consume the map

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{ "requirements": [ {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN all 6 DB archetypes WHEN filter UI 'scenic' THEN only {scenic_byway,coastal} routes, all UI enums, none dropped","verify":"cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{\"archetypes\":[\"scenic\"],\"limit\":200}' | jq 'all(.primaryArchetype == \"scenic\")'"}, {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN the pure archetypeMap WHEN unit-tested THEN deterministic and zero-I/O","verify":"pnpm test -- archetypeMap"}, {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN DB-only values (mountain/coastal/scenic_byway/desert) WHEN returned THEN mapped deterministically to a UI bucket, none dropped","verify":"mapped routes returned with UI enums"}, {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN sampled primaryArchetype values WHEN gate ships THEN byte-identical before/after","verify":"before/after sample equal"}, {"id":"TC-1","type":"test_criterion","description":"'scenic' filter returns only mapped routes with UI enums","maps_to_ac":"AC-1","verify":"live query + jq"}, {"id":"TC-2","type":"test_criterion","description":"archetypeMap pure + deterministic (unit green)","maps_to_ac":"AC-2","verify":"pnpm test -- archetypeMap"}, {"id":"TC-3","type":"test_criterion","description":"DB-only values map deterministically, no drop","maps_to_ac":"AC-3","verify":"mapped routes returned"}, {"id":"TC-4","type":"test_criterion","description":"No curated_routes primaryArchetype mutated","maps_to_ac":"AC-4","verify":"before/after byte-identical"} ] }
-->
