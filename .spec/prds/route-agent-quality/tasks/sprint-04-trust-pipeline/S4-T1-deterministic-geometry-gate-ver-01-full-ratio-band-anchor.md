# S4-T1 — Deterministic geometry gate (VER-01 full: ratio band, anchor/region, degenerate, pre-existing sweep, quarantine ratio-skip) + bounded LLM repair round (VER-02) (UC-VER-01, UC-VER-02)

| Field | Value |
|-------|-------|
| TASK_ID | S4-T1 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 210 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-02, CAP-GEO-05, CAP-GEO-06 |
| DEPENDS_ON | — |
| BLOCKS | S4-T2, S4-T3, S4-T4, S4-T5, S4-T6 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Every lever calls ONE gate module; pre-existing geometry re-evaluated; repair round bounded to 2 attempts; quarantine rows skip ratio; all stored geometry is gate-passing

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST reuse curatedGeometryGate.ts pure functions - never re-implement per lever
- MUST apply gate to ALL geometry (new and pre-existing)
- MUST limit reconstruction attempts to 2 per route (repair round budget)
- MUST skip ratio check when quarantine flag is set (null claimed length)

**NEVER**
- NEVER store geometry that fails the gate
- NEVER exceed 2 reconstruction attempts per route
- NEVER bypass anchor/region checks for reconstructed routes
- NEVER allow a not_a_ride verdict to reach rider-ready surface
- NEVER let the couch gate pass without a recorded verdict

**STRICTLY**
- STRICTLY enforce ratio band 0.6–1.6 for non-quarantined routes
- STRICTLY require ≥2 anchors within 150mi of centroid
- STRICTLY reject degenerate geometry (≤4 points OR <1 pt/mi)
- STRICTLY quarantine flag → ratio skipped (routed length becomes truth)
- STRICTLY repair round budget = 2 attempts total per route

## DONE WHEN

- AC-1 [Gate enforces ratio band 0.6–1.6 for non-quarantined routes] [PRIMARY]: Verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6
- AC-2 [Gate requires ≥2 anchors within 150mi of centroid]: Verdict is 'review' with failedCondition='anchors' because anchorCount < 2
- AC-3 [Gate rejects degenerate geometry (≤4 points OR <1 pt/mi)]: Verdict is 'review' with failedCondition='degenerate' because pointCount ≤ 4
- AC-4 [Quarantine flag skips ratio check but applies degenerate + region checks]: Verdict is 'pass' (ratio skipped) because degenerate + region checks pass
- AC-5 [Bounded repair round limits attempts to 2 and keeps better attempt by ratio distance]: Second attempt is stored (ratio distance |log(0.9)|=0.11 is closer to 0 than |log(0.5)|=0.69)
- AC-6 [Pre-existing geometry rows are re-evaluated against the full gate]: Rows failing the enhanced gate are flipped to verdict='review'
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Harden curatedGeometryGate.ts to full VER-01 deterministic gate (ratio, anchors, degeneracy, pre-existing sweep, quarantine ratio-skip) and implement VER-02 bounded repair round (max 2 attempts, keep better by ratio distance)

**Success state:** Every lever calls ONE gate module; pre-existing geometry re-evaluated; repair round bounded to 2 attempts; quarantine rows skip ratio; all stored geometry is gate-passing

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `ratio-boundary-passing` (seed_method: `public_api`): Route with claimedMiles=41, routedMiles=41 (ratio=1.0, in band)
    - routeId: 'test:ratio-100', name: 'Ratio 1.00', lengthMiles: 41, compositeScore: 0.85
- `ratio-boundary-failing-low` (seed_method: `public_api`): Route with claimedMiles=100, routedMiles=59 (ratio=0.59, below 0.6)
    - routeId: 'test:ratio-059', name: 'Ratio 0.59', lengthMiles: 100, compositeScore: 0.85
