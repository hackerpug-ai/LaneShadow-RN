# REDHAT-FIX-07 — Enforce in-region anchor validity in the canonical geometry verdict for every lever, not only existing-geometry reevaluation (UC-VER-01)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-07 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-02, CAP-GEO-06 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-01, REDHAT-FIX-05 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

`determineGateVerdict` (the canonical path every lever's NEW geometry goes through) enforces the same ≥2-in-region-anchor test that `reevaluateExistingGeometry` already has, so off-region anchors can no longer pass with a merely-sufficient raw anchor count.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST add an `anchors: Array<{ distanceFromCentroid: number }>` input to determineGateVerdict and derive `inRegionCount = anchors.filter(a => a.distanceFromCentroid <= 150).length`, mirroring reevaluateExistingGeometry (curatedGeometryGate.ts:148-152)
- MUST update every lever call site in convex/actions/curatedGeometryReconstruct.ts (evaluateRoutedAnchors :568, reconstructForRouteWithFixedGeometry :754, fixed-anchors fallback :794, mixed-anchors :853) to pass the real per-anchor distanceFromCentroid array, never only geocodedAnchors.length

**NEVER**
- NEVER let determineGateVerdict return verdict='pass' when fewer than 2 anchors are within 150mi of centroid, even if the raw anchorCount >= 2
- NEVER let the quarantine branch short-circuit the in-region anchor check (region precedes quarantine, exactly as the degenerate check already does)
- NEVER re-implement the region check per lever — the single source of truth is curatedGeometryGate.ts

**STRICTLY**
- STRICTLY require >= 2 anchors within 150mi of centroid on the canonical NEW-geometry path, identical to reevaluateExistingGeometry's persisted-sweep behavior
- STRICTLY preserve the existing GateVerdict return shape { verdict, failedCondition?, ratio, ratioSkipped } — failedCondition='anchors' is the recorded reason for a region failure

## DONE WHEN

- AC-1 [Canonical gate rejects NEW geometry whose anchors are all off-region even when raw anchorCount>=2] [PRIMARY]: A route with 2 anchors both ~211mi off-region resolves to verdict='review' failedCondition='anchors'
- AC-2 [Canonical gate passes NEW geometry whose anchors are in-region]: The same route with 2 in-region anchors resolves verdict='pass'
- AC-3 [Gate counts in-region anchors, not total anchor count, on a mixed set]: 3 anchors with only 1 in-region resolves verdict='review' failedCondition='anchors'
- AC-4 [Quarantine does not bypass the in-region anchor check]: A quarantined route with off-region anchors still resolves verdict='review' failedCondition='anchors'
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Move the ">=2 anchors within 150mi of centroid" test from reevaluateExistingGeometry into the canonical determineGateVerdict so every lever's NEW geometry is region-validated, and wire all four lever call sites to pass real per-anchor distances instead of a bare count.

**Success state:** NEW geometry produced by Lever 1/2/3 whose anchors fall outside the 150mi region resolves to verdict='review' failedCondition='anchors'; in-region geometry still passes; quarantine never bypasses the region check; determineGateVerdict and reevaluateExistingGeometry apply the identical in-region rule.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `gate-two-in-region-anchors` (seed_method: `public_api`): Seeded route (centroid 34.95,-120.42) whose reconstruction produces 2 geocoded anchors each <=150mi from centroid
    - routeId: `test:redhat07-in-region`
- `gate-two-off-region-anchors` (seed_method: `public_api`): Seeded route whose 2 geocoded anchors both land >150mi from centroid (~211mi) — the exact regression the red-hat found: raw anchorCount==2 but zero in-region
    - routeId: `test:redhat07-off-region` — new seeder `seedOffRegionAnchorRoute`
- `gate-mixed-one-in-two-off` (seed_method: `public_api`): Seeded route with 3 anchors total but only 1 within 150mi
    - routeId: `test:redhat07-mixed`
- `gate-quarantined-off-region` (seed_method: `public_api`): Quarantined route whose anchors are all off-region
    - routeId: `test:redhat07-quarantined-off-region`, quarantine.reason 'length_outlier' — new seeder `seedQuarantinedOffRegionRow`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Canonical gate rejects NEW geometry whose anchors are all off-region even when raw anchorCount>=2

**Requirement:** GIVEN a route with centroid (34.95,-120.42) whose reconstruction yields 2 geocoded anchors both ~211mi from centroid (raw anchorCount==2, in-region count==0), driven through the production Lever 2 reconstruct path WHEN determineGateVerdict evaluates the anchors array via the production reconstruct action THEN verdict=='review' with failedCondition=='anchors' because inRegionCount<2, and the persisted verification records the same

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + reconstructForRouteWithMixedAnchors)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: determineGateVerdict counts raw anchorCount instead of in-region anchors (a stub filter); the call site passes only geocodedAnchors.length and drops distanceFromCentroid (empty)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `gate-two-off-region-anchors`
  - ACTION: Seed route test:redhat07-off-region (centroid 34.95,-120.42) via seedOffRegionAnchorRoute; call production reconstructForRouteWithMixedAnchors({routeId, inRegionCount:0, offRegionCount:2}) so both anchors are ~211mi off-region; query curated_route_geometry.verification for the route
  - MUST_OBSERVE: verification.verdict == 'review'; verification.failedCondition == 'anchors'
  - MUST_NOT_OBSERVE: verification.verdict == 'pass'; failedCondition is empty

