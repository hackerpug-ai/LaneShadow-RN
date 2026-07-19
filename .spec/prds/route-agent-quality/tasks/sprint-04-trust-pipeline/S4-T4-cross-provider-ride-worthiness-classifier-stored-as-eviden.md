# S4-T4 — Cross-provider ride-worthiness classifier stored as evidence (UC-VER-03) (UC-VER-03)
> Status: ✅ Completed
> Commit: c5c2d9bf
> Reviewer: convex-reviewer
> Completed: 2026-07-18T06:11:31Z

| Field | Value |
|-------|-------|
| TASK_ID | S4-T4 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-VER-03, CAP-GEO-01 |
| DEPENDS_ON | S4-T1 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Classifier runs on all catalog routes using z.ai GLM-5.2 provider; verdict stored as rideWorthiness field; not_a_ride routes have rider-ready withheld; FHWA freeway segments are classified but not surfaced; marginal verdict never auto-retires

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST use DIFFERENT LLM provider than anchor extraction (z.ai GLM-5.2 vs OpenAI gpt-4.1)
- MUST store verdict as rideWorthiness field on route doc (at-rest evidence)
- MUST integrate verdict into computeRiderReadyFromDoc (not_a_ride → riderReady=false)
- MUST run classifier over EVERY route including FHWA freeway segments and recovered rows
- MUST NEVER compute verdict at read-time (stored evidence only)
- MUST NEVER auto-retire routes with marginal verdict

**NEVER**
- NEVER use same provider as anchor extraction (violates decorrelation)
- NEVER compute verdict transiently at read-time (must be stored evidence)
- NEVER auto-retire routes based on marginal verdict
- NEVER stub classifier to always return 'ride'
- NEVER skip FHWA freeway segments or recovered rows

