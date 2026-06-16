# DATA-004: State-normalize + length-clamp transforms in the read path (carried — verify)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** S · **Estimate:** 30 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** Pure transforms (util/dataNormalization.ts) plus their application in listCuratedRoutes. convex-implementer owns the query read path and can run both the unit suite and a live state-filter assertion against the known North-Carolina spelling split.  

## Outcome

A 'North Carolina' filter returns rows stored under both 'North-Carolina' and 'North Carolina' under one canonical spelling, and junk lengthMiles (0, >1000) is clamped/hidden — never rendered.

## Specification

util/dataNormalization.ts defines normalizeState (trim, dash/underscore→space, collapse whitespace, title-case), clampLength (returns mi only when 0 < mi ≤ ceiling=1000, else undefined), and stateVariants (returns canonical + dashed spelling variants for index probing). listCuratedRoutes uses stateVariants to probe by_state under both spellings (Mode 3), normalizeState in buildRouteCard for canonical return + matchesState comparison, and clampLength on lengthMiles in buildRouteCard. This task re-verifies the DATA-NORM gate per T-DATA-006 (both-spelling resolution, single canonical return, no junk length) and T-DATA-007 (purity + no write-back): (1) the pure unit suites stay green for both dirty spellings ('North-Carolina'/'North Carolina'→'North Carolina') and junk lengths (0, 710430, >1000→undefined; valid mid-range preserved); (2) listCuratedRoutes against live dev with state='North Carolina' returns routes from both variants (known split ~202 'North-Carolina' + ~43 'North Carolina') under one canonical spelling with all lengths sanitized; (3) a curated_routes sample is byte-identical pre/post.

## Critical Constraints

- VERIFY ONLY — dataNormalization.ts and its use in listCuratedRoutes are built. Correct only a proven defect bonded to a failing AC.
- NEVER write back to curated_routes — both transforms are read-path only (verify a DB sample is byte-identical pre/post).
- An absurd length (the 710,430mi outlier) or a 0mi length escaping to a card is a hard failure.
- UNIT_TEST_JUSTIFIED: normalizeState/clampLength/stateVariants are pure, zero-I/O — unit-tested; the APPLIED both-spelling-variant behavior requires a live listCuratedRoutes integration assertion.

## Acceptance Criteria

### AC-1: state filter resolves both dirty spellings under one canonical spelling
*(PRIMARY)*
- **GIVEN** live Convex dev where North Carolina rows are split across 'North-Carolina' and 'North Carolina'
- **WHEN** listCuratedRoutes is called with state='North Carolina'
- **THEN** routes from BOTH spelling variants are returned and every returned card's state === 'North Carolina' (single canonical spelling)
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts` → `stateFilterResolvesBothSpellingsCanonical`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: result count > 43 (proves the 202-row 'North-Carolina' variant is included, not just the 43-row 'North Carolina' variant); every returned state === 'North Carolina'
  - must NOT observe: 0 routes; any state === 'North-Carolina'; result count ≤ 43 (one variant dropped)
  - negative control (would fail if): query probes only one spelling so the 'North-Carolina' variant is dropped; raw mixed spellings escape to cards; query disconnected returns []

### AC-2: junk lengthMiles is clamped/hidden, valid lengths preserved
- **GIVEN** junk and valid length inputs
- **WHEN** clampLength runs
- **THEN** 0, negative, NaN, and >1000 return undefined; a valid mid-range length (e.g. 137) is preserved
- **Test tier:** `unit`
- **Verify:** `pnpm test server/convex/__tests__/dataNormalization.test.ts` → `clampLengthHidesJunkPreservesValid`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: >=1 route returned; every returned lengthMiles satisfies lengthMiles === undefined || (lengthMiles > 0 && lengthMiles <= 1000); >=1 card carries a real lengthMiles in (0, 1000] (a non-degenerate sanitized length, e.g. ~137)
  - must NOT observe: lengthMiles === 0; lengthMiles === 710430; lengthMiles > 1000; 0 routes; [] (empty result)
  - negative control (would fail if): clampLength is a no-op so the 710430mi outlier and 0mi lengths escape to cards unchanged; clamp is hardcoded/stubbed to always return undefined so a valid 137mi length is dropped; listCuratedRoutes is disconnected/empty and returns [] so no clamped lengthMiles is observable

### AC-3: normalizeState canonicalizes both dirty spellings; no DB write-back
- **GIVEN** the dirty spelling pair and a curated_routes sample on live dev
- **WHEN** normalizeState runs and the gate is exercised
- **THEN** 'North-Carolina' and 'North Carolina' both normalize to 'North Carolina', and the sampled DB state values are byte-identical pre/post
- **Test tier:** `integration` · **Service:** live Convex dev (curated_routes sample read before/after) + pure normalizeState
- **Verify:** `pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts` → `normalizeCanonicalAndNoWriteBack`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: normalizeState('North-Carolina') === 'North Carolina'; normalizeState('North Carolina') === 'North Carolina'; pre-sample === post-sample (all 20 state values byte-identical); 0 sampled state values changed
  - must NOT observe: 'North-Carolina' in normalized output; any sampled state changed; 0 rows sampled (empty sample); [] (empty pre- or post-sample)
  - negative control (would fail if): normalizeState is a no-op/identity so 'North-Carolina' and 'North Carolina' stay distinct; the gate writes back to curated_routes (mutates state) instead of being read-path only; state normalization is hardcoded to one spelling so the dashed variant is dropped, or the sample read is stubbed/static so a real pre-vs-post difference is masked

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: state='North Carolina' returns >43 rows under one canonical spelling — both dirty variants included (T-DATA-006). | AC-1 | `pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| TC-2 | Unit: clampLength hides 0/negative/NaN/>1000 and preserves a valid mid-range length (T-DATA-007). | AC-2 | `pnpm test server/convex/__tests__/dataNormalization.test.ts` |
| TC-3 | Integration + unit: normalizeState canonicalizes both spellings and the gate performs no curated_routes write-back (T-DATA-007). | AC-3 | `pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts` |