### AC-2 — Canonical gate passes NEW geometry whose anchors are in-region

**Requirement:** GIVEN the identical route driven through the production reconstruct path but with 2 geocoded anchors each <=150mi from centroid WHEN determineGateVerdict evaluates the in-region anchors array THEN verdict=='pass' (region satisfied, ratio in band) — the fix does not over-reject valid geometry

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real reconstruct action)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the region check rejects in-region anchors via a hardcoded review return; distanceFromCentroid is defaulted large so valid anchors are dropped
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `gate-two-in-region-anchors`
  - ACTION: Seed route test:redhat07-in-region; call production reconstructForRouteWithMixedAnchors with both anchors in-region; query curated_route_geometry.verification
  - MUST_OBSERVE: verification.verdict == 'pass'
  - MUST_NOT_OBSERVE: verification.verdict == 'review'; verification.failedCondition == 'anchors'

### AC-3 — Gate counts in-region anchors, not total anchor count, on a mixed set

**Requirement:** GIVEN 3 anchors total where only 1 is within 150mi (1 in-region + 2 off-region) WHEN determineGateVerdict evaluates the mixed anchors array THEN verdict=='review' with failedCondition=='anchors' because inRegionCount==1 (<2), even though total anchorCount==3

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: gate uses total anchors.length>=2 (a stub count) and passes the mixed set; isAnchorInRegion is hardcoded to always return true
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `gate-mixed-one-in-two-off`
  - ACTION: Seed route test:redhat07-mixed; call determineGateVerdict with anchorCount:3, anchors:[10mi,211mi,230mi]
  - MUST_OBSERVE: verdict == 'review'; failedCondition == 'anchors'
  - MUST_NOT_OBSERVE: verdict == 'pass'

### AC-4 — Quarantine does not bypass the in-region anchor check

**Requirement:** GIVEN a quarantined route (quarantine.reason='length_outlier') whose anchors are all off-region (>150mi) WHEN determineGateVerdict evaluates the quarantined route with off-region anchors THEN verdict=='review' with failedCondition=='anchors' — the region check precedes and is unaffected by the quarantine ratio-skip

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: quarantine short-circuits to verdict='pass' before the region check runs (a bypassed/removed check)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `gate-quarantined-off-region`
  - ACTION: Seed quarantined route test:redhat07-quarantined-off-region; call determineGateVerdict with quarantine:true, anchors off-region
  - MUST_OBSERVE: verdict == 'review'; failedCondition == 'anchors'
  - MUST_NOT_OBSERVE: verdict == 'pass'; ratioSkipped == true

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | determineGateVerdict returns verdict='review' failedCondition='anchors' when zero anchors are within 150mi despite raw anchorCount==2 | AC-1 | `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-1'` |
| TC-2 | determineGateVerdict returns verdict='pass' when 2 anchors are within 150mi | AC-2 | `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-2'` |
| TC-3 | determineGateVerdict returns verdict='review' failedCondition='anchors' when inRegionCount==1 and total anchorCount==3 | AC-3 | `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-3'` |
| TC-4 | determineGateVerdict returns verdict='review' failedCondition='anchors' for a quarantined route with all off-region anchors | AC-4 | `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-4'` |
| TC-5 | reconstructForRouteWithMixedAnchors production path persists failedCondition='anchors' when its geocoded anchors are off-region | AC-1 | `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryGate.ts (MODIFY)
- convex/actions/curatedGeometryReconstruct.ts (MODIFY)
- convex/curatedGeometryTestSupport.ts (MODIFY — add seedOffRegionAnchorRoute, seedQuarantinedOffRegionRow)
- convex/__tests__/REDHATFIX07-gate-region.integration.test.ts (NEW)

**writeProhibited:**
- convex/schema.ts (no schema change needed — anchors already carry distanceFromCentroid)
- Re-implementing the region check per lever
- Any RN/Expo file
- Bypassing the region check under quarantine

## READING LIST

- `convex/curatedGeometryGate.ts` (1-169) — determineGateVerdict (98-128) checks only anchorCount<2; reevaluateExistingGeometry (138-169) already computes inRegionCount from distanceFromCentroid — mirror it
- `convex/actions/curatedGeometryReconstruct.ts` (19-24,551-585) — GeocodedAnchor carries distanceFromCentroid; evaluateRoutedAnchors:568 passes only geocodedAnchors.length — the bypass
- `convex/actions/curatedGeometryReconstruct.ts` (744-886) — the four lever call sites (754,794,853) and reconstructForRouteWithMixedAnchors pre-filter — all must pass the anchors distance array
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/S4-T1-deterministic-geometry-gate-ver-01-full-ratio-band-anchor.md` (153-176) — S4-T1 AC-2 that this fix completes
- `.spec/prds/route-agent-quality/10-technical-requirements/09-capability-chains.md` — the gate is the shared boundary contract for CAP-GEO-01/02/06
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — integration tier is PRIMARY for Convex backend