- `ratio-boundary-failing-high` (seed_method: `public_api`): Route with claimedMiles=100, routedMiles=161 (ratio=1.61, above 1.6)
    - routeId: 'test:ratio-161', name: 'Ratio 1.61', lengthMiles: 100, compositeScore: 0.85
- `anchors-sufficient-in-region` (seed_method: `public_api`): Route with 2 anchors within 150mi of centroid (34.95, -120.42)
    - routeId: 'test:anchors-sufficient', name: 'Sufficient Anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85
- `anchors-insufficient-count` (seed_method: `public_api`): Route with only 1 anchor (fails anchor count check)
    - routeId: 'test:single-anchor', name: 'Single anchor', lengthMiles: 41, compositeScore: 0.85
- `degenerate-low-point-count` (seed_method: `public_api`): Route with 3 points (fails <=4 point degenerate check)
    - routeId: 'test:degenerate-2pt', name: 'Degenerate 2pt', lengthMiles: 40, compositeScore: 0.85
- `degenerate-low-density` (seed_method: `public_api`): Route with 10 points but 50mi (fails <1 pt/mi check)
    - routeId: 'test:degenerate-10pt-50mi', name: 'Degenerate 10pt/50mi', lengthMiles: 50, compositeScore: 0.85
- `quarantined-row-ratio-skip` (seed_method: `public_api`): Quarantined route (lengthMiles=0) - ratio check skipped
    - routeId: 'test:quarantined-null-length', name: 'Quarantined null length', lengthMiles: 0, quarantine: {reason: 'zero_length', flaggedAt: DATE_NOW}, compositeScore: 0.85
- `preexisting-row-needs-region-check` (seed_method: `public_api`): Legacy geometry row with verification.verdict='pass' but off-region anchors
    - curatedRouteGeometry doc with routeId, verification.verdict='pass', anchors with lat/lng > 300mi from centroid

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Gate enforces ratio band 0.6–1.6 for non-quarantined routes

**Requirement:** GIVEN A route with claimedMiles=100, routedMiles=75, and no quarantine flag WHEN The gate evaluates the ratio routedMiles/claimedMiles THEN Verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts module)
- FLOW_REF: UC-VER-01
- VERIFY: `pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: evaluateRatioBoundary returns passes=true for all values; ratio check is bypassed or mocked; gate always returns verdict='pass'
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `ratio-boundary-passing`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 1.0}); Verify returns {passes:true, ratio:1.0}
    - MUST_OBSERVE: passes == true, ratio == 1.0
    - MUST_NOT_OBSERVE: passes == false, failedCondition == 'ratio'
- CASE 2 — start_ref `ratio-boundary-failing-low`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 0.59}); Verify returns {passes:false, ratio:0.59, failedCondition:'ratio'}
    - MUST_OBSERVE: passes == false, failedCondition == 'ratio', ratio == 0.59
    - MUST_NOT_OBSERVE: passes == true
- CASE 3 — start_ref `ratio-boundary-failing-high`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 1.61}); Verify returns {passes:false, failedCondition:'ratio'}
    - MUST_OBSERVE: passes == false, failedCondition == 'ratio', ratio == 1.61
    - MUST_NOT_OBSERVE: passes == true

### AC-2 — Gate requires ≥2 anchors within 150mi of centroid

**Requirement:** GIVEN A reconstruction with 1 geocoded anchor within 150mi and 2 off-region WHEN The gate evaluates anchor count and region compliance THEN Verdict is 'review' with failedCondition='anchors' because anchorCount < 2

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + isAnchorInRegion)
- FLOW_REF: UC-VER-01
- VERIFY: `pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: isAnchorInRegion always returns true; anchor count check is skipped; region check is mocked out
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `anchors-sufficient-in-region`
    - ACTION (api_client): Call determineGateVerdict({anchorCount:2, pointCount:50, routedMiles:41, ratio:1.0}); Verify returns {verdict:'pass'}
    - MUST_OBSERVE: verdict == 'pass'
    - MUST_NOT_OBSERVE: failedCondition == 'anchors'