## Reading List

- `server/convex/util/dataNormalization.ts` (1-42) — PRIMARY PATTERN — normalizeState / clampLength / stateVariants under verification
- `server/convex/curatedRoutes.ts` (119-269) — buildRouteCard (normalizeState+clampLength) + Mode 3 by_state both-variant probe (248-269)
- `server/convex/__tests__/dataNormalization.test.ts` (1-200) — existing pure unit suite — extend, do not rewrite
- `.spec/prds/mvp/04-uc-data.md` (71-83) — UC-DATA-04 the NC split (202 vs 43) and length outliers (710430, 64 at 0)
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (49-50) — T-DATA-006 / T-DATA-007 pass/fail

## Guardrails

- WRITE-ALLOWED: `server/convex/__tests__/listCuratedRoutes.state.integration.test.ts (NEW)`
- WRITE-ALLOWED: `server/convex/__tests__/dataNormalization.test.ts (MODIFY — extend)`
- WRITE-ALLOWED: `server/convex/util/dataNormalization.ts (MODIFY — only a proven transform correction)`
- WRITE-ALLOWED: `server/convex/curatedRoutes.ts (MODIFY — only if application is found broken)`
- WRITE-PROHIBITED: server/convex/schema.ts
- WRITE-PROHIBITED: Any migration that mutates curated_routes.state or lengthMiles (write-back deferred)
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/04-uc-data.md#uc-data-04
- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- pattern: Read-path data sanitization: stateVariants probes both spellings via the by_state index (never .filter() for state); normalizeState canonicalizes the return; clampLength hides junk lengths.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test server/convex/__tests__/dataNormalization.test.ts` |
| gate | `pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| gate | `pnpm exec biome check server/convex/util/dataNormalization.ts server/convex/curatedRoutes.ts` |
| gate | `pnpm --dir server run convex:dev -- --once` |

## Coding Standards

- No .filter() for state — probe the by_state index over both spelling variants.
- Pure transforms stay zero-I/O; application happens once at the query boundary.
- Read-path only — no write-back to curated_routes.

## Dependencies

- Depends on: DATA-001
- Blocks: DATA-005, DATA-008 (chat-driven state intent relies on both-spelling resolution)
- Parallel: DATA-002

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog including the North Carolina spelling split (~202 'North-Carolina' + ~43 'North Carolina')",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes with both NC spellings; rows with lengthMiles 0, >1000, and valid values"
      ]
    },
    "length_inputs": {
      "description": "representative junk and valid length values",
      "seed_method": "cli",
      "records": [
        "137 (valid)",
        "0 (junk)",
        "710430 (outlier)",
        "-5 (negative)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the NC spelling split WHEN listCuratedRoutes state='North Carolina' THEN both variants returned under one canonical spelling (count > 43)",
      "verify": "pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN junk+valid lengths WHEN clampLength runs THEN 0/neg/NaN/>1000\u2192undefined, valid preserved",
      "verify": "pnpm test server/convex/__tests__/dataNormalization.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN dirty spellings + DB sample WHEN normalize/exercise THEN both\u2192canonical, no write-back",
      "verify": "pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "both-spelling resolution + canonical return (T-DATA-006)",
      "verify": "pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "length-clamp pure transform (T-DATA-007)",
      "verify": "pnpm test server/convex/__tests__/dataNormalization.test.ts",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "state-normalize pure + no write-back (T-DATA-007)",
      "verify": "pnpm test server/convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": "AC-3"
    }
  ]
}
-->
