# REDHAT-FIX-13 — Require operator/internal authorization for provider-costing waterfall and classifier operations (UC-REC-04, UC-VER-03)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-13 |
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
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX13-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

The four provider-costing action entry points — `runSampleWaterfall` (waterfallOrchestrator.ts), `runAllWaterfall` (couchVerdict.ts), `classifyRoute` and `classifyCatalog` (rideWorthinessClassifier.ts) — require an operator/founder identity (not merely any authenticated identity) before any paid Google Geocoding/Routes or LLM work runs, so a seeded non-operator authenticated user is rejected with FORBIDDEN before any cost is incurred. The public `failRouteIds` simulation argument on `classifyRoute`/`classifyCatalog` is gated behind `assertTestSubjectOrThrow`, so a production operator with a non-test subject cannot manufacture failed/no-evidence outcomes; only a test-prefix identity may exercise it.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST require operator/founder authorization on all four sites — runSampleWaterfall (waterfallOrchestrator.ts:801-812), runAllWaterfall (couchVerdict.ts:448-478), classifyRoute (rideWorthinessClassifier.ts:309-318), classifyCatalog (rideWorthinessClassifier.ts:354-366) — before any provider/LLM call
- MUST gate the failRouteIds simulation arg behind assertTestSubjectOrThrow(identity.clerkUserId): if failRouteIds is supplied, a non-test-subject caller (including a production operator) is rejected FORBIDDEN before classification runs
- MUST provide an action-compatible operator guard (actions have ActionCtx with no ctx.db) — resolve the role via an internalQuery over the users table rather than calling the DbCtx-only requireOperator directly

**NEVER**
- NEVER let a valid-but-non-operator authenticated identity reach a paid provider/LLM call on any of the four sites — this is the load-bearing property and the mandatory negative control
- NEVER leave failRouteIds reachable by a production/non-test identity (an authenticated user manufacturing failed outcomes is the exploit)
- NEVER weaken or remove requireIdentity; the operator check is strictly additive on top of it and unauthenticated callers still fail UNAUTHENTICATED first
- NEVER change the seam-gated runSampleWaterfallWithSeams entry (REDHAT-FIX-01 scope) or the whole-catalog pagination logic

**STRICTLY**
- STRICTLY apply the operator guard to exactly the four cited production entry points; do not broaden to internal/test-support functions
- STRICTLY the failRouteIds gate uses the caller's own identity subject via assertTestSubjectOrThrow — never a client-supplied flag

## DONE WHEN

- AC-1 [Non-operator is rejected from runSampleWaterfall before any provider work] [PRIMARY]: a seeded non-operator call throws FORBIDDEN and writes no curation artifact
- AC-2 [Non-operator is rejected from classifyCatalog before any whole-catalog paid work]: a seeded non-operator classifyCatalog throws FORBIDDEN and writes no classification rows
- AC-3 [Seeded operator passes all four guarded entry points]: an operator gets past the guard on runSampleWaterfall, runAllWaterfall, classifyRoute, and classifyCatalog
- AC-4 [failRouteIds is unreachable by a non-test operator identity]: an operator with a non-test subject supplying failRouteIds is rejected FORBIDDEN; a test-prefix identity may use it
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close the gap where any authenticated user can trigger paid provider/LLM work and manufacture failed outcomes: gate the four provider-costing action entry points behind operator/founder authorization and put the failRouteIds simulation arg behind assertTestSubjectOrThrow.

**Success state:** runSampleWaterfall, runAllWaterfall, classifyRoute, and classifyCatalog reject a seeded non-operator authenticated caller with FORBIDDEN before any cost is incurred; a seeded operator proceeds; failRouteIds is reachable only by a test-prefix identity.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `operator-identity` (seed_method: `public_api`): An authenticated operator/founder — a users row with role 'operator' (or 'founder').
    - users row upserted for clerkUserId `'s4t13-operator'` with role `'operator'`
- `non-operator-user` (seed_method: `public_api`): A valid authenticated user with no operator/founder role (defaults to rider).
    - users row upserted for clerkUserId `'plain-user-13'` with no role
- `test-subject-operator` (seed_method: `public_api`): An operator whose subject is a test prefix, permitted to exercise the failRouteIds seam.
    - users row upserted for clerkUserId `'test:cost-authz-op'` with role `'operator'`
- `classifiable-route` (seed_method: `public_api`): A curated_routes row usable as the classifyRoute/runSampleWaterfall target.
    - curated_routes row routeId `'test:redhatfix13-001'` with generated geometry

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Non-operator is rejected from runSampleWaterfall before any provider work