**STRICTLY**
- STRICTLY classifier uses z.ai GLM-5.2 (alternate provider to anchor extraction's OpenAI gpt-4.1)
- STRICTLY verdict is stored in rideWorthiness field (verdict + reason + provider + timestamp)
- STRICTLY not_a_ride verdict withholds rider-ready even with valid geometry
- STRICTLY marginal verdict affects rider-ready computation but never triggers retirement
- STRICTLY classification happens once per route (stored verdict, not read-time computation)

## DONE WHEN

- AC-1 [Classifier runs on all catalog routes and stores verdict as evidence [PRIMARY HAPPY]] [PRIMARY]: Every route receives a stored rideWorthiness verdict (ride/marginal/not_a_ride) with reason, provider=z.ai-glm-5.2, and timestamp
- AC-2 [FHWA freeway segments classified as not_a_ride but still receive geometry attempt [EDGE CASE]] [PRIMARY]: Verdict stored as not_a_ride with reason explaining it's a freeway; geometry attempt still proceeds (rescue-first); riderReady withheld due to verdict
- AC-3 [Valid geometry routes with not_a_ride verdict have rider-ready withheld [EDGE CASE]] [PRIMARY]: riderReady computed as false because not_a_ride verdict blocks rider-ready despite valid geometry
- AC-4 [Classifier failures are handled gracefully without blocking pipeline [ERROR CASE]] [PRIMARY]: Error is logged, route is left without verdict (no crash), pipeline continues to next route
- AC-5 [Marginal verdict never auto-retires a route [CRITICAL GUARDRAIL]] [PRIMARY]: Route is NOT auto-retired; marginal verdict only affects rider-ready computation, never triggers retirement logic
- AC-6 [Classifier uses different provider than anchor extraction (decorrelation) [CROSS-PROVIDER]] [PRIMARY]: Classifier uses z.ai GLM-5.2 provider (alternate provider) and stamps provider field to prove decorrelation
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Build a cross-provider ride-worthiness classifier that judges 'is this actually a motorcycle ride?' across the entire catalog, stores verdict as evidence, and integrates the verdict into rider-ready computation

**Success state:** Classifier runs on all catalog routes using z.ai GLM-5.2 provider; verdict stored as rideWorthiness field; not_a_ride routes have rider-ready withheld; FHWA freeway segments are classified but not surfaced; marginal verdict never auto-retires

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `seedCatalogWithMixedRows` (seed_method: `public_api`): Seeds catalog with 2 twisty routes, 1 FHWA freeway segment, 1 recovered row for classifier coverage testing
    - {'routeId': 'test:ver-twisty-1', 'name': 'Twisty Canyon Road', 'source': 'motorcycleroads', 'lengthMiles': 41, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-twisty-2', 'name': 'Pacific Coast Highway Segment', 'source': 'editorial', 'lengthMiles': 28, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-freeway-fhwa', 'name': 'I-40 Arizona Segment', 'source': 'fhwa', 'lengthMiles': 245, 'geometryStatus': 'unresolved'}
    - {'routeId': 'test:ver-recovered-row', 'name': 'Recovered Mountain Pass', 'source': 'scenic_byways', 'lengthMiles': 35, 'geometryStatus': 'review'}
- `seedFHWAFreewayRow` (seed_method: `public_api`): Seeds FHWA freeway segment for not_a_ride classification testing
    - {'routeId': 'test:ver-freeway-i40', 'name': 'I-40 Arizona', 'source': 'fhwa', 'highwayNumber': 'i-40', 'lengthMiles': 245, 'geometryStatus': 'unresolved'}
- `seedValidGeometryNotARide` (seed_method: `public_api`): Seeds route with gate-passing geometry but not_a_ride verdict for rider-ready withholding test
    - {'routeId': 'test:ver-geom-good-not-ride', 'name': 'Valid Geometry Not A Ride', 'lengthMiles': 41, 'geometryStatus': 'generated', 'rideWorthiness': {'verdict': 'not_a_ride', 'reason': 'Classified as non-motorcycle road', 'model': 'z.ai-glm-5.2', 'classifiedAt': 1718000000000}}
- `seedRoutesForErrorTesting` (seed_method: `public_api`): Seeds 5 routes for classifier error handling testing (route 3 will fail)
    - {'routeId': 'test:ver-error-1', 'name': 'Error Test Route 1', 'lengthMiles': 41, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-error-2', 'name': 'Error Test Route 2', 'lengthMiles': 41, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-error-3', 'name': 'Error Test Route 3 (will fail)', 'lengthMiles': 41, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-error-4', 'name': 'Error Test Route 4', 'lengthMiles': 41, 'geometryStatus': 'generated'}
    - {'routeId': 'test:ver-error-5', 'name': 'Error Test Route 5', 'lengthMiles': 41, 'geometryStatus': 'generated'}
- `seedMarginalVerdictRoute` (seed_method: `public_api`): Seeds route with marginal verdict for auto-retirement guardrail testing
    - {'routeId': 'test:ver-marginal-no-retire', 'name': 'Marginal Verdict Route', 'lengthMiles': 41, 'compositeScore': 0.45, 'retiredAt': None, 'rideWorthiness': {'verdict': 'marginal', 'reason': 'Borderline motorcycle road', 'model': 'z.ai-glm-5.2', 'classifiedAt': 1718000000000}}

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Classifier runs on all catalog routes and stores verdict as evidence [PRIMARY HAPPY]

**Requirement:** GIVEN A catalog of 5,654+ routes including twisties, FHWA freeways, and recovered rows with mixed geometryStatus states WHEN The ride-worthiness classifier action executes over the entire catalog THEN Every route receives a stored rideWorthiness verdict (ride/marginal/not_a_ride) with reason, provider=z.ai-glm-5.2, and timestamp

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real classifier action + z.ai GLM-5.2 provider + real catalog rows)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-classify-catalog.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Classifier stubbed to always return 'ride' for every route; Verdict computed at read-time instead of stored; Classification skipped for FHWA freeway segments; Missing provider field prevents decorrelation verification
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `seedCatalogWithMixedRows`
    - ACTION (api_client): Seed catalog with: 2 twisty routes, 1 FHWA freeway segment, 1 recovered row; Execute rideWorthinessClassifier.classifyCatalog action; Query curated_routes for rideWorthiness verdicts
    - MUST_OBSERVE: All 4 routes have rideWorthiness.verdict in ['ride', 'marginal', 'not_a_ride'], All rideWorthiness.provider == 'z.ai-glm-5.2' (different from anchor provider), All rideWorthiness.timestamp > 0 (classified within last hour), FHWA freeway segment has verdict (classification not skipped), Twisty routes have verdict='ride' (classifier recognizes motorcycle roads)
    - MUST_NOT_OBSERVE: Any route with rideWorthiness == null (missing verdict), Any route with rideWorthiness.provider == 'gpt-4.1' (same as anchors), FHWA freeway segment skipped (no verdict)

### AC-2 [PRIMARY] — FHWA freeway segments classified as not_a_ride but still receive geometry attempt [EDGE CASE]

**Requirement:** GIVEN An FHWA freeway segment (source='fhwa', name='I-40', lengthMiles=245) with geometryStatus='unresolved' WHEN The classifier processes this route and the geometry pipeline runs THEN Verdict stored as not_a_ride with reason explaining it's a freeway; geometry attempt still proceeds (rescue-first); riderReady withheld due to verdict

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real classifier + FHWA freeway seed row)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-freeway-classification.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Classifier skips FHWA freeways (no verdict stored); Classifier returns 'ride' for freeway (misclassification); Geometry pipeline skips routes with not_a_ride verdict (violates rescue-first)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `seedFHWAFreewayRow`
    - ACTION (api_client): Seed FHWA freeway: routeId='fhwa:i-40-az', source='fhwa', name='I-40', geometryStatus='unresolved'; Execute rideWorthinessClassifier.classifyRoute for this routeId; Query route for rideWorthiness and geometryStatus
    - MUST_OBSERVE: rideWorthiness.verdict == 'not_a_ride', rideWorthiness.reason contains 'freeway' or 'interstate' (rationale explains classification), geometryStatus != null (geometry attempt still proceeded), riderReady == false (withheld due to not_a_ride verdict)
    - MUST_NOT_OBSERVE: rideWorthiness == null (freeway was not skipped), rideWorthiness.verdict == 'ride' (freeway correctly classified as not_a_ride), geometryStatus == 'unresolved' with no attempt (geometry pipeline ran)