- CASE 2 — start_ref `anchors-insufficient-count`
    - ACTION (api_client): Call determineGateVerdict({anchorCount:1, pointCount:50, routedMiles:41, ratio:1.0}); Verify returns {verdict:'review', failedCondition:'anchors'}
    - MUST_OBSERVE: verdict == 'review', failedCondition == 'anchors'
    - MUST_NOT_OBSERVE: verdict == 'pass'
- CASE 3 — start_ref `anchors-off-region-rejected`
    - ACTION (api_client): Seed route with centroid (34.95, -120.42); Call isAnchorInRegion({lat:38.0, lng:-120.42}, centroid) - 300mi away; Verify returns false
    - MUST_OBSERVE: isAnchorInRegion == false
    - MUST_NOT_OBSERVE: isAnchorInRegion == true

### AC-3 — Gate rejects degenerate geometry (≤4 points OR <1 pt/mi)

**Requirement:** GIVEN A routed polyline with 3 points and routedMiles=10 WHEN The gate evaluates point count and density THEN Verdict is 'review' with failedCondition='degenerate' because pointCount ≤ 4

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real isDegenerate + determineGateVerdict)
- FLOW_REF: UC-VER-01
- VERIFY: `pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: isDegenerate always returns false; point count check is skipped; density check is bypassed
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `degenerate-low-point-count`
    - ACTION (api_client): Call isDegenerate({pointCount:3, routedMiles:10}); Verify returns true
    - MUST_OBSERVE: isDegenerate == true
    - MUST_NOT_OBSERVE: isDegenerate == false
- CASE 2 — start_ref `degenerate-low-density`
    - ACTION (api_client): Call isDegenerate({pointCount:5, routedMiles:10}); Verify returns true (5 pts < 10 mi)
    - MUST_OBSERVE: isDegenerate == true
    - MUST_NOT_OBSERVE: isDegenerate == false
- CASE 3 — start_ref `non-degenerate-valid`
    - ACTION (api_client): Call isDegenerate({pointCount:50, routedMiles:41}); Verify returns false
    - MUST_OBSERVE: isDegenerate == false
    - MUST_NOT_OBSERVE: isDegenerate == true

### AC-4 — Quarantine flag skips ratio check but applies degenerate + region checks

**Requirement:** GIVEN A quarantined route (quarantine.reason='zero_length') with routedMiles=22, pointCount=50 WHEN The gate evaluates with ratio=null due to quarantine THEN Verdict is 'pass' (ratio skipped) because degenerate + region checks pass

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)
- FLOW_REF: UC-VER-01
- VERIFY: `pnpm test convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: quarantine flag is ignored; ratio check runs despite quarantine; evaluateRatioBoundary is called with ratio=null and returns passes:false
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `quarantined-row-ratio-skip`
    - ACTION (api_client): Seed quarantined route (lengthMiles=0, quarantine.reason='zero_length'); Call determineGateVerdict({ratio:null, pointCount:50, routedMiles:22, anchorCount:2}); Verify returns {verdict:'pass'}
    - MUST_OBSERVE: verdict == 'pass', ratio == null
    - MUST_NOT_OBSERVE: failedCondition == 'ratio', verdict == 'review'

### AC-5 — Bounded repair round limits attempts to 2 and keeps better attempt by ratio distance