**Requirement:** GIVEN a seeded non-operator authenticated user 'plain-user-13' and a classifiable route WHEN 'plain-user-13' calls runSampleWaterfall with a cost limit THEN the operator guard throws ConvexError{code:'FORBIDDEN'} before any provider/LLM call and no curation_artifacts row is written for the target route

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real operator guard + runSampleWaterfall action)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: runSampleWaterfall still calls only requireIdentity so any authenticated user reaches executeWaterfall; the operator lookup is mocked to always pass
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `non-operator-user`
  - ACTION: Seed classifiable-route and non-operator-user; authenticate as 'plain-user-13'; call runSampleWaterfall({ routeIds:['test:redhatfix13-001'], maxCost:1 }); query curation_artifacts for routeId 'test:redhatfix13-001'
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: curation_artifacts count for routeId 'test:redhatfix13-001' > 0; any provider/LLM cost recorded for the non-operator call

### AC-2 — Non-operator is rejected from classifyCatalog before any whole-catalog paid work

**Requirement:** GIVEN a seeded non-operator authenticated user 'plain-user-13' WHEN 'plain-user-13' calls classifyCatalog with no routeIds (whole-catalog mode) THEN the operator guard throws FORBIDDEN before enumeration and no classification rows are written

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real operator guard + classifyCatalog action)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: classifyCatalog still calls only requireIdentity and a non-operator triggers whole-catalog paid classification; the guard runs after enumeration has already started
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `non-operator-user`
  - ACTION: Seed non-operator-user and a small catalog; authenticate as 'plain-user-13'; call classifyCatalog({}) (whole-catalog mode); query the classification run/verdict rows produced
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: any classification run row attributable to 'plain-user-13'; whole-catalog enumeration proceeding past the guard

### AC-3 — Seeded operator passes all four guarded entry points