### AC-3 [PRIMARY] — Valid geometry routes with not_a_ride verdict have rider-ready withheld [EDGE CASE]

**Requirement:** GIVEN A route with gate-passing geometry (geometryStatus='generated', verification.verdict='pass') but classifier judges it not_a_ride WHEN computeRiderReadyFromDoc evaluates this route THEN riderReady computed as false because not_a_ride verdict blocks rider-ready despite valid geometry

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real classifier + rider-ready computation)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-rideReady-withheld.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: riderReady computed as true (not_a_ride should withhold); computeRiderReadyFromDoc ignores rideWorthiness field; Valid geometry overrides not_a_ride verdict (gating bypass)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `seedValidGeometryNotARide`
    - ACTION (api_client): Seed route with: geometryStatus='generated', verification.verdict='pass', rideWorthiness.verdict='not_a_ride'; Execute internal.curatedGeometry.recomputeRiderReadyForRoute; Query route for riderReady field
    - MUST_OBSERVE: riderReady == false (withheld due to not_a_ride verdict), geometryStatus == 'generated' (valid geometry still present), verification.verdict == 'pass' (gate passed)
    - MUST_NOT_OBSERVE: riderReady == true (not_a_ride should withhold rider-ready), geometryStatus changed (valid geometry preserved), rideWorthiness missing or ignored

### AC-4 [PRIMARY] — Classifier failures are handled gracefully without blocking pipeline [ERROR CASE]

**Requirement:** GIVEN The classifier action encounters provider errors (rate limits, network failures) or malformed inputs WHEN A classification attempt fails for a specific route THEN Error is logged, route is left without verdict (no crash), pipeline continues to next route

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (simulated classifier failures)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-classifier-error-handling.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Classifier crash stops entire pipeline; Error causes transaction rollback of other route verdicts; No error logging for debugging classifier issues
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `seedRoutesForErrorTesting`
    - ACTION (api_client): Seed 5 routes; mock classifier to fail on route 3 only; Execute classifyCatalog action; Query performance table for error logs; Query curated_routes for verdicts
    - MUST_OBSERVE: Routes 1, 2, 4, 5 have rideWorthiness verdicts (pipeline continued), Route 3 has rideWorthiness == null (no verdict due to error), performance table contains error log for route 3 failure, Action completes without throwing (graceful handling)
    - MUST_NOT_OBSERVE: Entire action failed/crashed (individual errors isolated), Routes 1, 2, 4, 5 missing verdicts (pipeline stopped at route 3), No error logging (opaque failures)

