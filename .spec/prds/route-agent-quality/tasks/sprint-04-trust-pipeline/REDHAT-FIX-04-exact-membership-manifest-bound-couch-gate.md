# REDHAT-FIX-04 — Require exact unique sample membership, authorization, and snapshot/version binding before couch PASS can unlock `--all` (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-04 |
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
| DEPENDS_ON | REDHAT-FIX-03, REDHAT-FIX-06 |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX04-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

`recordCouchVerdict` rejects any `routeVerdicts` that don't exactly cover the stored sample; `couchGateStatus`/`runAllWaterfall` unlock `--all` only from an operator-recorded pass bound to the current sample's manifest hash; a re-exported sample re-blocks `--all` until re-approved.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (unlock bound to "the current sample's manifest hash") has **not** been delivered as a CURRENT/active pointer. `couchGateStatus` selects up to ten `pass` rows via `by_overallVerdict` then sorts only that in-memory subset (`convex/couchVerdict.ts:184-200`) and validates the selected row's OWN frozen manifest (`:202-244`) — there is no persisted "current active manifest" pointer, and `currentCatalogVersion` is a hardcoded constant `'s4-trust-pipeline-v1'` (`:219`). A historical pass therefore remains eligible after later sample creation or route changes that don't touch that hardcoded literal, and the `.take(10)` selection can miss the true latest verdict beyond the first ten passes.

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — Couch pass is bound to an explicit current active manifest, not a take(10)-sorted subset or hardcoded version

**Requirement:** GIVEN an operator pass recorded against manifest m1, and a NEWER active manifest m2 is subsequently activated with no fresh pass recorded for it WHEN `couchGateStatus` is queried THEN `allowed == false` — the historical m1 pass does not keep `--all` unlocked; WHEN a pass is recorded against the CURRENT active manifest THEN `couchGateStatus` resolves it via an ordered index (not a `.take(10)` in-memory sort) and returns `allowed == true`.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real `couchGateStatus` + active-manifest pointer)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-active-manifest-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `couchGateStatus` still `.take(10)`s all passes and sorts in memory against the hardcoded `'s4-trust-pipeline-v1'` (unchanged `couchVerdict.ts:184-219`) so the historical m1 pass still unlocks; no active-manifest pointer exists; drift is detected only via a hardcoded version literal
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — record an operator pass against sample m1; activate a newer sample m2 with no pass recorded; query `couchGateStatus`; then record a pass against m2 and re-query
  - MUST_OBSERVE: `couchGateStatus.allowed == false` while m2 (active) has no pass, even though m1's historical pass exists; `couchGateStatus.allowed == true` once m2 has its own recorded pass, resolved via an ordered index
  - MUST_NOT_OBSERVE: `couchGateStatus.allowed == true` from the superseded m1 pass; the gate resolving against the hardcoded `'s4-trust-pipeline-v1'` constant

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST load the stored couch_samples row for sampleId and reject recordCouchVerdict unless routeVerdicts is an exact unique membership match (set equality on routeId AND equal length AND no duplicate routeIds)
- MUST persist the sample's manifestHash (REDHAT-FIX-03) onto the couch_verdicts row and bind couchGateStatus.allowed / runAllWaterfall to the CURRENT sample's manifestHash, not any historical pass
- MUST require requireOperator(ctx) (REDHAT-FIX-06) on recordCouchVerdict and on the --all gate entry points (couchGateStatus/runAllWaterfall)

**NEVER**
- NEVER accept an arbitrary nonempty routeVerdicts array for a sampleId with no stored sample validation (the current recordCouchVerdict behavior)
- NEVER return allowed=true from couchGateStatus based on any historical pass row whose manifestHash differs from the current sample's
- NEVER let a duplicate routeId in routeVerdicts satisfy membership

**STRICTLY**
- STRICTLY membership is exact set equality plus length equality plus no-duplicates against couch_samples.routes
- STRICTLY a re-exported sample (new manifestHash) invalidates prior verdicts for --all until a fresh pass is recorded against the new manifest

## DONE WHEN

- AC-1 [recordCouchVerdict rejects any routeVerdicts that are not an exact unique membership match] [PRIMARY]: Missing/extra/duplicate routeVerdicts against a frozen sample all throw SAMPLE_MEMBERSHIP_MISMATCH
- AC-2 [An exact operator pass is recorded and bound to the current manifest hash]: An exact all-true pass writes sampleManifestHash and couchGateStatus.allowed becomes true
- AC-3 [A re-exported sample re-blocks --all until re-approved]: A pass on H1 does not unlock once the sample is re-exported to H2
- AC-4 [Non-operator cannot record a couch verdict]: A non-operator recordCouchVerdict call throws FORBIDDEN
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Bind the couch PASS that unlocks `--all` to (a) exact unique membership over the stored immutable sample, (b) operator authorization, and (c) the current sample's manifest hash/version, replacing today's forgeable any-nonempty-array + any-historical-pass logic.