**Requirement:** GIVEN a seeded operator 's4t13-operator' and a classifiable route WHEN the operator calls runSampleWaterfall, runAllWaterfall, classifyRoute, and classifyCatalog THEN the operator guard resolves on every site (no FORBIDDEN) and each call proceeds past authorization

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real operator guard across all four entry points)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the operator guard rejects a genuine operator (inverted guard); one of the four sites is left on requireIdentity and behaves differently from the others
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-identity`
  - ACTION: Seed operator-identity and classifiable-route; authenticate as 's4t13-operator'; call classifyRoute for the target route and capture the result; call runSampleWaterfall/runAllWaterfall/classifyCatalog and capture that none throw FORBIDDEN
  - MUST_OBSERVE: no call throws error.code == 'FORBIDDEN'; classifyRoute proceeds past authorization for 's4t13-operator'
  - MUST_NOT_OBSERVE: any of the four sites rejects the operator with FORBIDDEN; a site still admitting a non-operator (guard not applied)

### AC-4 — failRouteIds is unreachable by a non-test operator identity

**Requirement:** GIVEN a production operator with a non-test subject and a test-prefix operator WHEN each supplies failRouteIds to classifyRoute/classifyCatalog THEN the non-test operator is rejected FORBIDDEN by assertTestSubjectOrThrow while the test-prefix identity may use failRouteIds

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real assertTestSubjectOrThrow gating on failRouteIds)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: failRouteIds is honored for a non-test operator subject so a production caller manufactures a failed outcome; the gate keys off a client-supplied flag rather than the caller's identity subject
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `test-subject-operator`
  - ACTION: Seed operator-identity (non-test subject 's4t13-operator') and test-subject-operator ('test:cost-authz-op'); as 's4t13-operator' call classifyRoute({ routeId, failRouteIds:[routeId] }) and capture the error; as 'test:cost-authz-op' call classifyRoute({ routeId, failRouteIds:[routeId] }) and capture the result; query the resulting classification verdict rows
  - MUST_OBSERVE: non-test operator call throws error.code == 'FORBIDDEN' (test-only seam); test-prefix operator call is permitted to exercise failRouteIds
  - MUST_NOT_OBSERVE: a non-test operator manufacturing a failed/no-evidence outcome via failRouteIds; failRouteIds honored without checking the caller's identity subject

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | runSampleWaterfall throws FORBIDDEN for a non-operator and writes no curation artifact | AC-1 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-1'` |
| TC-2 | classifyCatalog throws FORBIDDEN for a non-operator before enumeration | AC-2 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-2'` |
| TC-3 | runAllWaterfall throws FORBIDDEN for a non-operator | AC-2 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-2'` |
| TC-4 | operator passes the guard on all four entry points (no FORBIDDEN) | AC-3 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-3'` |
| TC-5 | failRouteIds throws FORBIDDEN for a non-test operator subject | AC-4 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-4'` |
| TC-6 | failRouteIds is permitted for a test-prefix identity | AC-4 | `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/waterfallOrchestrator.ts (MODIFY) - swap requireIdentity -> action-compatible operator guard on runSampleWaterfall (leave runSampleWaterfallWithSeams unchanged)
- convex/couchVerdict.ts (MODIFY) - swap requireIdentity -> operator guard on runAllWaterfall (do NOT touch couchGateStatus gate-derivation logic — that is FIX-14/FIX-15 scope)
- convex/actions/rideWorthinessClassifier.ts (MODIFY) - swap requireIdentity -> operator guard on classifyRoute/classifyCatalog; gate failRouteIds behind assertTestSubjectOrThrow
- convex/guards.ts (MODIFY, additive only) - add an ActionCtx-compatible operator guard (e.g. requireOperatorAction) resolving role via an internalQuery over users
- convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts couchGateStatus manifest/drift logic - REDHAT-FIX-14/REDHAT-FIX-15 scope
- convex/waterfallOrchestrator.ts runSampleWaterfallWithSeams / executeWaterfall internals - REDHAT-FIX-01 scope
- Removing or narrowing any existing schema field/index or the whole-catalog pagination logic
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules (mandatory per CLAUDE.md); action vs mutation ctx capabilities
- `convex/guards.ts` (20-34,108-155,168-193) — requireIdentity, requireOperator (DbCtx-only), resolveRole, assertTestSubjectOrThrow/TEST_SUBJECT_PREFIXES — the action-compatible variant must mirror resolveRole via an internalQuery
- `convex/waterfallOrchestrator.ts` (801-835) — runSampleWaterfall requireIdentity-only guard (809) to swap; runSampleWaterfallWithSeams already correctly asserts test subject (leave as-is)
- `convex/couchVerdict.ts` (448-478) — runAllWaterfall requireIdentity-only guard (454) to swap; couchGateStatus call is downstream and out of scope
- `convex/actions/rideWorthinessClassifier.ts` (305-390) — classifyRoute (315) and classifyCatalog (365) requireIdentity-only guards to swap; failRouteIds args (312,357) to gate behind assertTestSubjectOrThrow
- `convex/errors.ts` (1-34) — ERROR_CODES.FORBIDDEN / UNAUTHENTICATED already defined — reuse, do not add new codes

## CODE PATTERN

- Pattern: Action-compatible operator guard: `requireOperatorAction(ctx)` awaits `requireIdentity(ctx)` then `ctx.runQuery(internal.guards.isOperator,{clerkUserId})` which reads the users role over the users index; throws FORBIDDEN if not founder|operator. Apply it as the first statement on all four action handlers before any provider/LLM work. For failRouteIds: `if (failRouteIds) assertTestSubjectOrThrow(identity.clerkUserId)` immediately after the operator guard.
- Pattern source: `convex/guards.ts:108-155` (resolveRole/requireOperator) + `convex/guards.ts:184-193` (assertTestSubjectOrThrow) + `convex/waterfallOrchestrator.ts:830-833` (test-subject gating precedent)
- Anti-pattern: existence-only requireIdentity treated as authorization on a paid provider entry point; honoring failRouteIds for any authenticated (or any operator) caller; calling the DbCtx-only requireOperator directly from an ActionCtx (won't typecheck)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-13-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; action-compatible operator gating on provider-costing entry points
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (non-operator reached provider work under the old requireIdentity-only guard)
- Integration coverage: PRIMARY AC is integration against the real Convex dev deployment
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows FORBIDDEN + zero artifacts for the non-operator

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Coordinate with REDHAT-FIX-06 (which applied requireOperator to couch/review mutations and explicitly left these 4 production entry points to REDHAT-FIX-08's scope) and REDHAT-FIX-08 (fixture/cleanup seam lockdown) — verified FIX-08 is scoped to fixture/cleanup seams, not these production entries, confirming this is a genuine open gap. Coordinate with REDHAT-FIX-14, which also touches guards.ts imports in couchVerdict.ts, but on different functions (runAllWaterfall here vs storeCouchSample/couchGateStatus there) so they can run independently; if landed together, merge the guards.ts additive changes.

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
  "task_id": "REDHAT-FIX-13",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "operator-identity": { "description": "An authenticated operator/founder.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 's4t13-operator' with role 'operator'"] },
    "non-operator-user": { "description": "A valid authenticated user with no operator/founder role.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 'plain-user-13' with no role"] },
    "test-subject-operator": { "description": "An operator whose subject is a test prefix, permitted to exercise failRouteIds.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 'test:cost-authz-op' with role 'operator'"] },
    "classifiable-route": { "description": "A curated_routes row usable as the classifyRoute/runSampleWaterfall target.", "seed_method": "public_api", "records": ["curated_routes row routeId 'test:redhatfix13-001' with generated geometry"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Non-operator is rejected from runSampleWaterfall before any provider work", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real operator guard + runSampleWaterfall action)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["runSampleWaterfall still calls only requireIdentity so any authenticated user reaches executeWaterfall", "the operator lookup is mocked to always pass"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "non-operator-user", "action": { "actor": "api_client", "steps": ["Seed classifiable-route and non-operator-user", "Authenticate as 'plain-user-13'", "Call runSampleWaterfall({ routeIds:['test:redhatfix13-001'], maxCost:1 })", "Query curation_artifacts for routeId 'test:redhatfix13-001'"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["curation_artifacts count for routeId 'test:redhatfix13-001' > 0", "any provider/LLM cost recorded for the non-operator call"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Non-operator is rejected from classifyCatalog before any whole-catalog paid work", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real operator guard + classifyCatalog action)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["classifyCatalog still calls only requireIdentity and a non-operator triggers whole-catalog paid classification", "the guard runs after enumeration has already started"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "non-operator-user", "action": { "actor": "api_client", "steps": ["Seed non-operator-user and a small catalog", "Authenticate as 'plain-user-13'", "Call classifyCatalog({}) (whole-catalog mode)", "Query the classification run/verdict rows produced"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["any classification run row attributable to 'plain-user-13'", "whole-catalog enumeration proceeding past the guard"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Seeded operator passes all four guarded entry points", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real operator guard across all four entry points)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the operator guard rejects a genuine operator (inverted guard)", "one of the four sites is left on requireIdentity and behaves differently from the others"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "operator-identity", "action": { "actor": "api_client", "steps": ["Seed operator-identity and classifiable-route", "Authenticate as 's4t13-operator'", "Call classifyRoute for the target route and capture the result", "Call runSampleWaterfall/runAllWaterfall/classifyCatalog and capture that none throw FORBIDDEN"] },
          "end_state": { "must_observe": ["no call throws error.code == 'FORBIDDEN'", "classifyRoute proceeds past authorization for 's4t13-operator'"], "must_not_observe": ["any of the four sites rejects the operator with FORBIDDEN", "a site still admitting a non-operator (guard not applied)"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "failRouteIds is unreachable by a non-test operator identity", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real assertTestSubjectOrThrow gating on failRouteIds)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["failRouteIds is honored for a non-test operator subject so a production caller manufactures a failed outcome", "the gate keys off a client-supplied flag rather than the caller's identity subject"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "test-subject-operator", "action": { "actor": "api_client", "steps": ["Seed operator-identity (non-test subject 's4t13-operator') and test-subject-operator ('test:cost-authz-op')", "As 's4t13-operator' call classifyRoute({ routeId, failRouteIds:[routeId] }) and capture the error", "As 'test:cost-authz-op' call classifyRoute({ routeId, failRouteIds:[routeId] }) and capture the result", "Query the resulting classification verdict rows"] },
          "end_state": { "must_observe": ["non-test operator call throws error.code == 'FORBIDDEN' (test-only seam)", "test-prefix operator call is permitted to exercise failRouteIds"], "must_not_observe": ["a non-test operator manufacturing a failed/no-evidence outcome via failRouteIds", "failRouteIds honored without checking the caller's identity subject"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "runSampleWaterfall throws FORBIDDEN for a non-operator and writes no curation artifact", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "classifyCatalog throws FORBIDDEN for a non-operator before enumeration", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "runAllWaterfall throws FORBIDDEN for a non-operator", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "operator passes the guard on all four entry points (no FORBIDDEN)", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-3'" },
    { "id": "TC-5", "type": "test_criterion", "description": "failRouteIds throws FORBIDDEN for a non-test operator subject", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-4'" },
    { "id": "TC-6", "type": "test_criterion", "description": "failRouteIds is permitted for a test-prefix identity", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX13-provider-cost-authz.integration.test.ts -t 'AC-4'" }
  ]
}
-->

</details>