### AC-5 [PRIMARY] — Marginal verdict never auto-retires a route [CRITICAL GUARDRAIL]

**Requirement:** GIVEN A route with rideWorthiness.verdict='marginal' and compositeScore=0.45 (below threshold) WHEN Any pipeline handler or migration evaluates this route for retirement THEN Route is NOT auto-retired; marginal verdict only affects rider-ready computation, never triggers retirement logic

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real marginal verdict + retirement checks)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-marginal-no-autoretire.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Marginal verdict sets retiredAt timestamp (auto-retire violation); Low compositeScore + marginal verdict triggers retirement (double-penalty); Retirement logic checks rideWorthiness for marginal (should only check explicit retirement criteria)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `seedMarginalVerdictRoute`
    - ACTION (api_client): Seed route with: rideWorthiness.verdict='marginal', compositeScore=0.45, retiredAt=null; Execute any handler that might check retirement (e.g., score-based filtering); Query route for retiredAt field
    - MUST_OBSERVE: retiredAt == null (no auto-retirement occurred), rideWorthiness.verdict == 'marginal' (verdict unchanged), compositeScore == 0.45 (score unchanged)
    - MUST_NOT_OBSERVE: retiredAt > 0 (route was auto-retired - violation), retiredAt set due to marginal verdict (critical guardrail failure), Score changed (retirement should not modify scores)

### AC-6 [PRIMARY] — Classifier uses different provider than anchor extraction (decorrelation) [CROSS-PROVIDER]

**Requirement:** GIVEN Anchor extraction uses OpenAI gpt-4.1 (from models.ts MODEL_MAP.high) WHEN The ride-worthiness classifier is invoked THEN Classifier uses z.ai GLM-5.2 provider (alternate provider) and stamps provider field to prove decorrelation

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real z.ai GLM-5.2 provider vs OpenAI gpt-4.1 anchors)
- FLOW_REF: UC-VER-03
- VERIFY: `pnpm test convex/__tests__/S4T4-cross-provider-decorrelation.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Classifier uses same provider as anchors (no decorrelation); Provider field missing from verdict (can't verify decorrelation); Both classifiers use gpt-4.1 (shared blind spots)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `compareProviderMetadata`
    - ACTION (api_client): Query models.ts MODEL_MAP.high to confirm anchor provider; Execute rideWorthinessClassifier.classifyRoute; Query route for rideWorthiness.provider field
    - MUST_OBSERVE: rideWorthiness.provider contains 'z.ai' or 'glm-5.2' (alternate provider), rideWorthiness.provider != 'gpt-4.1' (different from anchor provider), Provider field present (decorrelation verifiable)
    - MUST_NOT_OBSERVE: rideWorthiness.provider == 'gpt-4.1' (same as anchors - no decorrelation), Provider field missing (can't verify decorrelation), Both classifiers use identical provider strings

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Classifier action completes without throwing for catalog of 100+ mixed route types | AC-1 | `pnpm test convex/__tests__/S4T4-classify-catalog.integration.test.ts` |
| TC-2 | FHWA freeway segment receives not_a_ride verdict and geometry still processes | AC-2 | `pnpm test convex/__tests__/S4T4-freeway-classification.integration.test.ts` |
| TC-3 | Route with valid geometry but not_a_ride verdict has riderReady withheld | AC-3 | `pnpm test convex/__tests__/S4T4-rideReady-withheld.integration.test.ts` |
| TC-4 | Classifier error on single route does not crash pipeline or rollback other verdicts | AC-4 | `pnpm test convex/__tests__/S4T4-classifier-error-handling.integration.test.ts` |
| TC-5 | Route with marginal verdict never has retiredAt timestamp set by any pipeline handler | AC-5 | `pnpm test convex/__tests__/S4T4-marginal-no-autoretire.integration.test.ts` |
| TC-6 | Classifier provider field differs from anchor extraction provider (decorrelation proven) | AC-6 | `pnpm test convex/__tests__/S4T4-cross-provider-decorrelation.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/rideWorthinessClassifier.ts (NEW - classifier action)
- convex/curatedGeometry.ts (MODIFY - integrate verdict into recomputeRiderReady)
- convex/schema.ts (MODIFY - rideWorthiness evidence field)
- convex/__tests__/S4T4-*.integration.test.ts (NEW - integration tests)
- convex/curatedGeometryTestSupport.ts (MODIFY - extend seed helpers for FHWA freeway + recovered rows)

