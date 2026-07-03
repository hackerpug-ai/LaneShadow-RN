# REDHAT-FIX-002: DATA-002/004 AC-3: add the two missing DB write-back purity tests

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 90 min
**Agent:** convex-implementer
**Proposed By:** convex-planner
**TDD Mode:** red_first · **RED/GREEN Required:** yes
**Agent rationale:** The archetype map and state-normalize transforms are pure read-path functions, but their DB write-back safety (DATA-002 AC-3, DATA-004 AC-3) was never proven with a live integration test. convex-implementer owns the query layer and can run the before/after sampling pattern against live dev.

> **Source:** [red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md) — HIGH findings #3 + #4.

## Outcome

Live Convex integration tests prove the archetype and state-normalization gates are read-path only — zero sampled DB mutations across 20 `curated_routes` rows before and after exercising each gate.

## Specification

Create two new live-Convex integration test files that prove the archetype gate and state-normalization gate perform NO DB write-back (read-path purity):

**File 1:** `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` containing `gatePerformsNoDbWriteBack`:
- Sample 20 `curated_routes` rows, read their `primaryArchetype` values (pre-sample)
- Exercise the archetype gate via `listCuratedRoutes` with `archetypes=['scenic']`
- Re-read the same 20 rows' `primaryArchetype` values (post-sample)
- Assert all 20 are byte-identical (zero mutations)

**File 2:** `convex/__tests__/listCuratedRoutes.state.integration.test.ts` containing `normalizeCanonicalAndNoWriteBack`:
- Assert `normalizeState('North-Carolina') === 'North Carolina'` and `normalizeState('North Carolina') === 'North Carolina'`
- Sample 20 `curated_routes` rows, read their `state` values (pre-sample)
- Exercise the state-normalization gate via `listCuratedRoutes` with `state='North Carolina'`
- Re-read the same 20 rows' `state` values (post-sample)
- Assert all 20 are byte-identical (zero mutations)

Both tests run via the existing `npx convex run` live pattern and use an internal helper action when needed to bypass the Clerk gate for read-only verification.

## Critical Constraints

- **MUST** create exactly two new test files and modify no implementation or schema files.
- **NEVER** modify `convex/curatedRoutes.ts`, `convex/util/archetypeMap.ts`, `convex/util/dataNormalization.ts`, or `convex/schema.ts`.
- **NEVER** mutate any `curated_routes` document's `primaryArchetype` or `state` — both transforms are read-path only (verify a DB sample is byte-identical pre/post).
- **MUST** sample and compare real DB rows on live Convex dev; mocked-ctx tests alone are insufficient.
- **MUST** assert byte-identical stored values before and after exercising the gate (all 20 of 20 unchanged).

## Acceptance Criteria