**Requirement:** GIVEN A reconstruction with first attempt ratio=0.5 (fails gate), second attempt ratio=0.9 WHEN Repair round runs with geocode log feedback and selects better attempt THEN Second attempt is stored (ratio distance |log(0.9)|=0.11 is closer to 0 than |log(0.5)|=0.69)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real reconstructForRoute with repair round)
- FLOW_REF: UC-VER-02
- VERIFY: `pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: repair round runs more than 2 attempts; attempt selection logic is stubbed; geocode log feedback is not passed to LLM
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `repair-round-two-attempts-better-second`
    - ACTION (api_client): Seed route with description triggering reconstruction; Call reconstructForRoute (first attempt fails ratio); Verify repair round runs with feedback; Verify second attempt is stored if better
    - MUST_OBSERVE: routingCallCount == 2, stored ratio == better of two attempts
    - MUST_NOT_OBSERVE: routingCallCount > 2, stored ratio == worse attempt
- CASE 2 — start_ref `repair-round-exhausted-to-review`
    - ACTION (api_client): Seed route where both attempts fail gate; Call reconstructForRoute; Verify final verdict is 'review'
    - MUST_OBSERVE: routingCallCount == 2, verdict == 'review', failedCondition == "ratio" (specific failure recorded)
    - MUST_NOT_OBSERVE: routingCallCount > 2, verdict == 'pass'

### AC-6 — Pre-existing geometry rows are re-evaluated against the full gate

**Requirement:** GIVEN A curated_route_geometry row with verification from before gate hardening (missing region check) WHEN A re-evaluation sweep runs over pre-existing geometry THEN Rows failing the enhanced gate are flipped to verdict='review'

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real pre-existing sweep over curated_route_geometry)
- FLOW_REF: UC-VER-01
- VERIFY: `pnpm test convex/__tests__/S4T1-preexisting-sweep.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: sweep only processes new geometry; pre-existing verification objects are skipped; gate is bypassed for legacy rows
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `preexisting-row-needs-region-check`
    - ACTION (api_client): Insert geometry row with verification.verdict='pass' but off-region anchors; Run pre-existing sweep; Query verification - should be flipped to 'review'
    - MUST_OBSERVE: verification.verdict == 'review', verification.failedCondition == 'anchors'
    - MUST_NOT_OBSERVE: verification.verdict == 'pass'

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | evaluateRatioBoundary passes for ratio 0.6–1.6 | AC-1 | `pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-1'` |
| TC-2 | evaluateRatioBoundary fails for ratio below 0.6 | AC-1 | `pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-2'` |
| TC-3 | evaluateRatioBoundary fails for ratio above 1.6 | AC-1 | `pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-3'` |
| TC-4 | determineGateVerdict requires at least 2 anchors | AC-2 | `pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts --grep 'TC-4'` |
| TC-5 | isAnchorInRegion rejects points beyond 150mi | AC-2 | `pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts --grep 'TC-5'` |
| TC-6 | isDegenerate returns true for pointCount <= 4 | AC-3 | `pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts --grep 'TC-6'` |
| TC-7 | isDegenerate returns true for pointCount < routedMiles | AC-3 | `pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts --grep 'TC-7'` |
| TC-8 | Quarantined routes skip ratio check | AC-4 | `pnpm test convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts --grep 'TC-8'` |
| TC-9 | Repair round limits to 2 attempts total | AC-5 | `pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts --grep 'TC-9'` |
| TC-10 | Repair round keeps better attempt by ratio distance | AC-5 | `pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts --grep 'TC-10'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryGate.ts (MODIFY) - add anchor count check, region check, pre-existing sweep, quarantine ratio-skip
- convex/actions/curatedGeometryReconstruct.ts (MODIFY) - repair round logic, 2-attempt budget
- convex/curatedGeometry.ts (MODIFY) - recomputeRiderReady integration
- convex/__tests__/S4T1-*.integration.test.ts (NEW) - gate + repair round integration tests
- convex/curatedGeometryTestSupport.ts (MODIFY) - extend seed helpers for gate boundary cases

**writeProhibited:**
- convex/schema.ts internals - only additive deltas for new fields
- curated_route_geometry side table DELETE operations - use patch/replace only
- Re-implementing gate logic per lever - must reuse curatedGeometryGate.ts
- Bypassing ratio check without quarantine flag - quarantine is the ONLY skip condition
- Exceeding 2 reconstruction attempts - repair budget is enforced at orchestrator level

## READING LIST

- `convex/curatedGeometryGate.ts` (1-97) — Pure gate functions: evaluateRatioBoundary, isDegenerate, isAnchorInRegion, determineGateVerdict
- `convex/actions/curatedGeometryReconstruct.ts` (340-420) — Repair round logic in reconstructForRoute
- `convex/curatedGeometryHygiene.ts` (520-602) — Quarantine flag structure and fixLengthOutliers pattern
- `convex/schema.ts` (216-218) — curatedRouteGeometry side table schema
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — Integration test tier is PRIMARY for Convex backend

## CODE PATTERN

- Pattern: Pure function gate with structured verdict return
- Pattern source: `convex/curatedGeometryGate.ts:73-96`
- Anti-pattern: Per-lever gate implementations, ratio skip without quarantine, unbounded repair loops

## VERIFICATION GATES

- test: `pnpm test convex/__tests__/S4T1-*.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator: `python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py .spec/tasks/sprint-04/S4-T1.json` → Exit 0, zero CRITICAL violations

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - hardens curatedGeometryGate.ts module, adds repair round logic, integrates with existing verification pipeline
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: —
- Blocks: S4-T2, S4-T3, S4-T4, S4-T5, S4-T6

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T1",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "ratio-boundary-passing": {
      "description": "Route with claimedMiles=41, routedMiles=41 (ratio=1.0, in band)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-100', name: 'Ratio 1.00', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "ratio-boundary-failing-low": {
      "description": "Route with claimedMiles=100, routedMiles=59 (ratio=0.59, below 0.6)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-059', name: 'Ratio 0.59', lengthMiles: 100, compositeScore: 0.85"
      ]
    },
    "ratio-boundary-failing-high": {
      "description": "Route with claimedMiles=100, routedMiles=161 (ratio=1.61, above 1.6)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-161', name: 'Ratio 1.61', lengthMiles: 100, compositeScore: 0.85"
      ]
    },
    "anchors-sufficient-in-region": {
      "description": "Route with 2 anchors within 150mi of centroid (34.95, -120.42)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:anchors-sufficient', name: 'Sufficient Anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85"
      ]
    },
    "anchors-insufficient-count": {
      "description": "Route with only 1 anchor (fails anchor count check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:single-anchor', name: 'Single anchor', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "degenerate-low-point-count": {
      "description": "Route with 3 points (fails <=4 point degenerate check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:degenerate-2pt', name: 'Degenerate 2pt', lengthMiles: 40, compositeScore: 0.85"
      ]
    },
    "degenerate-low-density": {
      "description": "Route with 10 points but 50mi (fails <1 pt/mi check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:degenerate-10pt-50mi', name: 'Degenerate 10pt/50mi', lengthMiles: 50, compositeScore: 0.85"
      ]
    },
    "quarantined-row-ratio-skip": {
      "description": "Quarantined route (lengthMiles=0) - ratio check skipped",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:quarantined-null-length', name: 'Quarantined null length', lengthMiles: 0, quarantine: {reason: 'zero_length', flaggedAt: DATE_NOW}, compositeScore: 0.85"
      ]
    },
    "preexisting-row-needs-region-check": {
      "description": "Legacy geometry row with verification.verdict='pass' but off-region anchors",
      "seed_method": "public_api",
      "records": [
        "curatedRouteGeometry doc with routeId, verification.verdict='pass', anchors with lat/lng > 300mi from centroid"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a route with claimedMiles=100, routedMiles=75, and no quarantine flag WHEN the gate evaluates the ratio routedMiles/claimedMiles THEN verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6",
      "verify": "pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts module)",
        "negative_control": {
          "would_fail_if": [
            "evaluateRatioBoundary returns passes=true for all values",
            "ratio check is bypassed or mocked",
            "gate always returns verdict='pass'"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ratio-boundary-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 1.0})",
                "Verify returns {passes:true, ratio:1.0}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == true",
                "ratio == 1.0"
              ],
              "must_not_observe": [
                "passes == false",
                "failedCondition == 'ratio'"
              ]
            }
          },
          {
            "start_ref": "ratio-boundary-failing-low",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 0.59})",
                "Verify returns {passes:false, ratio:0.59, failedCondition:'ratio'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == false",
                "failedCondition == 'ratio'",
                "ratio == 0.59"
              ],
              "must_not_observe": [
                "passes == true"
              ]
            }
          },
          {
            "start_ref": "ratio-boundary-failing-high",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 1.61})",
                "Verify returns {passes:false, failedCondition:'ratio'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == false",
                "failedCondition == 'ratio'",
                "ratio == 1.61"
              ],
              "must_not_observe": [
                "passes == true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a reconstruction with 1 geocoded anchor within 150mi and 2 off-region WHEN the gate evaluates anchor count and region compliance THEN verdict is 'review' with failedCondition='anchors' because anchorCount < 2",
      "verify": "pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + isAnchorInRegion)",
        "negative_control": {
          "would_fail_if": [
            "isAnchorInRegion always returns true",
            "anchor count check is skipped",
            "region check is mocked out"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "anchors-sufficient-in-region",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call determineGateVerdict({anchorCount:2, pointCount:50, routedMiles:41, ratio:1.0})",
                "Verify returns {verdict:'pass'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'pass'"
              ],
              "must_not_observe": [
                "failedCondition == 'anchors'"
              ]
            }
          },
          {
            "start_ref": "anchors-insufficient-count",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call determineGateVerdict({anchorCount:1, pointCount:50, routedMiles:41, ratio:1.0})",
                "Verify returns {verdict:'review', failedCondition:'anchors'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'review'",
                "failedCondition == 'anchors'"
              ],
              "must_not_observe": [
                "verdict == 'pass'"
              ]
            }
          },
          {
            "start_ref": "anchors-off-region-rejected",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with centroid (34.95, -120.42)",
                "Call isAnchorInRegion({lat:38.0, lng:-120.42}, centroid) - 300mi away",
                "Verify returns false"
              ]
            },
            "end_state": {
              "must_observe": [
                "isAnchorInRegion == false"
              ],
              "must_not_observe": [
                "isAnchorInRegion == true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a routed polyline with 3 points and routedMiles=10 WHEN the gate evaluates point count and density THEN verdict is 'review' with failedCondition='degenerate' because pointCount <= 4",
      "verify": "pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real isDegenerate + determineGateVerdict)",
        "negative_control": {
          "would_fail_if": [
            "isDegenerate always returns false",
            "point count check is skipped",
            "density check is bypassed"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "degenerate-low-point-count",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:3, routedMiles:10})",
                "Verify returns true"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == true"
              ],
              "must_not_observe": [
                "isDegenerate == false"
              ]
            }
          },
          {
            "start_ref": "degenerate-low-density",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:5, routedMiles:10})",
                "Verify returns true (5 pts < 10 mi)"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == true"
              ],
              "must_not_observe": [
                "isDegenerate == false"
              ]
            }
          },
          {
            "start_ref": "non-degenerate-valid",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:50, routedMiles:41})",
                "Verify returns false"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == false"
              ],
              "must_not_observe": [
                "isDegenerate == true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a quarantined route (quarantine.reason='zero_length') with routedMiles=22, pointCount=50 WHEN the gate evaluates with ratio=null due to quarantine THEN verdict is 'pass' (ratio skipped) because degenerate + region checks pass",
      "verify": "pnpm test convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)",
        "negative_control": {
          "would_fail_if": [
            "quarantine flag is ignored",
            "ratio check runs despite quarantine",
            "evaluateRatioBoundary is called with ratio=null and returns passes:false"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "quarantined-row-ratio-skip",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed quarantined route (lengthMiles=0, quarantine.reason='zero_length')",
                "Call determineGateVerdict({ratio:null, pointCount:50, routedMiles:22, anchorCount:2})",
                "Verify returns {verdict:'pass'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'pass'",
                "ratio == null"
              ],
              "must_not_observe": [
                "failedCondition == 'ratio'",
                "verdict == 'review'"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a reconstruction with first attempt ratio=0.5 (fails gate), second attempt ratio=0.9 WHEN repair round runs with geocode log feedback and selects better attempt THEN second attempt is stored (ratio distance |log(0.9)|=0.11 is closer to 0 than |log(0.5)|=0.69)",
      "verify": "pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real reconstructForRoute with repair round)",
        "negative_control": {
          "would_fail_if": [
            "repair round runs more than 2 attempts",
            "attempt selection logic is stubbed",
            "geocode log feedback is not passed to LLM"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repair-round-two-attempts-better-second",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with description triggering reconstruction",
                "Call reconstructForRoute (first attempt fails ratio)",
                "Verify repair round runs with feedback",
                "Verify second attempt is stored if better"
              ]
            },
            "end_state": {
              "must_observe": [
                "routingCallCount == 2",
                "stored ratio == better of two attempts"
              ],
              "must_not_observe": [
                "routingCallCount > 2",
                "stored ratio == worse attempt"
              ]
            }
          },
          {
            "start_ref": "repair-round-exhausted-to-review",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route where both attempts fail gate",
                "Call reconstructForRoute",
                "Verify final verdict is 'review'"
              ]
            },
            "end_state": {
              "must_observe": [
                "routingCallCount == 2",
                "verdict == 'review'",
                "failedCondition == \"ratio\" (specific failure recorded)"
              ],
              "must_not_observe": [
                "routingCallCount > 2",
                "verdict == 'pass'"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a curated_route_geometry row with verification from before gate hardening (missing region check) WHEN a re-evaluation sweep runs over pre-existing geometry THEN rows failing the enhanced gate are flipped to verdict='review'",
      "verify": "pnpm test convex/__tests__/S4T1-preexisting-sweep.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real pre-existing sweep over curated_route_geometry)",
        "negative_control": {
          "would_fail_if": [
            "sweep only processes new geometry",
            "pre-existing verification objects are skipped",
            "gate is bypassed for legacy rows"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "preexisting-row-needs-region-check",
            "action": {
              "actor": "api_client",
              "steps": [
                "Insert geometry row with verification.verdict='pass' but off-region anchors",
                "Run pre-existing sweep",
                "Query verification - should be flipped to 'review'"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'review'",
                "verification.failedCondition == 'anchors'"
              ],
              "must_not_observe": [
                "verification.verdict == 'pass'"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary passes for ratio 0.6–1.6",
      "verify": "pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary fails for ratio below 0.6",
      "verify": "pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-2'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary fails for ratio above 1.6",
      "verify": "pnpm test convex/__tests__/S4T1-gate-ratio-band.integration.test.ts --grep 'TC-3'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "determineGateVerdict requires at least 2 anchors",
      "verify": "pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts --grep 'TC-4'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "isAnchorInRegion rejects points beyond 150mi",
      "verify": "pnpm test convex/__tests__/S4T1-gate-anchors-region.integration.test.ts --grep 'TC-5'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "isDegenerate returns true for pointCount <= 4",
      "verify": "pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts --grep 'TC-6'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "isDegenerate returns true for pointCount < routedMiles",
      "verify": "pnpm test convex/__tests__/S4T1-gate-degenerate.integration.test.ts --grep 'TC-7'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Quarantined routes skip ratio check",
      "verify": "pnpm test convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts --grep 'TC-8'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Repair round limits to 2 attempts total",
      "verify": "pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts --grep 'TC-9'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Repair round keeps better attempt by ratio distance",
      "verify": "pnpm test convex/__tests__/S4T1-repair-round-bounded.integration.test.ts --grep 'TC-10'",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
</details>