**Success state:** `recordCouchVerdict` rejects verdicts that don't exactly cover the stored sample; `couchGateStatus`/`runAllWaterfall` unlock `--all` only from an operator-recorded pass bound to the current sample's manifest hash; a re-exported sample re-blocks `--all` until re-approved.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `frozen-couch-sample` (seed_method: `public_api`): A stored, manifest-frozen couch_samples row with routeIds R1..R6 and manifestHash H1 (produced by REDHAT-FIX-03's freeze/export path)
- `exact-match-verdicts` (seed_method: `public_api`): A routeVerdicts array covering exactly R1..R6 once each, all 'true', overall pass
- `membership-mismatch-verdicts` (seed_method: `public_api`): Three rejecting variants — missing R6; extra R7; duplicate R1
- `restaled-manifest-sample` (seed_method: `public_api`): frozen-couch-sample after a fresh export bumps manifestHash H1→H2, following a pass recorded against H1

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — recordCouchVerdict rejects any routeVerdicts that are not an exact unique membership match

**Requirement:** GIVEN a frozen couch_samples row 'redhatfix04-sample' with routes R1..R6 and mismatch variants WHEN an operator calls recordCouchVerdict with a missing, extra, or duplicate routeVerdicts array THEN the mutation throws SAMPLE_MEMBERSHIP_MISMATCH and writes no couch_verdicts row

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict + membership validation)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: recordCouchVerdict accepts any nonempty routeVerdicts array without loading the stored sample (a stub check); membership check is length-only and a duplicate routeId slips through
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-couch-sample`
  - ACTION: Seed frozen-couch-sample (R1..R6, manifestHash H1); call recordCouchVerdict with the missing/extra/duplicate variants; query couch_verdicts for sampleId 'redhatfix04-sample'
  - MUST_OBSERVE: each call throws error.code == 'SAMPLE_MEMBERSHIP_MISMATCH'
  - MUST_NOT_OBSERVE: couch_verdicts count for sampleId 'redhatfix04-sample' > 0; couch_verdicts row is present for any mismatched submission

### AC-2 — An exact operator pass is recorded and bound to the current manifest hash

**Requirement:** GIVEN frozen sample manifestHash H1 and the exact-match-verdicts fixture WHEN an operator records an all-true exact pass THEN a couch_verdicts row is written with overallVerdict='pass', recordedBy the operator, and sampleManifestHash='H1', and couchGateStatus returns allowed=true

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict + couchGateStatus)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: sampleManifestHash is not persisted (empty) so the gate can't bind to it; couchGateStatus returns allowed from a mocked pass row regardless of manifest
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `exact-match-verdicts`
  - ACTION: Seed frozen-couch-sample (manifestHash H1); call recordCouchVerdict with exact-match-verdicts; query couch_verdicts and couchGateStatus
  - MUST_OBSERVE: couch_verdicts.sampleManifestHash == 'H1'; couchGateStatus.allowed == true
  - MUST_NOT_OBSERVE: sampleManifestHash is empty/null; couchGateStatus.allowed == false after a valid current-manifest pass

### AC-3 — A re-exported sample re-blocks --all until re-approved

**Requirement:** GIVEN a pass recorded against H1 and the sample re-exported to H2 WHEN couchGateStatus and runAllWaterfall are checked against the current H2 sample THEN allowed=false (the H1 pass does not bind to the current H2 manifest) and runAllWaterfall throws COUCH_GATE_BLOCKED

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus + runAllWaterfall manifest binding)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: couchGateStatus returns allowed=true from a stale H1 pass (mocked binding); the gate ignores manifestHash entirely
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `restaled-manifest-sample`
  - ACTION: Record an operator exact pass bound to H1; re-export the sample to manifestHash H2; call couchGateStatus; call runAllWaterfall and capture the thrown error
  - MUST_OBSERVE: couchGateStatus.allowed == false; runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true from the H1 pass; runAllWaterfall proceeding past the gate check

### AC-4 — Non-operator cannot record a couch verdict

**Requirement:** GIVEN frozen-couch-sample and a non-operator caller WHEN the non-operator calls recordCouchVerdict with an otherwise-exact array THEN requireOperator throws FORBIDDEN and no couch_verdicts row is written

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict + requireOperator)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: recordCouchVerdict still runs a requireIdentity-only stub and any authenticated user records a pass
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-couch-sample`
  - ACTION: Seed frozen-couch-sample; as a non-operator, call recordCouchVerdict with the exact-match array; query couch_verdicts for sampleId 'redhatfix04-sample'
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: couch_verdicts count for sampleId 'redhatfix04-sample' > 0

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | missing route → SAMPLE_MEMBERSHIP_MISMATCH | AC-1 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'` |
| TC-2 | extra route → SAMPLE_MEMBERSHIP_MISMATCH | AC-1 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'` |
| TC-3 | duplicate route → SAMPLE_MEMBERSHIP_MISMATCH | AC-1 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'` |
| TC-4 | exact operator pass persists sampleManifestHash | AC-2 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-2'` |
| TC-5 | gate allowed true on matching manifest | AC-2 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-2'` |
| TC-6 | gate allowed false on stale manifest | AC-3 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-3'` |
| TC-7 | runAllWaterfall blocked on manifest mismatch | AC-3 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-3'` |
| TC-8 | non-operator record → FORBIDDEN, no row | AC-4 | `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchVerdict.ts (MODIFY) — add stored-sample membership validation + manifest binding to recordCouchVerdict; bind couchGateStatus/runAllWaterfall allowed to current manifestHash; add requireOperator
- convex/schema.ts (MODIFY, ADDITIVE ONLY) — add sampleManifestHash field to couch_verdicts (+ index if needed for manifest lookup)
- convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchSampleAssembler.ts — the couch_samples manifest hash/version + freeze/export is REDHAT-FIX-03's scope; this task CONSUMES it (read-only)
- convex/guards.ts — requireOperator is REDHAT-FIX-06's scope; import and call only
- Removing couch_samples.routes or narrowing existing couch_verdicts fields
- Accepting a couch pass without loading and validating the stored sample
- Any RN/Expo/app client code

## READING LIST

- `convex/couchVerdict.ts` (51-155,323-353) — recordCouchVerdict accepts any nonempty array with no sample validation; couchGateStatus unlocks from any historical pass; runAllWaterfall gate check — all three to bind to stored sample + manifest
- `convex/couchSampleAssembler.ts` (511-577) — getCouchSample + storeCouchSample (couch_samples routes shape) — the stored membership source of truth
- `convex/schema.ts` (322-365) — couch_samples (no manifest field yet — added by REDHAT-FIX-03) and couch_verdicts (add sampleManifestHash, additive) + indexes
- `convex/errors.ts` (1-34) — reuse ConvexError pattern; SAMPLE_MEMBERSHIP_MISMATCH is a local code string on the thrown ConvexError
- `.spec/prds/route-agent-quality/06-uc-ver.md` (84-95) — UC-VER-05 couch gate acceptance criteria
- `brain/docs/CONVEX-RULES.md` (1-40) — withIndex over filter; validator-first; index-per-query-pattern for the manifest-bound gate lookup

## CODE PATTERN

- Pattern: Stored-sample-bound couch gate — recordCouchVerdict → requireOperator → load couch_samples by sampleId → assert set(routeVerdicts.routeId) === set(sample.routes.routeId) AND lengths equal AND no duplicates → resolveOverallVerdict → persist couch_verdicts { ..., sampleManifestHash: sample.manifestHash }. couchGateStatus → load current sample → allowed only if a pass verdict exists whose sampleManifestHash === current sample.manifestHash
- Pattern source: `convex/couchVerdict.ts:51-101` (handler skeleton) + `convex/couchSampleAssembler.ts:542-576` (stored sample shape)
- Anti-pattern: accepting any nonempty routeVerdicts array (couchVerdict.ts:60-73) and unlocking --all from any historical overallVerdict=='pass' row (couchVerdict.ts:132-153) with no sample/membership/manifest binding

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-04-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; membership + manifest binding on the couch gate
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: REDHAT-FIX-03, REDHAT-FIX-06
- Blocks: REDHAT-FIX-01

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
  "task_id": "REDHAT-FIX-04",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "frozen-couch-sample": { "description": "A stored, manifest-frozen couch_samples row with routeIds R1..R6 and manifestHash H1.", "seed_method": "public_api", "records": ["couch_samples { sampleId:'redhatfix04-sample', routes:[R1..R6], manifestHash:'H1', manifestVersion:1 }"] },
    "exact-match-verdicts": { "description": "A routeVerdicts array covering exactly R1..R6 once each, all true, overall pass.", "seed_method": "public_api", "records": ["routeVerdicts = [{R1,true}..{R6,true}]"] },
    "membership-mismatch-verdicts": { "description": "Three rejecting variants: missing R6, extra R7, duplicate R1.", "seed_method": "public_api", "records": ["missing: [R1..R5]", "extra: [R1..R6,R7]", "duplicate: [R1,R1,R2..R6]"] },
    "restaled-manifest-sample": { "description": "frozen-couch-sample after re-export bumps manifestHash H1->H2.", "seed_method": "public_api", "records": ["couch_samples 'redhatfix04-sample' manifestHash 'H2', manifestVersion 2"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "recordCouchVerdict rejects any routeVerdicts that are not an exact unique membership match", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real recordCouchVerdict + membership validation)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["recordCouchVerdict accepts any nonempty routeVerdicts array without loading the stored sample (a stub check)", "membership check is length-only and a duplicate routeId slips through"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-couch-sample", "action": { "actor": "api_client", "steps": ["Seed frozen-couch-sample (R1..R6, manifestHash H1)", "Call recordCouchVerdict with the missing/extra/duplicate variants", "Query couch_verdicts for sampleId 'redhatfix04-sample'"] },
          "end_state": { "must_observe": ["each call throws error.code == 'SAMPLE_MEMBERSHIP_MISMATCH'"], "must_not_observe": ["couch_verdicts count for sampleId 'redhatfix04-sample' > 0", "couch_verdicts row is present for any mismatched submission"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "An exact operator pass is recorded and bound to the current manifest hash", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real recordCouchVerdict + couchGateStatus)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["sampleManifestHash is not persisted (empty) so the gate can't bind to it", "couchGateStatus returns allowed from a mocked pass row regardless of manifest"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "exact-match-verdicts", "action": { "actor": "api_client", "steps": ["Seed frozen-couch-sample (manifestHash H1)", "Call recordCouchVerdict with exact-match-verdicts", "Query couch_verdicts and couchGateStatus"] },
          "end_state": { "must_observe": ["couch_verdicts.sampleManifestHash == 'H1'", "couchGateStatus.allowed == true"], "must_not_observe": ["sampleManifestHash is empty/null", "couchGateStatus.allowed == false after a valid current-manifest pass"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "A re-exported sample (new manifest hash) re-blocks --all until re-approved", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couchGateStatus + runAllWaterfall manifest binding)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["couchGateStatus returns allowed=true from a stale H1 pass (mocked binding)", "the gate ignores manifestHash entirely"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "restaled-manifest-sample", "action": { "actor": "api_client", "steps": ["Record an operator exact pass bound to H1", "Re-export the sample to manifestHash H2", "Call couchGateStatus", "Call runAllWaterfall and capture the thrown error"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == false", "runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'"], "must_not_observe": ["couchGateStatus.allowed == true from the H1 pass", "runAllWaterfall proceeding past the gate check"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Non-operator cannot record a couch verdict", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real recordCouchVerdict + requireOperator)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["recordCouchVerdict still runs a requireIdentity-only stub and any authenticated user records a pass"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-couch-sample", "action": { "actor": "api_client", "steps": ["Seed frozen-couch-sample", "As a non-operator, call recordCouchVerdict with the exact-match array", "Query couch_verdicts for sampleId 'redhatfix04-sample'"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["couch_verdicts count for sampleId 'redhatfix04-sample' > 0"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "missing route -> SAMPLE_MEMBERSHIP_MISMATCH", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "extra route -> SAMPLE_MEMBERSHIP_MISMATCH", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "duplicate route -> SAMPLE_MEMBERSHIP_MISMATCH", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-1'" },
    { "id": "TC-4", "type": "test_criterion", "description": "exact operator pass persists sampleManifestHash", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-2'" },
    { "id": "TC-5", "type": "test_criterion", "description": "gate allowed true on matching manifest", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-2'" },
    { "id": "TC-6", "type": "test_criterion", "description": "gate allowed false on stale manifest", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-3'" },
    { "id": "TC-7", "type": "test_criterion", "description": "runAllWaterfall blocked on manifest mismatch", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-3'" },
    { "id": "TC-8", "type": "test_criterion", "description": "non-operator record -> FORBIDDEN, no row", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX04-couch-membership-binding.integration.test.ts -t 'AC-4'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "Couch pass is bound to an explicit current active manifest via an ordered index, not a take(10)-sorted subset or hardcoded version (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX04-active-manifest-binding.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couchGateStatus + active-manifest pointer)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["couchGateStatus still take(10)s all passes and sorts in memory against the hardcoded 's4-trust-pipeline-v1' (unchanged couchVerdict.ts:184-219)", "no active-manifest pointer exists", "drift is detected only via a hardcoded version literal"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "active-manifest-with-pass", "action": { "actor": "api_client", "steps": ["Record an operator pass against sample m1", "Activate a newer sample m2 with no pass recorded", "Query couchGateStatus", "Record a pass against m2 and re-query"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == false while m2 (active) has no pass", "couchGateStatus.allowed == true once m2 has its own recorded pass, resolved via an ordered index"], "must_not_observe": ["couchGateStatus.allowed == true from the superseded m1 pass", "the gate resolving against the hardcoded 's4-trust-pipeline-v1' constant"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "A historical pass on a superseded manifest no longer unlocks --all; the active manifest's own pass does", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX04-active-manifest-binding.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