**writeProhibited:**
- Gate modules (curatedGeometryGate.ts - out of scope for this task)
- RN app code (UI layer - not touched by this backend task)
- Transient/read-time verdict computation (must be stored evidence only)
- Provider field manipulation (must preserve original provider string for decorrelation verification)
- Auto-retirement logic based on marginal verdict (critical guardrail violation)

## READING LIST

- `/Users/justinrich/Projects/LaneShadow-RN/convex/actions/agent/lib/models.ts` (1-64) — Mastra model router with IntelligenceLevel mapping, getAgentModel/getAgentModelInfo functions, MODEL_MAP provider+model tuples, getOrchestratorModel string tier
- `/Users/justinrich/Projects/LaneShadow-RN/convex/actions/agent/lib/zaiProvider.ts` (1-206) — z.ai OpenAI-compatible provider, ZAI_BASE_URL, ZAI_MODEL_ID=glm-5.2, createZaiProvider function, zaiStructuredComplete function with structured output + text-fallback ladder
- `/Users/justinrich/Projects/LaneShadow-RN/convex/curatedGeometry.ts` (406-533) — computeRiderReadyFromDoc function integrating rideWorthiness verdict, recomputeRiderReady mutation, persistGeometryVerified mutation, riderReady gate logic
- `/Users/justinrich/Projects/LaneShadow-RN/shared/models/curated-routes.ts` (157-163) — rideWorthiness field structure with verdict (ride/marginal/not_a_ride), reason, model, classifiedAt timestamp
- `/Users/justinrich/Projects/LaneShadow-RN/convex/schema.ts` (187-200) — curated_routes table definition with rideWorthiness field, indexes for querying
- `/Users/justinrich/Projects/LaneShadow-RN/convex/curatedGeometryTestSupport.ts` (1-200) — insertTestRoute helper, seedPoCRoute pattern, rideWorthiness field seeding in test fixtures, runId-namespaced seed helpers for concurrent test isolation
- `/Users/justinrich/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/06-uc-ver.md` (54-67) — UC-VER-03 acceptance criteria: classify across catalog, record verdict, withhold rider-ready, cross-provider, store as evidence, founder review
- `/Users/justinrich/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/SPRINT.md` (1-100) — Sprint 04 trust pipeline context, S4-T4 positioning, dependencies on S4-T1, parallel execution with S4-T2/S4-T3

## CODE PATTERN

- Pattern: LLM classifier with cross-provider decorrelation pattern
- Pattern source: `Sprint 02 Mastra model layer (models.ts) + Sprint 02 z.ai provider spike (zaiProvider.ts)`
- Anti-pattern: Same-provider classifier or read-time verdict computation (both violate requirements)

## VERIFICATION GATES

