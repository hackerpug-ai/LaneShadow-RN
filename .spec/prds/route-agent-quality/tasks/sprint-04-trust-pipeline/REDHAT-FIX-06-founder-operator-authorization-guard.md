# REDHAT-FIX-06 — Enforce founder/operator authorization for REVIEW and couch operational mutations using canonical role/ownership checks (UC-VER-04, UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-06 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-05, REDHAT-FIX-08, REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX06-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A canonical `requireOperator(ctx)` guard backed by a stored `operator_roles` allowlist table rejects a seeded non-operator authenticated user with `FORBIDDEN` from every guarded trust-changing mutation while no state is mutated; a seeded operator passes; unauthenticated callers still fail with `UNAUTHENTICATED`.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST back operator authorization with stored data (a queryable operator_roles table keyed by clerkUserId), never an env-var/config-only check, so a seeded non-operator user is rejected deterministically in an integration test
- MUST reuse requireIdentity inside requireOperator so an unauthenticated caller still fails with UNAUTHENTICATED before the role lookup, and a role-less authenticated caller fails with FORBIDDEN

**NEVER**
- NEVER allow a valid-but-non-operator authenticated identity to pass requireOperator — this is the load-bearing security property and the mandatory negative control
- NEVER expose a public unauthenticated/self-serve mutation that grants operator role to arbitrary callers; the operator bootstrap must be gated by a server-owned secret (env OPERATOR_BOOTSTRAP_KEY, following the DEV_AUTH_BYPASS_KEY pattern already in guards.ts:70-78) or an existing operator
- NEVER weaken or remove requireIdentity; requireOperator is strictly additive on top of it

**STRICTLY**
- STRICTLY apply requireOperator to every couch/review operational mutation cited in the red-hat review that is in this task's write scope: recordCouchVerdict, clearCouchVerdicts, couchGateStatus, runAllWaterfall, retireDisposition, prepareRetryDisposition
- STRICTLY schema changes are additive only (new operator_roles table + new index); no field removals or type narrowing on existing tables

## DONE WHEN

- AC-1 [Non-operator authenticated caller is rejected from a trust-changing couch mutation] [PRIMARY]: A seeded non-operator identity is rejected with FORBIDDEN from recordCouchVerdict
- AC-2 [Seeded operator passes the guard and the guarded mutation succeeds]: A seeded operator passes requireOperator and recordCouchVerdict succeeds
- AC-3 [Unauthenticated caller is rejected before the role lookup]: An unauthenticated call throws UNAUTHENTICATED, not FORBIDDEN
- AC-4 [Evidence-erasing mutation clearCouchVerdicts is operator-gated and preserves rows for non-operators]: A non-operator clearCouchVerdicts call is rejected and existing rows survive
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Introduce a canonical server-owned founder/operator authorization primitive `requireOperator(ctx)` backed by a stored `operator_roles` allowlist table, and apply it to the trust-changing couch/review mutations that today rely only on existence-check `requireIdentity`.

**Success state:** A seeded non-operator authenticated user is rejected with FORBIDDEN from every guarded trust-changing mutation while no state is mutated; a seeded operator passes; unauthenticated callers still fail with UNAUTHENTICATED; the guard is a single reusable function other REDHAT-FIX tasks import.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `operator-identity` (seed_method: `public_api`): An authenticated founder/operator — an operator_roles row for clerkUserId 'founder-op-1' role 'founder', seeded through the server-secret-gated bootstrap mutation
    - `bootstrapOperator({ key: process.env.OPERATOR_BOOTSTRAP_KEY, clerkUserId: 'founder-op-1', role: 'founder' })`
- `non-operator-user` (seed_method: `public_api`): A valid authenticated user with NO operator_roles row
    - user upserted for clerkUserId 'plain-user-2'; deliberately NO operator_roles row exists
- `existing-operator-couch-pass` (seed_method: `public_api`): A couch_verdicts pass row already recorded by the operator, used to prove clearCouchVerdicts is guarded
    - as operator identity 'founder-op-1', call `recordCouchVerdict({ sampleId:'redhatfix06-sample', overallVerdict:'pass', routeVerdicts:[{routeId:'r1',verdict:'true'}] })`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Non-operator authenticated caller is rejected from a trust-changing couch mutation

