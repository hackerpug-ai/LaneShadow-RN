# REDHAT-FIX-03 — Bind founder couch approval to an authenticated immutable real sample/export manifest with reviewer identity, hashes, route decisions, and notes (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-03 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-06, REDHAT-FIX-10 |
| BLOCKS | REDHAT-FIX-01, REDHAT-FIX-04 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX03-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A couch PASS can only be recorded by an operator against the current sample's server-computed manifest hash with a complete exact-membership decision set; the verdict is appended (never replaced); `couchGateStatus.allowed` is true only for the current active manifest.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST load the stored couch_samples row for the submitted sampleId and reject (fail-closed) when it is absent
- MUST compute a server-derived manifest hash from the exact stored sample contents and require the submitted verdict to carry that same hash — reject on mismatch
- MUST require exact per-route membership: every sample route has exactly one decision, no missing routes, no extras, no duplicate routeIds
- MUST require an operator/founder identity via REDHAT-FIX-06's `requireOperator(ctx)` primitive and record that identity on the verdict
- MUST record verdicts append-only (audit trail) with per-route decisions + notes — never `ctx.db.replace` over a prior verdict

**NEVER**
- NEVER accept an arbitrary sampleId + routeVerdicts blob with no stored-sample validation (current couchVerdict.ts:51-101 behavior)
- NEVER let couchGateStatus report allowed=true from ANY historical pass row unbound to the current sample manifest (current :128-155 behavior)
- NEVER allow a non-operator authenticated caller to record a couch verdict
- NEVER overwrite or delete a prior verdict — audit rows are immutable and append-only

**STRICTLY**
- STRICTLY additive schema changes only — add manifestHash/exportedAt/frozen to couch_samples and manifestHash/reviewerId/notes + by_manifestHash index to couch_verdicts as optional-first fields
- STRICTLY the manifest hash is server-derived, never a client-supplied value trusted as-is
- STRICTLY a single per-route 'wrong' still forces overall fail (preserve resolveOverallVerdict)

## DONE WHEN

- AC-1 [Verdict binds to the server-derived manifest hash with exact membership] [PRIMARY]: An operator pass referencing manifest hash H1 with a complete decision set is recorded bound to H1; a forged-hash or partial-membership submission is rejected fail-closed
- AC-2 [Verdicts are append-only audit rows, not replaced]: Two recordings against the same manifest leave 2 audit rows, not 1
- AC-3 [Non-operator identity is rejected]: A non-operator recordCouchVerdict call throws and records nothing
- AC-4 [Unlock binds to the current active manifest only]: A stale H1 pass does not unlock --all once the current sample is H2
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Rebuild `recordCouchVerdict` + `couchGateStatus` so a couch PASS is bound to a server-derived immutable manifest hash of the exact stored sample, authored by a verified operator, with exact per-route decisions + notes recorded append-only, and the `--all` unlock derives solely from the current active manifest.

**Success state:** A couch PASS can only be recorded by an operator against the current sample's server-computed manifest hash with a complete exact-membership decision set; the verdict is appended (never replaced); and `couchGateStatus.allowed` is true only for the current active manifest — a forged/partial/stale/non-operator verdict cannot unlock `--all`.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `stored-couch-sample-manifest-H1` (seed_method: `public_api`): A real couch_samples row seeded via the honest `storeCouchSample` (REDHAT-FIX-10) whose server-computed manifest hash is H1
    - `couch_samples` doc: 20-30 stratified routes across all 3 provenance types, manifestHash H1 computed server-side and frozen
- `operator-identity` (seed_method: `public_api`): An authenticated user carrying the founder/operator role recognised by REDHAT-FIX-06's `requireOperator` primitive
- `non-operator-identity` (seed_method: `public_api`): A plain authenticated user with no operator role — must be rejected
- `superseded-sample-manifest-H2` (seed_method: `public_api`): A newer stored couch_samples that supersedes H1 as the active sample, producing manifest hash H2 with NO pass verdict

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Verdict binds to the server-derived manifest hash with exact membership