## CODE PATTERN

- Pattern: Single-source pure gate — compute inRegionCount inside determineGateVerdict from an anchors:{distanceFromCentroid}[] input, exactly as reevaluateExistingGeometry does
- Pattern source: `convex/curatedGeometryGate.ts:138-169`
- Anti-pattern: Passing a pre-counted anchorCount and trusting it for region validity; per-lever region filtering that lets the canonical path skip the check

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-07-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; canonical gate region fix
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-01, REDHAT-FIX-05

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
  "task_id": "REDHAT-FIX-07",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "gate-two-in-region-anchors": { "description": "Route with 2 geocoded anchors each <=150mi from centroid.", "seed_method": "public_api", "records": ["routeId 'test:redhat07-in-region', centroid 34.95,-120.42"] },
    "gate-two-off-region-anchors": { "description": "Route with 2 geocoded anchors both >150mi from centroid.", "seed_method": "public_api", "records": ["routeId 'test:redhat07-off-region', centroid 34.95,-120.42, seedOffRegionAnchorRoute"] },
    "gate-mixed-one-in-two-off": { "description": "Route with 3 anchors total, only 1 within 150mi.", "seed_method": "public_api", "records": ["routeId 'test:redhat07-mixed'"] },
    "gate-quarantined-off-region": { "description": "Quarantined route whose anchors are all off-region.", "seed_method": "public_api", "records": ["routeId 'test:redhat07-quarantined-off-region', quarantine.reason 'length_outlier'"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Canonical gate rejects NEW geometry whose anchors are all off-region even when raw anchorCount>=2", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + reconstruct action)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["determineGateVerdict counts raw anchorCount instead of in-region anchors (a stub filter)", "the call site passes only geocodedAnchors.length and drops distanceFromCentroid (empty)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "gate-two-off-region-anchors", "action": { "actor": "api_client", "steps": ["Seed route test:redhat07-off-region", "Call production reconstructForRouteWithMixedAnchors with both anchors off-region", "Query curated_route_geometry.verification"] },
          "end_state": { "must_observe": ["verification.verdict == 'review'", "verification.failedCondition == 'anchors'"], "must_not_observe": ["verification.verdict == 'pass'", "failedCondition is empty"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Canonical gate passes NEW geometry whose anchors are in-region", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real reconstruct action)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the region check rejects in-region anchors via a hardcoded review return", "distanceFromCentroid is defaulted large so valid anchors are dropped"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "gate-two-in-region-anchors", "action": { "actor": "api_client", "steps": ["Seed route test:redhat07-in-region", "Call production reconstructForRouteWithMixedAnchors with both anchors in-region", "Query curated_route_geometry.verification"] },
          "end_state": { "must_observe": ["verification.verdict == 'pass'"], "must_not_observe": ["verification.verdict == 'review'", "verification.failedCondition == 'anchors'"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Gate counts in-region anchors, not total anchor count, on a mixed set", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real curatedGeometryGate.ts)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["gate uses total anchors.length>=2 (a stub count) and passes the mixed set", "isAnchorInRegion is hardcoded to always return true"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "gate-mixed-one-in-two-off", "action": { "actor": "api_client", "steps": ["Seed route test:redhat07-mixed", "Call determineGateVerdict with anchorCount:3, anchors:[10mi,211mi,230mi]"] },
          "end_state": { "must_observe": ["verdict == 'review'", "failedCondition == 'anchors'"], "must_not_observe": ["verdict == 'pass'"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Quarantine does not bypass the in-region anchor check", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["quarantine short-circuits to verdict='pass' before the region check runs (a bypassed/removed check)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "gate-quarantined-off-region", "action": { "actor": "api_client", "steps": ["Seed quarantined route test:redhat07-quarantined-off-region", "Call determineGateVerdict with quarantine:true, anchors off-region"] },
          "end_state": { "must_observe": ["verdict == 'review'", "failedCondition == 'anchors'"], "must_not_observe": ["verdict == 'pass'", "ratioSkipped == true"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "review/anchors when zero in-region despite raw count 2", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "pass when 2 in-region", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "review/anchors when inRegionCount 1 of 3", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "review/anchors for quarantined off-region route", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "production mixed-anchors path persists failedCondition='anchors' for off-region", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX07-gate-region.integration.test.ts -t 'TC-5'" }
  ]
}
-->

</details>