**Requirement:** GIVEN operator_roles contains only 'founder-op-1' and the caller is authenticated as 'plain-user-2' which has NO operator_roles row WHEN 'plain-user-2' calls recordCouchVerdict with an otherwise-valid pass payload THEN requireOperator throws ConvexError{code:'FORBIDDEN'}, the handler body never runs, and zero couch_verdicts rows attributable to 'plain-user-2' are written

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + operator_roles table + recordCouchVerdict)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: non-operator identity is accepted because the guard is still a requireIdentity-only stub; the role lookup is mocked to always find an operator
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-identity`
  - ACTION: Seed operator-identity and non-operator-user; authenticate as 'plain-user-2'; call recordCouchVerdict; query operator_roles and couch_verdicts
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: couch_verdicts count with recordedBy == 'plain-user-2' > 0; operator_roles row for 'plain-user-2' is present

### AC-2 — Seeded operator passes the guard and the guarded mutation succeeds

**Requirement:** GIVEN operator_roles contains 'founder-op-1' WHEN 'founder-op-1' calls recordCouchVerdict with a valid pass payload THEN requireOperator resolves, the mutation writes a couch_verdicts row with recordedBy == 'founder-op-1'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + recordCouchVerdict)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: requireOperator rejects a genuine operator (a mocked inverted guard); the couch_verdicts row is not written despite a passing guard (absent)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-identity`
  - ACTION: Seed operator-identity; authenticate as 'founder-op-1'; call recordCouchVerdict; query couch_verdicts
  - MUST_OBSERVE: couch_verdicts.recordedBy == 'founder-op-1'
  - MUST_NOT_OBSERVE: recordedBy is empty; no couch_verdicts row is present

### AC-3 — Unauthenticated caller is rejected before the role lookup

**Requirement:** GIVEN no authenticated identity on the request WHEN an unauthenticated caller invokes recordCouchVerdict THEN requireOperator (via requireIdentity) throws ConvexError{code:'UNAUTHENTICATED'} and no operator_roles read or write occurs

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator identity path)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: requireOperator skips the identity check (a stub) and jumps straight to a role lookup that silently returns false
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-identity`
  - ACTION: Seed operator-identity so a role row exists to prove the lookup is skippable; invoke recordCouchVerdict with NO authenticated identity; query couch_verdicts
  - MUST_OBSERVE: the call throws error.code == 'UNAUTHENTICATED'
  - MUST_NOT_OBSERVE: a new couch_verdicts row is present; error.code == 'FORBIDDEN' (identity precedence not preserved)

### AC-4 — Evidence-erasing mutation clearCouchVerdicts is operator-gated and preserves rows for non-operators

**Requirement:** GIVEN a couch_verdicts pass row recorded by the operator and a non-operator caller WHEN 'plain-user-2' calls clearCouchVerdicts THEN requireOperator throws FORBIDDEN and the existing operator-recorded couch_verdicts row is still present afterwards

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + clearCouchVerdicts)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: clearCouchVerdicts still runs a requireIdentity-only stub and any authenticated user can wipe verdicts
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `existing-operator-couch-pass`
  - ACTION: Seed existing-operator-couch-pass; authenticate as 'plain-user-2'; call clearCouchVerdicts(); query couch_verdicts for sampleId 'redhatfix06-sample'
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'; couch_verdicts count for sampleId 'redhatfix06-sample' == 1 (still present)
  - MUST_NOT_OBSERVE: couch_verdicts count for sampleId 'redhatfix06-sample' == 0 (erased)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | requireOperator throws ConvexError code FORBIDDEN for an authenticated caller absent from operator_roles | AC-1 | `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-1'` |