- Integration tests pass against Convex dev deployment: `pnpm test convex/__tests__/S4T4-*.integration.test.ts` → Exit 0 with all 6 AC scenarios passing
- Classifier uses different provider than anchors: `grep -r 'zai-glm-5.2' convex/actions/rideWorthinessClassifier.ts && grep -r 'gpt-4.1' convex/actions/agent/lib/models.ts | grep MODEL_MAP.high` → Both patterns found (proves cross-provider setup)
- No auto-retirement based on marginal verdict: `grep -r 'retiredAt' convex/curatedGeometry.ts | grep -v 'marginal'` → No retirement logic conditional on marginal verdict

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - builds ride-worthiness classifier action, integrates verdict into rider-ready computation, stores evidence at rest
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S4-T1
- Blocks: —

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T4",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "seedCatalogWithMixedRows": {
      "description": "Seeds catalog with 2 twisty routes, 1 FHWA freeway segment, 1 recovered row for classifier coverage testing",
      "seed_method": "public_api",
      "records": [
        {
          "routeId": "test:ver-twisty-1",
          "name": "Twisty Canyon Road",
          "source": "motorcycleroads",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-twisty-2",
          "name": "Pacific Coast Highway Segment",
          "source": "editorial",
          "lengthMiles": 28,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-freeway-fhwa",
          "name": "I-40 Arizona Segment",
          "source": "fhwa",
          "lengthMiles": 245,
          "geometryStatus": "unresolved"
        },
        {
          "routeId": "test:ver-recovered-row",
          "name": "Recovered Mountain Pass",
          "source": "scenic_byways",
          "lengthMiles": 35,
          "geometryStatus": "review"
        }
      ]
    },
    "seedFHWAFreewayRow": {
      "description": "Seeds FHWA freeway segment for not_a_ride classification testing",
      "seed_method": "public_api",
      "records": [
        {
          "routeId": "test:ver-freeway-i40",
          "name": "I-40 Arizona",
          "source": "fhwa",
          "highwayNumber": "i-40",
          "lengthMiles": 245,
          "geometryStatus": "unresolved"
        }
      ]
    },
    "seedValidGeometryNotARide": {
      "description": "Seeds route with gate-passing geometry but not_a_ride verdict for rider-ready withholding test",
      "seed_method": "public_api",
      "records": [
        {
          "routeId": "test:ver-geom-good-not-ride",
          "name": "Valid Geometry Not A Ride",
          "lengthMiles": 41,
          "geometryStatus": "generated",
          "rideWorthiness": {
            "verdict": "not_a_ride",
            "reason": "Classified as non-motorcycle road",
            "model": "z.ai-glm-5.2",
            "classifiedAt": 1718000000000
          }
        }
      ]
    },
    "seedRoutesForErrorTesting": {
      "description": "Seeds 5 routes for classifier error handling testing (route 3 will fail)",
      "seed_method": "public_api",
      "records": [
        {
          "routeId": "test:ver-error-1",
          "name": "Error Test Route 1",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-error-2",
          "name": "Error Test Route 2",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-error-3",
          "name": "Error Test Route 3 (will fail)",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-error-4",
          "name": "Error Test Route 4",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        },
        {
          "routeId": "test:ver-error-5",
          "name": "Error Test Route 5",
          "lengthMiles": 41,
          "geometryStatus": "generated"
        }
      ]
    },
    "seedMarginalVerdictRoute": {
      "description": "Seeds route with marginal verdict for auto-retirement guardrail testing",
      "seed_method": "public_api",
      "records": [
        {
          "routeId": "test:ver-marginal-no-retire",
          "name": "Marginal Verdict Route",
          "lengthMiles": 41,
          "compositeScore": 0.45,
          "retiredAt": null,
          "rideWorthiness": {
            "verdict": "marginal",
            "reason": "Borderline motorcycle road",
            "model": "z.ai-glm-5.2",
            "classifiedAt": 1718000000000
          }
        }
      ]
    }
  },
  "requirements": [
    {
      "id": "R-AC-1",
      "source": "AC-1",
      "type": "functional",
      "statement": "System MUST run ride-worthiness classifier over every route in the catalog, including FHWA freeway segments and recovered rows, and store verdict as rideWorthiness field with reason, provider, and timestamp",
      "verification_method": "integration test against real Convex dev deployment",
      "priority": "P0"
    },
    {
      "id": "R-AC-1-SCENARIO",
      "source": "AC-1.scenario",
      "type": "scenario",
      "statement": "Given a catalog of mixed route types (twisties, FHWA freeways, recovered rows), When classifier executes over entire catalog, Then every route receives stored verdict (ride/marginal/not_a_ride) with provider=z.ai-glm-5.2, timestamp > 0, FHWA freeway not skipped",
      "verification_method": "integration test with real catalog rows seeded via curatedGeometryTestSupport",
      "priority": "P0"
    },
    {
      "id": "R-AC-2",
      "source": "AC-2",
      "type": "functional",
      "statement": "System MUST classify FHWA freeway segments as not_a_ride with rationale explaining freeway classification, while still allowing geometry attempt to proceed (rescue-first principle)",
      "verification_method": "integration test with FHWA freeway seed row",
      "priority": "P0"
    },
    {
      "id": "R-AC-2-SCENARIO",
      "source": "AC-2.scenario",
      "type": "scenario",
      "statement": "Given FHWA freeway segment (source='fhwa', name='I-40'), When classifier processes route, Then verdict=not_a_ride with freeway rationale, geometry attempt proceeds, riderReady withheld",
      "verification_method": "integration test with real classifier and FHWA freeway row",
      "priority": "P0"
    },
    {
      "id": "R-AC-3",
      "source": "AC-3",
      "type": "functional",
      "statement": "System MUST withhold rider-ready status from routes with valid geometry that classifier judges as not_a_ride (verdict trumps geometry for rider-ready gate)",
      "verification_method": "integration test with valid geometry + not_a_ride verdict",
      "priority": "P0"
    },
    {
      "id": "R-AC-3-SCENARIO",
      "source": "AC-3.scenario",
      "type": "scenario",
      "statement": "Given route with gate-passing geometry but not_a_ride verdict, When computeRiderReadyFromDoc evaluates route, Then riderReady=false despite valid geometry",
      "verification_method": "integration test with real rider-ready computation",
      "priority": "P0"
    },
    {
      "id": "R-AC-4",
      "source": "AC-4",
      "type": "error_handling",
      "statement": "System MUST handle classifier failures gracefully without crashing pipeline or rolling back other route verdicts (individual route errors isolated)",
      "verification_method": "integration test with simulated classifier failures",
      "priority": "P1"
    },
    {
      "id": "R-AC-4-SCENARIO",
      "source": "AC-4.scenario",
      "type": "scenario",
      "statement": "Given classifier action encountering errors on route 3 of 5, When classification continues, Then routes 1,2,4,5 have verdicts, route 3 has null verdict with error log, action completes without crash",
      "verification_method": "integration test with simulated failures",
      "priority": "P1"
    },
    {
      "id": "R-AC-5",
      "source": "AC-5",
      "type": "critical_guardrail",
      "statement": "System MUST NEVER auto-retire routes based on marginal verdict alone (marginal affects rider-ready computation only, never triggers retirement logic)",
      "verification_method": "integration test with marginal verdict + retirement checks",
      "priority": "P0"
    },
    {
      "id": "R-AC-5-SCENARIO",
      "source": "AC-5.scenario",
      "type": "scenario",
      "statement": "Given route with marginal verdict and low compositeScore, When any handler checks retirement, Then retiredAt remains null (no auto-retirement)",
      "verification_method": "integration test with real marginal verdict",
      "priority": "P0"
    },
    {
      "id": "R-AC-6",
      "source": "AC-6",
      "type": "functional",
      "statement": "System MUST run classifier on different LLM provider than anchor extraction (z.ai GLM-5.2 vs OpenAI gpt-4.1) to decorrelate blind spots and stamp provider field for verification",
      "verification_method": "integration test comparing provider metadata",
      "priority": "P0"
    },
    {
      "id": "R-AC-6-SCENARIO",
      "source": "AC-6.scenario",
      "type": "scenario",
      "statement": "Given anchor extraction uses OpenAI gpt-4.1, When classifier executes, Then rideWorthiness.provider='z.ai-glm-5.2' (different from anchors), provider field present",
      "verification_method": "integration test with real z.ai GLM-5.2 provider",
      "priority": "P0"
    },
    {
      "id": "R-TC-1",
      "source": "TC-1",
      "type": "test",
      "statement": "Classifier action MUST complete without throwing for catalog of 100+ mixed route types",
      "verification_method": "integration test coverage",
      "priority": "P0"
    },
    {
      "id": "R-TC-2",
      "source": "TC-2",
      "type": "test",
      "statement": "FHWA freeway segment MUST receive not_a_ride verdict and geometry still processes",
      "verification_method": "integration test coverage",
      "priority": "P0"
    },
    {
      "id": "R-TC-3",
      "source": "TC-3",
      "type": "test",
      "statement": "Route with valid geometry but not_a_ride verdict MUST have riderReady withheld",
      "verification_method": "integration test coverage",
      "priority": "P0"
    },
    {
      "id": "R-TC-4",
      "source": "TC-4",
      "type": "test",
      "statement": "Classifier error on single route MUST NOT crash pipeline or rollback other verdicts",
      "verification_method": "integration test coverage",
      "priority": "P1"
    },
    {
      "id": "R-TC-5",
      "source": "TC-5",
      "type": "test",
      "statement": "Route with marginal verdict MUST NEVER have retiredAt timestamp set by any pipeline handler",
      "verification_method": "integration test coverage",
      "priority": "P0"
    },
    {
      "id": "R-TC-6",
      "source": "TC-6",
      "type": "test",
      "statement": "Classifier provider field MUST differ from anchor extraction provider (decorrelation proven)",
      "verification_method": "integration test coverage",
      "priority": "P0"
    }
  ]
}
-->
</details>
