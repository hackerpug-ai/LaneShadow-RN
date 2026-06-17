# DATA-004: State-normalize + length-clamp pure transforms (read path, no write-back)

| Field | Value |
|---|---|
| Sprint | sprint-01-live-discovery-home |
| Agent | convex-implementer |
| Estimate | 90 min |
| Type | FEATURE |
| Status | Backlog |
| Proposed By | convex-planner |

## Background
Live data is dirty in two verified ways: (1) 9 states appear under two spellings (e.g. "North-Carolina" 202 vs "North Carolina" 43), so a naive `by_state` equality filter silently drops ~18% of NC routes; (2) `lengthMiles` has outliers — 41 routes >1000mi (max 710,430) and 64 at exactly 0 — which would render as absurd "710,430 mi" or "0 mi". The fix is two PURE transforms applied in the READ PATH (not a write-back migration): a state-normalize that canonicalizes both query-side (filter matches both spellings) and return-side (one canonical spelling), and a length-clamp that returns undefined for non-positive or above-ceiling values.

## Critical Constraints
- MUST normalize state both query-side (a "North Carolina" filter matches both "North-Carolina" and "North Carolina") and return-side (cards return one canonical spelling, e.g. replace '-' with ' ').
- MUST clamp lengthMiles: values <=0 or >1000 return undefined (never rendered as 710,430 or 0).
- MUST be pure deterministic transforms (zero I/O), unit-tested.
- MUST perform no write-back to curated_routes (write-back cleanup is a deferred fast-follow).
- NEVER let a junk length (>1000 or <=0) or a dirty state spelling escape to the client.

## Specification
**Objective:** Pure state-normalize + length-clamp transforms applied in the read path so state filters return both spellings under one canonical form and no absurd length renders.
**Success State:** Filtering "North Carolina" returns >240 rows (both variants) all labeled "North Carolina"; no card shows lengthMiles >1000 or <=0; sampled DB state+lengthMiles byte-identical before/after (no write-back).

## Acceptance Criteria
### AC-1: State filter matches both spelling variants, canonical output [PRIMARY]
**GIVEN** live Convex dev with "North-Carolina" (202) and "North Carolina" (43) **WHEN** a client filters by state "North Carolina" **THEN** the result includes routes stored under BOTH spellings (count > 240) and every returned state is the canonical "North Carolina".
- test_tier: integration · verification_service: live Convex dev deployment
- verify: `cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{"state":"North Carolina","limit":200}' | jq 'length > 240 and all(.state == "North Carolina")'`
- **Scenario:** start_ref→known_double_spelled_state; must_observe:[length > 240, all .state == "North Carolina"]; must_not_observe:[length <= 243 (one variant only), "North-Carolina" in output]; negative_control.would_fail_if:[normalize absent, one variant dropped].

### AC-2: No absurd lengthMiles escapes
**GIVEN** live Convex dev with 41 routes >1000mi (max 710,430) and 64 at 0 **WHEN** cards are returned **THEN** no card has lengthMiles >1000 or <=0 (undefined is allowed/hidden).
- test_tier: integration · verify: `... listCuratedRoutes --args='{"limit":200}' | jq '[.[] | .lengthMiles | select(. != null and (. > 1000 or . <= 0))] | length == 0'`
- **Scenario:** must_observe:[no lengthMiles >1000 or <=0 across result]; must_not_observe:[710430 or 0 as lengthMiles]; negative_control.would_fail_if:[clamp absent].

### AC-3: Pure deterministic transforms — unit tests [UNIT]
**GIVEN** the pure state-normalize and length-clamp helpers **WHEN** unit-tested **THEN** both are deterministic and zero-I/O.
- test_tier: unit · unit_test_justified: pure transforms, zero I/O; integration AC-1/AC-2 prove wiring.
- verify: `pnpm test -- dataNormalization`
- **Scenario:** must_observe:[normalize("North-Carolina")=="North Carolina", clamp(710430)==undefined, clamp(0)==undefined, clamp(45)==45]; must_not_observe:[non-determinism, I/O]; negative_control.would_fail_if:[impure].