**Requirement:** GIVEN a stored couch_samples row with server-computed manifest hash H1 and an operator identity WHEN the operator records a pass verdict referencing manifest hash H1 with exactly one decision per sample route (plus notes) THEN the verdict is recorded bound to H1; and a verdict referencing a wrong/absent manifest hash, or with missing/extra/duplicate routes, is rejected fail-closed

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict against stored sample)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: recordCouchVerdict accepts an arbitrary sampleId with no stored couch_samples row (absent); a verdict with a mismatched or absent manifest hash is accepted; the manifest hash is taken from client input and hardcoded, not recomputed server-side
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `stored-couch-sample-manifest-H1`
  - ACTION: Seed the stored sample (manifest H1) and an operator identity; as operator, record a pass verdict referencing H1 with one decision per sample route; query the persisted couch_verdicts row
  - MUST_OBSERVE: couch_verdicts.manifestHash == 'H1'; routeVerdicts.length == sample.routes.length
  - MUST_NOT_OBSERVE: verdict persisted with manifestHash != 'H1'; couch_verdicts row is empty/absent for a valid submission
- CASE 2 — start_ref `stored-couch-sample-manifest-H1`
  - ACTION: As operator, attempt to record a verdict referencing a forged manifest hash 'H-forged'; attempt a second verdict that omits one sample route; capture both rejections
  - MUST_OBSERVE: the forged-manifest submission throws error.code == 'MANIFEST_MISMATCH'; the missing-route submission throws error.code == 'INCOMPLETE_MEMBERSHIP'
  - MUST_NOT_OBSERVE: either forged/partial submission recorded (couch_verdicts row present); couchGateStatus.allowed becomes true from a rejected submission

### AC-2 — Verdicts are append-only audit rows, not replaced