| TC-2 | recordCouchVerdict writes no couch_verdicts row when the caller fails requireOperator | AC-1 | `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-1'` |
| TC-3 | requireOperator resolves for a clerkUserId present in operator_roles and recordCouchVerdict writes a row with that recordedBy | AC-2 | `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-2'` |
| TC-4 | requireOperator throws ConvexError code UNAUTHENTICATED for a call with no authenticated identity | AC-3 | `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-3'` |
| TC-5 | clearCouchVerdicts throws FORBIDDEN for a non-operator and the pre-existing couch_verdicts row count remains 1 | AC-4 | `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/guards.ts (MODIFY) - add requireOperator(ctx) reusing requireIdentity + operator_roles lookup
- convex/schema.ts (MODIFY, additive only) - add operator_roles table + by_clerkUserId index
- convex/couchVerdict.ts (MODIFY) - swap requireIdentity->requireOperator on recordCouchVerdict, clearCouchVerdicts, couchGateStatus, runAllWaterfall, seedAllBatchFixtures, teardownAllBatchFixtures; add bootstrapOperator mutation gated by OPERATOR_BOOTSTRAP_KEY
- convex/reviewQueue.ts (MODIFY) - swap requireIdentity->requireOperator on retireDisposition and prepareRetryDisposition (coordinate approveDisposition with REDHAT-FIX-05)
- convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts (NEW)

**writeProhibited:**
- convex/curatedGeometryGate.ts - gate logic is out of scope
- convex/waterfallOrchestrator.ts, convex/actions/rideWorthinessClassifier.ts - guarding these is REDHAT-FIX-08's scope; only require them to call requireOperator
- Removing or narrowing any existing schema field or index
- Any RN/Expo/app client code

## READING LIST

- `convex/guards.ts` (1-89) — requireIdentity existence-only guard (15-28) to reuse; DEV_AUTH_BYPASS_KEY server-secret pattern (70-78) to mirror for the operator bootstrap
- `convex/errors.ts` (1-34) — ERROR_CODES.FORBIDDEN and UNAUTHENTICATED already defined — reuse, do not add new codes
- `convex/schema.ts` (43-52) — users/orgs/org_memberships table + index conventions to mirror for the additive operator_roles table
- `convex/couchVerdict.ts` (51-167,323-353) — recordCouchVerdict/clearCouchVerdicts/couchGateStatus/runAllWaterfall call sites that currently call only requireIdentity
- `convex/reviewQueue.ts` (316-398) — retireDisposition/prepareRetryDisposition call sites to guard (approveDisposition guard is coordinated with REDHAT-FIX-05)
- `shared/models/users.ts` (1-35) — validator-first model convention for defining the operator_roles validator
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — integration tier is PRIMARY for Convex backend auth tests

## CODE PATTERN

- Pattern: Server-owned capability guard — requireOperator(ctx) calls requireIdentity(ctx) then reads operator_roles by clerkUserId; throws ConvexError{code:FORBIDDEN} if absent. For actions (runAllWaterfall) that lack ctx.db, resolve via an internalQuery isOperator over operator_roles. Bootstrap the first operator through a mutation gated by env OPERATOR_BOOTSTRAP_KEY, mirroring guards.ts:70-78
- Pattern source: `convex/guards.ts:15-28,70-78`
- Anti-pattern: an existence-only requireIdentity treated as authorization; env-var-only role checks that cannot be exercised by a seeded non-operator user; a public unguarded grant mutation that lets any authenticated caller self-promote to operator

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-06-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; canonical operator authorization primitive
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-05, REDHAT-FIX-08, REDHAT-FIX-01

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
  "task_id": "REDHAT-FIX-06",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "operator-identity": { "description": "operator_roles row for clerkUserId 'founder-op-1'.", "seed_method": "public_api", "records": ["bootstrapOperator({key, clerkUserId:'founder-op-1', role:'founder'})"] },
    "non-operator-user": { "description": "A valid authenticated user with NO operator_roles row.", "seed_method": "public_api", "records": ["user upserted for clerkUserId 'plain-user-2', no operator_roles row"] },
    "existing-operator-couch-pass": { "description": "A couch_verdicts pass row already recorded by the operator.", "seed_method": "public_api", "records": ["recordCouchVerdict as 'founder-op-1' sampleId 'redhatfix06-sample' overallVerdict pass"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Non-operator authenticated caller is rejected from a trust-changing couch mutation", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator + operator_roles table)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["non-operator identity is accepted because the guard is still a requireIdentity-only stub", "the role lookup is mocked to always find an operator"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "operator-identity", "action": { "actor": "api_client", "steps": ["Seed operator-identity and non-operator-user", "Authenticate as 'plain-user-2'", "Call recordCouchVerdict", "Query operator_roles and couch_verdicts"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["couch_verdicts count with recordedBy == 'plain-user-2' > 0", "operator_roles row for 'plain-user-2' is present"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Seeded operator passes the guard and the guarded mutation succeeds", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator + recordCouchVerdict)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["requireOperator rejects a genuine operator (a mocked inverted guard)", "the couch_verdicts row is not written despite a passing guard (absent)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "operator-identity", "action": { "actor": "api_client", "steps": ["Seed operator-identity", "Authenticate as 'founder-op-1'", "Call recordCouchVerdict", "Query couch_verdicts"] },
          "end_state": { "must_observe": ["couch_verdicts.recordedBy == 'founder-op-1'"], "must_not_observe": ["recordedBy is empty", "no couch_verdicts row is present"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Unauthenticated caller is rejected before the role lookup", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator identity path)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["requireOperator skips the identity check (a stub) and jumps straight to a role lookup that silently returns false"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "operator-identity", "action": { "actor": "api_client", "steps": ["Seed operator-identity", "Invoke recordCouchVerdict with NO authenticated identity", "Query couch_verdicts"] },
          "end_state": { "must_observe": ["the call throws error.code == 'UNAUTHENTICATED'"], "must_not_observe": ["a new couch_verdicts row is present", "error.code == 'FORBIDDEN' (identity precedence not preserved)"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "clearCouchVerdicts is operator-gated and preserves rows for non-operators", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator + clearCouchVerdicts)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["clearCouchVerdicts still runs a requireIdentity-only stub and any authenticated user can wipe verdicts"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "existing-operator-couch-pass", "action": { "actor": "api_client", "steps": ["Seed existing-operator-couch-pass", "Authenticate as 'plain-user-2'", "Call clearCouchVerdicts()", "Query couch_verdicts for sampleId 'redhatfix06-sample'"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'", "couch_verdicts count for sampleId 'redhatfix06-sample' == 1 (still present)"], "must_not_observe": ["couch_verdicts count for sampleId 'redhatfix06-sample' == 0 (erased)"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "requireOperator throws FORBIDDEN for authenticated non-operator", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "no couch_verdicts row written on FORBIDDEN", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "operator passes guard, row written with correct recordedBy", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "unauthenticated caller gets UNAUTHENTICATED", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-3'" },
    { "id": "TC-5", "type": "test_criterion", "description": "non-operator clear is FORBIDDEN and row preserved", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX06-operator-guard.integration.test.ts -t 'AC-4'" }
  ]
}
-->

</details>