### AC-1: no curated_routes primaryArchetype mutated by the archetype gate
*(PRIMARY)*
- **GIVEN** a sample of 20 `curated_routes` rows on live dev
- **WHEN** the archetype mapping gate is exercised via `listCuratedRoutes` with `archetypes=['scenic']`
- **THEN** the sampled DB `primaryArchetype` values are byte-identical before and after (read-path only, no write-back)
- **Test tier:** `integration` · **Service:** live Convex dev (curated_routes sample read before/after)
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts -t gatePerformsNoDbWriteBack`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: all 20 of 20 `primaryArchetype` values byte-identical pre vs post; changed count `=== 0`
  - must NOT observe: any of the 20 values differs; sample size `=== 0` (empty); `[]` empty pre- or post-sample
  - negative control (would fail if): the mapping gate writes back to `curated_routes`; a migration normalizes the stored DB enum so rows differ pre/post; the sample read is stubbed/static so a real pre-vs-post difference is masked

### AC-2: normalizeState canonicalizes both spellings; no DB write-back
- **GIVEN** the dirty spelling pair and a sample of 20 `curated_routes` rows on live dev
- **WHEN** `normalizeState` runs and the state-normalization gate is exercised via `listCuratedRoutes` with `state='North Carolina'`
- **THEN** `normalizeState('North-Carolina') === 'North Carolina'` and `normalizeState('North Carolina') === 'North Carolina'`, and the sampled DB `state` values are byte-identical before and after
- **Test tier:** `integration` · **Service:** live Convex dev (curated_routes sample read before/after) + pure `normalizeState`
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts -t normalizeCanonicalAndNoWriteBack`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: `normalizeState('North-Carolina') === 'North Carolina'` (literal match); `normalizeState('North Carolina') === 'North Carolina'` (literal match); all 20 of 20 `state` values byte-identical pre vs post; changed count `=== 0`
  - must NOT observe: `normalizeState` returns `'North-Carolina'` (no-op); any of the 20 `state` values differs; sample size `=== 0`; `[]` empty sample
  - negative control (would fail if): `normalizeState` is a no-op/identity so `'North-Carolina'` stays distinct; the gate writes back to `curated_routes`; the sample read is stubbed/static

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: sampled `curated_routes` `primaryArchetype` byte-identical pre/post — no write-back (T-DATA-004). | AC-1 | `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` |
| TC-2 | Integration + unit: `normalizeState` canonicalizes both spellings and the gate performs no `curated_routes` write-back (T-DATA-007). | AC-2 | `pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| TC-3 | Only the two new test files appear in git diff; no implementation or schema files are modified. | AC-1 | `git diff --name-only` |

## Reading List

- `convex/util/archetypeMap.ts` (1-35) — PRIMARY PATTERN — pure `UI_TO_DB` / `DB_TO_UI` tables and functions
- `convex/util/dataNormalization.ts` (1-42) — PRIMARY PATTERN — `normalizeState` / `stateVariants` / `clampLength`
- `convex/curatedRoutes.ts` (119-282) — `buildRouteCard` where the archetype + state gates are applied on the read path
- `convex/__tests__/listCuratedRoutes.integration.test.ts` (160-187) — existing `npx convex run` live execution helper pattern
- `.spec/reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md` (43-55) — the two HIGH findings this task closes

## Guardrails

- WRITE-ALLOWED: `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts (NEW)`
- WRITE-ALLOWED: `convex/__tests__/listCuratedRoutes.state.integration.test.ts (NEW)`
- WRITE-PROHIBITED: `convex/curatedRoutes.ts`, `convex/schema.ts`, `convex/util/archetypeMap.ts`, `convex/util/dataNormalization.ts`
- WRITE-PROHIBITED: Any migration that mutates `curated_routes.primaryArchetype` or `curated_routes.state`
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: `convex/__tests__/listCuratedRoutes.integration.test.ts:160-187` (existing live execution pattern)
- ref: `.spec/prds/mvp/04-uc-data.md` (71-83) — UC-DATA-04 the NC split
- pattern: Live-Convex before/after sampling test: snapshot real rows, exercise the read gate, re-read identical rows, assert zero mutation.
- anti-pattern: Unit tests with mocked `ctx` that can hide a mutation bug or a write-back in production code.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check convex/__tests__/listCuratedRoutes.archetype.integration.test.ts convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| convex dev | `pnpm --dir server run convex:dev -- --once` |
| scope | `git diff --name-only ⊆ write_allowed` |

## Coding Standards

- Use the existing `npx convex run` live execution pattern from `listCuratedRoutes.integration.test.ts`.
- Sample rows by reading `curated_routes` directly through an internal/action helper when Clerk gating would reject a public query.
- Compare exact stored string values by `_id`; do not rely on counts or approximate matching.
- Keep tests focused on one gate each; no cross-assertions between archetype and state behavior.

## Dependencies

- Depends on: DATA-002, DATA-004 (the transforms under verification — both Completed)
- Blocks: (none)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-002",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev deployment populated with curated_routes rows that contain primaryArchetype and state strings in their authoritative stored forms",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes rows with primaryArchetype stored as DB enum values (e.g. twisties, mountain, coastal, scenic_byway, desert, adventure)",
        "curated_routes rows with state stored as canonical strings (e.g. 'North Carolina')"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a sample of 20 curated_routes rows on live dev WHEN the archetype mapping gate is exercised via listCuratedRoutes THEN the sampled DB primaryArchetype values are byte-identical before and after (read-path only, no write-back)",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts -t gatePerformsNoDbWriteBack",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["pre-sample === post-sample (all 20 primaryArchetype values byte-identical)", "0 sampled primaryArchetype values changed"],
        "must_not_observe": ["any sampled primaryArchetype changed", "0 rows sampled (empty sample)", "[] (empty pre- or post-sample)"],
        "negative_control": { "would_fail_if": ["the mapping gate writes back to curated_routes", "a migration normalizes the stored DB enum so rows differ pre/post", "the sample read is stubbed/static so a real pre-vs-post difference is masked"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["sample 20 curated_routes rows, snapshot primaryArchetype per _id", "call listCuratedRoutes archetypes=['scenic']", "re-read the same 20 rows"] }, "end_state": { "must_observe": ["all 20 of 20 primaryArchetype values byte-identical pre vs post", "changed count === 0"], "must_not_observe": ["any of the 20 values differs", "sample size === 0 (empty)", "[] empty pre- or post-sample"] } }]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the dirty spelling pair and a sample of 20 curated_routes rows on live dev WHEN normalizeState runs and the state-normalization gate is exercised via listCuratedRoutes THEN normalizeState('North-Carolina') === 'North Carolina' and normalizeState('North Carolina') === 'North Carolina', and the sampled DB state values are byte-identical before and after",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts -t normalizeCanonicalAndNoWriteBack",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["normalizeState('North-Carolina') === 'North Carolina'", "normalizeState('North Carolina') === 'North Carolina'", "pre-sample === post-sample (all 20 state values byte-identical)", "0 sampled state values changed"],
        "must_not_observe": ["'North-Carolina' in normalized output", "any sampled state changed", "0 rows sampled", "[] (empty sample)"],
        "negative_control": { "would_fail_if": ["normalizeState is a no-op/identity so 'North-Carolina' stays distinct", "the gate writes back to curated_routes", "the sample read is stubbed/static"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["assert normalizeState('North-Carolina') === 'North Carolina'", "sample 20 rows, snapshot state per _id", "call listCuratedRoutes state='North Carolina'", "re-read same 20 rows"] }, "end_state": { "must_observe": ["normalizeState('North-Carolina') === 'North Carolina' (literal match)", "normalizeState('North Carolina') === 'North Carolina' (literal match)", "all 20 of 20 state values byte-identical pre vs post", "changed count === 0"], "must_not_observe": ["normalizeState returns 'North-Carolina' (no-op)", "any of the 20 state values differs", "sample size === 0 (empty)", "[] empty sample"] } }]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Integration: sampled curated_routes primaryArchetype byte-identical pre/post — no write-back (T-DATA-004).",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.archetype.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Integration + unit: normalizeState canonicalizes both spellings and the gate performs no curated_routes write-back (T-DATA-007).",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Only the two new test files appear in git diff; no implementation or schema files are modified.",
      "verify": "git diff --name-only",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