**Requirement:** GIVEN an existing operator verdict bound to manifest H1 WHEN a second verdict for the same manifest is recorded THEN a new audit row is appended (the prior row is retained), each carrying reviewerId + recordedAt + per-route notes

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couch_verdicts append-only)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-append-only-audit.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: ctx.db.replace overwrites the prior verdict; querying the manifest returns only one verdict row after two recordings (missing); the second recording silently no-ops and the empty audit trail shows only one row
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `stored-couch-sample-manifest-H1`
  - ACTION: As operator, record verdict #1 (pass) for manifest H1; as operator, record verdict #2 (fail) for H1; query all couch_verdicts for manifest H1
  - MUST_OBSERVE: couch_verdicts count for manifest H1 == 2; each row's reviewerId length > 0 (non-empty)
  - MUST_NOT_OBSERVE: couch_verdicts count for manifest H1 == 1 (verdict #1 overwritten); a row with reviewerId absent

### AC-3 — Non-operator identity is rejected

**Requirement:** GIVEN an authenticated caller without the operator role and a stored sample H1 WHEN that caller calls recordCouchVerdict THEN the mutation throws an operator-required error and records nothing

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-operator-required.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a requireIdentity-only existence check lets any authenticated user record (a stub of the operator guard); the non-operator submission is accepted
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `non-operator-identity`
  - ACTION: Seed the stored sample H1; as a non-operator, attempt recordCouchVerdict with a complete H1 decision set; capture the rejection and query couch_verdicts
  - MUST_OBSERVE: the call throws error.code == 'OPERATOR_REQUIRED'
  - MUST_NOT_OBSERVE: couch_verdicts count for manifest H1 attributable to the non-operator > 0; couch_verdicts row for the non-operator is present

### AC-4 — Unlock binds to the current active manifest only

**Requirement:** GIVEN a passing operator verdict on manifest H1 and a newer active sample producing manifest H2 with no verdict WHEN couchGateStatus is queried THEN allowed is false because the current active manifest H2 has no matching pass — a stale H1 pass cannot unlock --all

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus binding)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-current-manifest-unlock.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: couchGateStatus returns allowed=true from a stale historical pass regardless of current sample (a mocked binding); allowed stays true after the sample is superseded by H2
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `superseded-sample-manifest-H2`
  - ACTION: Record an operator pass verdict on manifest H1; store a newer active sample producing manifest H2 (no verdict); query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed == false; couchGateStatus.activeManifestHash == 'H2'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true from the stale H1 pass; couchGateStatus.activeManifestHash == 'H1'

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | recordCouchVerdict persists a verdict whose manifestHash equals the server-computed H1 | AC-1 | `npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-1'` |
| TC-2 | recordCouchVerdict throws MANIFEST_MISMATCH for a fabricated manifest hash | AC-1 | `npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-2'` |
| TC-3 | recordCouchVerdict throws INCOMPLETE_MEMBERSHIP when a sample route decision is missing | AC-1 | `npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-3'` |
| TC-4 | Two recordings for manifest H1 leave exactly 2 append-only couch_verdicts rows | AC-2 | `npx vitest run convex/__tests__/REDHATFIX03-append-only-audit.integration.test.ts -t 'TC-4'` |
| TC-5 | A non-operator recordCouchVerdict call throws OPERATOR_REQUIRED and writes no row | AC-3 | `npx vitest run convex/__tests__/REDHATFIX03-operator-required.integration.test.ts -t 'TC-5'` |
| TC-6 | couchGateStatus.allowed is false when active manifest H2 has no pass despite a stale H1 pass | AC-4 | `npx vitest run convex/__tests__/REDHATFIX03-current-manifest-unlock.integration.test.ts -t 'TC-6'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchVerdict.ts (MODIFY) — manifest binding, operator auth, append-only audit, current-manifest unlock
- convex/couchSampleAssembler.ts (MODIFY) — compute + freeze server-derived manifest hash in storeCouchSample (coordinate with REDHAT-FIX-10)
- convex/schema.ts (MODIFY, ADDITIVE ONLY) — couch_samples manifestHash/exportedAt/frozen; couch_verdicts manifestHash/reviewerId/notes + by_manifestHash index
- convex/couchManifest.ts (NEW, OPTIONAL) — pure server-side manifest-hash derivation helper
- convex/__tests__/REDHATFIX03-*.integration.test.ts (NEW)

**writeProhibited:**
- Re-designing the operator primitive — consume REDHAT-FIX-06's requireOperator, do not author a new role model
- ctx.db.replace or ctx.db.delete over prior couch_verdicts rows (audit is append-only)
- Trusting a client-supplied manifest hash without server recomputation
- Non-additive edits to couch_samples/couch_verdicts
- Touching rideWorthinessClassifier.ts / waterfallOrchestrator.ts — owned by REDHAT-FIX-02/01

## READING LIST

- `convex/couchVerdict.ts` (51-167) — recordCouchVerdict arbitrary-blob + replace behaviour, couchGateStatus any-historical-pass, clearCouchVerdicts to remove/operator-gate
- `convex/couchSampleAssembler.ts` (523-577) — storeCouchSample — where the server-derived manifest hash must be computed and frozen (coordinate with REDHAT-FIX-10)
- `convex/schema.ts` (322-365) — couch_samples (add manifestHash/exportedAt/frozen) and couch_verdicts (add manifestHash/reviewerId/notes + by_manifestHash index)
- `convex/guards.ts` (15-29) — requireIdentity existence-only — to be superseded by REDHAT-FIX-06 requireOperator for these mutations
- `convex/couchVerdict.ts` (29-45) — resolveOverallVerdict — preserve the single-'wrong'-forces-fail rule
- `brain/docs/CONVEX-RULES.md` (1-60) — validator-first, additive schema evolution, no ctx.db.replace for audit trails

## CODE PATTERN

- Pattern: Server-derived immutable manifest — storeCouchSample computes a deterministic hash over the exact stored route set (routeId + provenance + routedMiles/claimedMiles + geometry version), freezes it; recordCouchVerdict re-derives and matches the hash, enforces exact membership, requires operator identity, appends an immutable audit row; couchGateStatus resolves the current active manifest and unlocks only on a matching pass
- Pattern source: `convex/curatedGeometryGate.ts:73-102` (pure structured-verdict function) + Convex additive-schema evolution
- Anti-pattern: recordCouchVerdict accepting an arbitrary {sampleId, routeVerdicts} and ctx.db.replace-ing any prior row; couchGateStatus returning allowed=true from any historical pass (couchVerdict.ts:51-155)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX03-*.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-03-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; manifest binding + operator auth + append-only audit
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: REDHAT-FIX-06, REDHAT-FIX-10
- Blocks: REDHAT-FIX-01, REDHAT-FIX-04

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-03",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "stored-couch-sample-manifest-H1": { "description": "A real couch_samples row via honest storeCouchSample whose server-computed manifest hash is H1.", "seed_method": "public_api", "records": ["couch_samples doc via storeCouchSample: 20-30 stratified routes, manifestHash H1"] },
    "operator-identity": { "description": "An authenticated operator recognised by REDHAT-FIX-06's requireOperator.", "seed_method": "public_api", "records": ["user row with operator role"] },
    "non-operator-identity": { "description": "A plain authenticated user with no operator role.", "seed_method": "public_api", "records": ["user row with default (non-operator) role"] },
    "superseded-sample-manifest-H2": { "description": "A newer stored couch_samples that supersedes H1, manifest hash H2, no pass verdict.", "seed_method": "public_api", "records": ["couch_samples doc via storeCouchSample, manifestHash H2"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Verdict binds to the server-derived manifest hash with exact membership", "verify": "npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real recordCouchVerdict against stored sample)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["recordCouchVerdict accepts an arbitrary sampleId with no stored couch_samples row (absent)", "a verdict with a mismatched or absent manifest hash is accepted", "the manifest hash is taken from client input and hardcoded, not recomputed server-side"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "stored-couch-sample-manifest-H1", "action": { "actor": "api_client", "steps": ["Seed the stored sample (manifest H1) and an operator identity", "As operator, record a pass verdict referencing H1 with one decision per sample route", "Query the persisted couch_verdicts row"] },
          "end_state": { "must_observe": ["couch_verdicts.manifestHash == 'H1'", "routeVerdicts.length == sample.routes.length"], "must_not_observe": ["verdict persisted with manifestHash != 'H1'", "couch_verdicts row is empty/absent for a valid submission"] } },
          { "start_ref": "stored-couch-sample-manifest-H1", "action": { "actor": "api_client", "steps": ["As operator, attempt to record a verdict referencing a forged manifest hash 'H-forged'", "Attempt a second verdict that omits one sample route", "Capture both rejections"] },
          "end_state": { "must_observe": ["the forged-manifest submission throws error.code == 'MANIFEST_MISMATCH'", "the missing-route submission throws error.code == 'INCOMPLETE_MEMBERSHIP'"], "must_not_observe": ["either forged/partial submission recorded (couch_verdicts row present)", "couchGateStatus.allowed becomes true from a rejected submission"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Verdicts are append-only audit rows, not replaced", "verify": "npx vitest run convex/__tests__/REDHATFIX03-append-only-audit.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couch_verdicts append-only)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["ctx.db.replace overwrites the prior verdict", "querying the manifest returns only one verdict row after two recordings (missing)", "the second recording silently no-ops and the empty audit trail shows only one row"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "stored-couch-sample-manifest-H1", "action": { "actor": "api_client", "steps": ["As operator, record verdict #1 (pass) for manifest H1", "As operator, record verdict #2 (fail) for H1", "Query all couch_verdicts for manifest H1"] },
          "end_state": { "must_observe": ["couch_verdicts count for manifest H1 == 2", "each row's reviewerId length > 0 (non-empty)"], "must_not_observe": ["couch_verdicts count for manifest H1 == 1 (verdict #1 overwritten)", "a row with reviewerId absent"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Non-operator identity is rejected", "verify": "npx vitest run convex/__tests__/REDHATFIX03-operator-required.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["a requireIdentity-only existence check lets any authenticated user record (a stub of the operator guard)", "the non-operator submission is accepted"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "non-operator-identity", "action": { "actor": "api_client", "steps": ["Seed the stored sample H1", "As a non-operator, attempt recordCouchVerdict with a complete H1 decision set", "Capture the rejection and query couch_verdicts"] },
          "end_state": { "must_observe": ["the call throws error.code == 'OPERATOR_REQUIRED'"], "must_not_observe": ["couch_verdicts count for manifest H1 attributable to the non-operator > 0", "couch_verdicts row for the non-operator is present"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Unlock binds to the current active manifest only", "verify": "npx vitest run convex/__tests__/REDHATFIX03-current-manifest-unlock.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couchGateStatus binding)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["couchGateStatus returns allowed=true from a stale historical pass regardless of current sample (a mocked binding)", "allowed stays true after the sample is superseded by H2"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "superseded-sample-manifest-H2", "action": { "actor": "api_client", "steps": ["Record an operator pass verdict on manifest H1", "Store a newer active sample producing manifest H2 (no verdict)", "Query couchGateStatus"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == false", "couchGateStatus.activeManifestHash == 'H2'"], "must_not_observe": ["couchGateStatus.allowed == true from the stale H1 pass", "couchGateStatus.activeManifestHash == 'H1'"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "Persisted verdict manifestHash equals server-computed H1", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Fabricated manifest hash throws MANIFEST_MISMATCH", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Missing sample route decision throws INCOMPLETE_MEMBERSHIP", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX03-manifest-binding.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Two recordings leave exactly 2 append-only rows for H1", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX03-append-only-audit.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Non-operator call throws OPERATOR_REQUIRED and writes no row", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX03-operator-required.integration.test.ts -t 'TC-5'" },
    { "id": "TC-6", "type": "test_criterion", "description": "allowed false when active H2 unverdicted despite stale H1 pass", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX03-current-manifest-unlock.integration.test.ts -t 'TC-6'" }
  ]
}
-->

</details>