### AC-4: No write-back to curated_routes
**GIVEN** sampled curated_routes state + lengthMiles values **WHEN** the gate ships and is exercised **THEN** those values are byte-identical before/after.
- test_tier: integration · verify: sample before, exercise, sample after, assert equal.
- **Scenario:** must_observe:[before == after]; must_not_observe:[any byte difference]; negative_control.would_fail_if:[write-back].

## Test Criteria
- **TC-1** (maps_to_ac AC-1): State "North Carolina" returns both spellings (>240) canonicalized — verify: live query + jq
- **TC-2** (maps_to_ac AC-2): No lengthMiles >1000 or <=0 escapes — verify: live query + jq
- **TC-3** (maps_to_ac AC-3): state-normalize + length-clamp are pure + deterministic — verify: `pnpm test -- dataNormalization`
- **TC-4** (maps_to_ac AC-4): No curated_routes state/lengthMiles mutated — verify: before/after byte-identical

## Reading List
- `server/models/curated-routes.ts` — state, lengthMiles fields
- `convex/schema.ts` — `by_state` index
- PRD `.spec/prds/mvp/04-uc-data.md` UC-DATA-04; `09-technical-requirements/03-data-schema.md`

## Guardrails
**Write Allowed:** `convex/util/dataNormalization.ts (NEW)` + unit test; import into `convex/curatedRoutes.ts` (DATA-005).
**Write Prohibited:** `server/models/curated-routes.ts`, `convex/schema.ts` (no write-back, no index change).

## Code Pattern / Design
- Pattern: `normalizeState(s: string): string` = trim + replace(/-/g,' ') + title-case; `clampLength(mi: number | undefined, ceiling=1000): number | undefined` = undefined if mi==null || mi<=0 || mi>ceiling else mi. For state filtering, probe `by_state` for BOTH the raw input and the dash-variant(s).
- Anti-pattern: writing normalized values back to curated_routes; returning 710430/0; mutating the catalog at rest.

## Agent Instructions (TDD)
RED: unit tests for normalizeState/clampLength (fail: helpers absent). GREEN: implement. Integration-verify AC-1/AC-2/AC-4 against live Convex once DATA-005 consumes the helpers.

## Dependencies
- depends_on: none
- blocks: DATA-005, DATA-006 (Sprint 3) — both queries apply the transforms

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{ "requirements": [ {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN both NC spellings WHEN filter 'North Carolina' THEN both variants returned (>240) canonicalized","verify":"cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{\"state\":\"North Carolina\",\"limit\":200}' | jq 'length > 240 and all(.state == \"North Carolina\")'"}, {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN 41 routes >1000mi and 64 at 0 WHEN cards returned THEN none has lengthMiles >1000 or <=0","verify":"listCuratedRoutes limit=200 | jq 'no lengthMiles >1000 or <=0'"}, {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN the pure helpers WHEN unit-tested THEN deterministic and zero-I/O","verify":"pnpm test -- dataNormalization"}, {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN sampled state+lengthMiles WHEN gate ships THEN byte-identical before/after","verify":"before/after sample equal"}, {"id":"TC-1","type":"test_criterion","description":"State 'North Carolina' returns both spellings canonicalized","maps_to_ac":"AC-1","verify":"live query + jq"}, {"id":"TC-2","type":"test_criterion","description":"No lengthMiles >1000 or <=0 escapes","maps_to_ac":"AC-2","verify":"live query + jq"}, {"id":"TC-3","type":"test_criterion","description":"state-normalize + length-clamp pure + deterministic","maps_to_ac":"AC-3","verify":"pnpm test -- dataNormalization"}, {"id":"TC-4","type":"test_criterion","description":"No curated_routes state/lengthMiles mutated","maps_to_ac":"AC-4","verify":"before/after byte-identical"} ] }
-->
