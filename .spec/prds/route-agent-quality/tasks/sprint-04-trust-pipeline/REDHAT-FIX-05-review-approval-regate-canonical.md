# REDHAT-FIX-05 — Make REVIEW approval re-run the canonical geometry gate and prevent automatic rider-ready on failing geometry (UC-VER-04, UC-VER-01)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-05 |
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
| CAPABILITIES | CAP-GEO-03, CAP-GEO-06 |
| DEPENDS_ON | REDHAT-FIX-06, REDHAT-FIX-07 |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX05-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

`approveDisposition` decodes the actual candidate geometry, re-measures it, and re-runs the canonical region-aware gate — only a genuinely passing verdict sets `riderReady`/`generated`; failing candidates stay in REVIEW; provenance is never overwritten with a hardcoded value.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (decode + re-measure the actual candidate geometry) has **not** been delivered. `approveDisposition` reads `geom.verification.routedMiles`/`pointCount`/`ratio`/`anchors` (`convex/reviewQueue.ts:338-352`, with `?? 50`/`?? null` fallbacks) and passes those STORED values straight into `evaluateApprovalCandidate` — it never decodes `geom.value`/`geom.verification.geometry` via `@mapbox/polyline` or measures the polyline. A stale or attacker-influenced stored verification record (e.g. `pointCount:50, ratio:1.0`) whose real polyline decodes to as few as 3 points is therefore promoted to `riderReady`.

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — Approval decodes and re-measures the real candidate geometry instead of trusting stored verification

**Requirement:** GIVEN a REVIEW route whose STORED verification looks passing (`pointCount:50, ratio:1.0`) but whose real `geom.value` polyline decodes to only 3 points WHEN an operator calls `approveDisposition` THEN the re-measured/decoded geometry fails the canonical gate (`failedCondition == 'degenerate'`) and the route stays `geometryStatus:'review'`, `riderReady:false` — the stored-but-wrong verification never determines the outcome.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real `approveDisposition` + `@mapbox/polyline` decode + canonical gate)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-approval-remeasure.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `approveDisposition` reads `geom.verification.pointCount` (stored 50) instead of decoding the real 3-point polyline (unchanged `reviewQueue.ts:338-341`) so the route is promoted; the persisted verification.pointCount equals the stored copy rather than the decoded count
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — seed a REVIEW route whose `geom.value` decodes to 3 points but whose stored verification claims `pointCount:50, ratio:1.0`; call `approveDisposition`; query `curated_routes` + `curated_route_geometry`
  - MUST_OBSERVE: `curated_routes.geometryStatus == 'review'`; `curated_route_geometry.verification.failedCondition == 'degenerate'`; persisted `verification.pointCount == 3` (the decoded count, not 50)
  - MUST_NOT_OBSERVE: `curated_routes.riderReady == true`; persisted `verification.pointCount == 50` (the stale stored copy carried through unchanged)

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST re-measure pointCount and routedMiles by decoding the actual stored candidate polyline (`@mapbox/polyline` decode + `haversineDistance` from curatedGeometryGate.ts), never by copying `geom.verification.pointCount`/`routedMiles` or defaulting anchorCount ?? 2 / ratio ?? 1.0
- MUST call the canonical region-aware gate (`reevaluateExistingGeometry` / `determineGateVerdict` as corrected by REDHAT-FIX-07) and derive verdict, riderReady, and geometryStatus solely from its return value
- MUST call `requireOperator(ctx)` (REDHAT-FIX-06) at the start of approveDisposition

**NEVER**
- NEVER stamp verdict:'pass', riderReady:true, or geometryStatus:'generated' without a genuine passing gate verdict on the re-measured geometry
- NEVER hardcode provenance to 'scraped_promoted' — persist the candidate's actual provenance
- NEVER leave a failing candidate approved-and-servable: a failing re-gate must keep geometryStatus='review' and riderReady=false

**STRICTLY**
- STRICTLY the persisted verification.verdict/failedCondition/ratio/ratioSkipped equal the canonical gate's return for the decoded geometry
- STRICTLY rider-ready is admitted only via a passing verdict (CAP-GEO-03)

## DONE WHEN

- AC-1 [Approving a route whose real candidate geometry fails the gate keeps it in REVIEW and never sets rider-ready] [PRIMARY]: A 3-point candidate stays geometryStatus='review', riderReady=false, failedCondition='degenerate'
- AC-2 [Approving a route whose real candidate geometry passes promotes it to rider-ready]: A genuinely passing candidate becomes geometryStatus='generated', riderReady=true, verdict='pass'
- AC-3 [Actual provenance is preserved, not overwritten with scraped_promoted]: ai_reconstructed provenance is preserved, never hardcoded
- AC-4 [Off-region anchors block approval, and non-operators cannot approve]: Off-region anchors keep the route in REVIEW; a non-operator call throws FORBIDDEN
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Replace the forged-pass `approveDisposition` (which copies/defaults measurements, stamps `verdict:'pass'`/`provenance:'scraped_promoted'`, and sets `riderReady:true` unconditionally) with a handler that re-measures the real candidate geometry, re-runs the canonical gate, and only promotes genuinely passing geometry while preserving actual provenance.

**Success state:** Approving a REVIEW route whose real candidate geometry fails the gate leaves it in REVIEW with riderReady=false; approving one whose real geometry passes promotes it with its true provenance and a real passing verdict; the decision is auditable in curation_artifacts.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `review-candidate-failing-degenerate` (seed_method: `public_api`): A REVIEW route whose stored verification LOOKS passing but whose actual `bestCandidateGeometry` polyline decodes to only 3 points
    - `seedReviewCandidateWithPolyline({ routeId:'test:redhatfix05-degenerate', bestCandidateGeometry: <3-point polyline>, storedVerification:{ pointCount:50, ratio:1.0, anchorCount:2 }, provenance:'ai_reconstructed' })`
- `review-candidate-passing-ai-reconstructed` (seed_method: `public_api`): A REVIEW route whose actual polyline decodes to ~50 points over ~41mi (in-band) with 2 in-region anchors, provenance 'ai_reconstructed'
    - `seedReviewCandidateWithPolyline({ routeId:'test:redhatfix05-passing', bestCandidateGeometry: POLY_41MI, storedVerification:{ anchors:[in-region x2] }, provenance:'ai_reconstructed' })`
- `review-candidate-off-region-anchors` (seed_method: `public_api`): A non-degenerate, in-band candidate whose stored anchors sit 211mi from centroid
    - `seedReviewCandidateWithPolyline({ routeId:'test:redhatfix05-offregion', storedVerification:{ anchors:[{distanceFromCentroid:211},{distanceFromCentroid:220}] } })`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Approving a route whose real candidate geometry fails the gate keeps it in REVIEW

**Requirement:** GIVEN a REVIEW route whose stored verification looks passing but whose actual polyline decodes to 3 points WHEN an operator calls approveDisposition for that route THEN the re-measured geometry fails the canonical gate (failedCondition='degenerate'), the route stays geometryStatus='review' with riderReady=false, and no 'scraped_promoted' pass is written

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real approveDisposition + gate + polyline decode)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: approveDisposition copies geom.verification.pointCount (a stubbed default) instead of decoding the real 3-point polyline; riderReady is hardcoded true unconditionally; the gate call is mocked to return pass
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-candidate-failing-degenerate`
  - ACTION: Seed review-candidate-failing-degenerate; seed an operator identity and authenticate; call approveDisposition({routeId:'test:redhatfix05-degenerate'}); query curated_routes + curated_route_geometry
  - MUST_OBSERVE: curated_routes.geometryStatus == 'review'; curated_route_geometry.verification.failedCondition == 'degenerate'
  - MUST_NOT_OBSERVE: curated_routes.riderReady == true; curated_route_geometry.verification.verdict == 'pass'

### AC-2 — Approving a route whose real candidate geometry passes promotes it to rider-ready

**Requirement:** GIVEN a REVIEW route whose actual polyline decodes to ~50 points ~41mi with in-region anchors and in-band ratio WHEN an operator calls approveDisposition THEN the re-run gate passes, the route becomes geometryStatus='generated', riderReady=true, verification.verdict='pass' with a re-measured ratio in 0.6-1.6

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real approveDisposition + gate)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the handler rejects genuinely passing geometry via a hardcoded review verdict; verdict/ratio are copied from stored fields (stubbed) rather than re-measured
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-candidate-passing-ai-reconstructed`
  - ACTION: Seed review-candidate-passing-ai-reconstructed; authenticate as operator; call approveDisposition({routeId:'test:redhatfix05-passing'}); query curated_routes + curated_route_geometry
  - MUST_OBSERVE: curated_routes.geometryStatus == 'generated'; curated_routes.riderReady == true; curated_route_geometry.verification.verdict == 'pass'
  - MUST_NOT_OBSERVE: curated_routes.geometryStatus == 'review'; curated_route_geometry.verification.ratio is empty/null

### AC-3 — Actual provenance is preserved, not overwritten with scraped_promoted

**Requirement:** GIVEN the passing candidate carries provenance 'ai_reconstructed' WHEN an operator approves it THEN the persisted geometry provenance and route geometryProvenance are 'ai_reconstructed', not 'scraped_promoted'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real approveDisposition provenance persistence)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: provenance is hardcoded 'scraped_promoted' regardless of the candidate's real provenance
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-candidate-passing-ai-reconstructed`
  - ACTION: Seed review-candidate-passing-ai-reconstructed (provenance ai_reconstructed); authenticate as operator; call approveDisposition({routeId:'test:redhatfix05-passing'}); query curated_route_geometry.provenance and curated_routes.geometryProvenance
  - MUST_OBSERVE: curated_route_geometry.provenance == 'ai_reconstructed'; curated_routes.geometryProvenance == 'ai_reconstructed'
  - MUST_NOT_OBSERVE: provenance == 'scraped_promoted'; geometryProvenance == 'scraped_promoted'

### AC-4 — Off-region anchors block approval, and non-operators cannot approve

**Requirement:** GIVEN a REVIEW route with off-region anchors and, separately, a non-operator caller WHEN an operator approves the off-region route AND a non-operator attempts approveDisposition THEN the off-region route stays in REVIEW with failedCondition='anchors' and riderReady=false; the non-operator call throws FORBIDDEN and mutates nothing

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real approveDisposition + region gate + requireOperator)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the in-region anchor check is skipped (a no-op) so off-region anchors pass; approveDisposition still runs a requireIdentity-only stub letting a non-operator promote geometry
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-candidate-off-region-anchors`
  - ACTION: Seed review-candidate-off-region-anchors; authenticate as operator, call approveDisposition; query curated_routes + curated_route_geometry; re-attempt approveDisposition as a non-operator; query curated_routes again
  - MUST_OBSERVE: curated_route_geometry.verification.failedCondition == 'anchors'; the non-operator re-attempt throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: curated_routes.geometryStatus == 'generated' for the off-region route; curated_routes.riderReady == true

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | approveDisposition on a 3-point candidate polyline leaves geometryStatus 'review' and riderReady false | AC-1 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-1'` |
| TC-2 | approveDisposition writes verification.failedCondition 'degenerate' for the 3-point candidate | AC-1 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-1'` |
| TC-3 | approveDisposition on a genuinely passing candidate sets geometryStatus 'generated', riderReady true, verdict 'pass' | AC-2 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-2'` |
| TC-4 | approveDisposition persists verification.ratio equal to decoded routedMiles/claimedMiles | AC-2 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-2'` |
| TC-5 | approveDisposition preserves provenance 'ai_reconstructed' and never writes 'scraped_promoted' | AC-3 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-3'` |
| TC-6 | approveDisposition on off-region anchors keeps geometryStatus 'review' with failedCondition 'anchors' | AC-4 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-4'` |
| TC-7 | approveDisposition throws FORBIDDEN for a non-operator caller and mutates no route state | AC-4 | `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/reviewQueue.ts (MODIFY) — rewrite approveDisposition to decode+re-measure+re-gate+preserve-provenance+requireOperator; add seedReviewCandidateWithPolyline seeder
- convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts (NEW)

**writeProhibited:**
- convex/curatedGeometryGate.ts — the in-region gate correction is REDHAT-FIX-07's scope; this task CALLS it, never re-implements it
- convex/guards.ts — requireOperator is REDHAT-FIX-06's scope; import and call only
- convex/schema.ts — no schema change needed for this task
- Re-implementing gate logic inline in approveDisposition instead of calling the canonical module
- Any RN/Expo/app client code

## READING LIST

- `convex/reviewQueue.ts` (235-314) — current approveDisposition: copies verification.* (anchorCount ?? 2, ratio ?? 1.0), stamps verdict:'pass' + provenance:'scraped_promoted' + riderReady:true without any gate call — the exact code to replace
- `convex/curatedGeometryGate.ts` (51-71,130-169) — haversineDistance for re-measuring routedMiles from decoded points; reevaluateExistingGeometry (region-aware canonical gate) to invoke on the decoded geometry
- `convex/actions/curatedGeometryReconstruct.ts` (1-60,420-480) — @mapbox/polyline import and verification-object shape to mirror when persisting the re-measured verification
- `convex/reviewQueue.ts` (96-229) — seedReviewQueueEntry pattern to extend into seedReviewCandidateWithPolyline for the fixtures
- `.spec/prds/route-agent-quality/10-technical-requirements/09-capability-chains.md` (1-80) — CAP-GEO-03 rider-ready gating contract
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — integration tier is PRIMARY for Convex backend

## CODE PATTERN

- Pattern: Server-side canonical re-gate on approval — requireOperator → decode stored candidate polyline via @mapbox/polyline → pointCount = points.length, routedMiles = sum of haversineDistance over consecutive points → ratio = routedMiles/claimedMiles → reevaluateExistingGeometry({ratio, pointCount, routedMiles, anchorCount, anchors:storedAnchors, quarantine}) → persist verdict/riderReady/geometryStatus/provenance strictly from the returned verdict, provenance from the candidate's real value
- Pattern source: `convex/curatedGeometryGate.ts:138-169` (reevaluateExistingGeometry) + `convex/actions/curatedGeometryReconstruct.ts` verification shape
- Anti-pattern: copying stored verification.* measurements and defaulting anchorCount ?? 2 / ratio ?? 1.0, stamping verdict:'pass' + provenance:'scraped_promoted' + riderReady:true with no gate call (the current reviewQueue.ts:256-292 behavior)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-05-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; canonical re-gate on REVIEW approval
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: REDHAT-FIX-06, REDHAT-FIX-07
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
  "task_id": "REDHAT-FIX-05",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "review-candidate-failing-degenerate": { "description": "REVIEW route whose stored verification looks passing but whose actual polyline decodes to 3 points.", "seed_method": "public_api", "records": ["seedReviewCandidateWithPolyline routeId:'test:redhatfix05-degenerate', 3-point polyline, storedVerification looks passing"] },
    "review-candidate-passing-ai-reconstructed": { "description": "REVIEW route whose actual polyline decodes to ~50 points ~41mi, in-region anchors.", "seed_method": "public_api", "records": ["seedReviewCandidateWithPolyline routeId:'test:redhatfix05-passing', POLY_41MI, provenance ai_reconstructed"] },
    "review-candidate-off-region-anchors": { "description": "REVIEW route non-degenerate, in-band ratio, but anchors 211mi from centroid.", "seed_method": "public_api", "records": ["seedReviewCandidateWithPolyline routeId:'test:redhatfix05-offregion', anchors distanceFromCentroid 211"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Approving a route whose real candidate geometry fails the gate keeps it in REVIEW", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real approveDisposition + gate + polyline decode)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["approveDisposition copies geom.verification.pointCount (a stubbed default) instead of decoding the real 3-point polyline", "riderReady is hardcoded true unconditionally", "the gate call is mocked to return pass"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-candidate-failing-degenerate", "action": { "actor": "api_client", "steps": ["Seed review-candidate-failing-degenerate", "Seed an operator identity and authenticate", "Call approveDisposition({routeId:'test:redhatfix05-degenerate'})", "Query curated_routes + curated_route_geometry"] },
          "end_state": { "must_observe": ["curated_routes.geometryStatus == 'review'", "curated_route_geometry.verification.failedCondition == 'degenerate'"], "must_not_observe": ["curated_routes.riderReady == true", "curated_route_geometry.verification.verdict == 'pass'"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Approving a route whose real candidate geometry passes promotes it to rider-ready", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real approveDisposition + gate)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the handler rejects genuinely passing geometry via a hardcoded review verdict", "verdict/ratio are copied from stored fields (stubbed) rather than re-measured"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-candidate-passing-ai-reconstructed", "action": { "actor": "api_client", "steps": ["Seed review-candidate-passing-ai-reconstructed", "Authenticate as operator", "Call approveDisposition({routeId:'test:redhatfix05-passing'})", "Query curated_routes + curated_route_geometry"] },
          "end_state": { "must_observe": ["curated_routes.geometryStatus == 'generated'", "curated_routes.riderReady == true", "curated_route_geometry.verification.verdict == 'pass'"], "must_not_observe": ["curated_routes.geometryStatus == 'review'", "curated_route_geometry.verification.ratio is empty/null"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Actual provenance is preserved, not overwritten with scraped_promoted", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real approveDisposition provenance persistence)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["provenance is hardcoded 'scraped_promoted' regardless of the candidate's real provenance"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-candidate-passing-ai-reconstructed", "action": { "actor": "api_client", "steps": ["Seed review-candidate-passing-ai-reconstructed (provenance ai_reconstructed)", "Authenticate as operator", "Call approveDisposition({routeId:'test:redhatfix05-passing'})", "Query curated_route_geometry.provenance and curated_routes.geometryProvenance"] },
          "end_state": { "must_observe": ["curated_route_geometry.provenance == 'ai_reconstructed'", "curated_routes.geometryProvenance == 'ai_reconstructed'"], "must_not_observe": ["provenance == 'scraped_promoted'", "geometryProvenance == 'scraped_promoted'"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Off-region anchors block approval, and non-operators cannot approve", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real approveDisposition + region gate + requireOperator)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the in-region anchor check is skipped (a no-op) so off-region anchors pass", "approveDisposition still runs a requireIdentity-only stub letting a non-operator promote geometry"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-candidate-off-region-anchors", "action": { "actor": "api_client", "steps": ["Seed review-candidate-off-region-anchors", "Authenticate as operator, call approveDisposition", "Query curated_routes + curated_route_geometry", "Re-attempt approveDisposition as a non-operator", "Query curated_routes again"] },
          "end_state": { "must_observe": ["curated_route_geometry.verification.failedCondition == 'anchors'", "the non-operator re-attempt throws error.code == 'FORBIDDEN'"], "must_not_observe": ["curated_routes.geometryStatus == 'generated' for the off-region route", "curated_routes.riderReady == true"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "3-point candidate stays review/riderReady false", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "failedCondition degenerate recorded", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "passing candidate promoted to generated/riderReady/pass", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "ratio re-measured from decoded geometry", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-2'" },
    { "id": "TC-5", "type": "test_criterion", "description": "provenance preserved, never scraped_promoted", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-3'" },
    { "id": "TC-6", "type": "test_criterion", "description": "off-region anchors keep route in review/anchors", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-4'" },
    { "id": "TC-7", "type": "test_criterion", "description": "non-operator approval FORBIDDEN, no mutation", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-regate.integration.test.ts -t 'AC-4'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "Approval decodes and re-measures the real candidate geometry instead of trusting stored verification (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-remeasure.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real approveDisposition + @mapbox/polyline decode + canonical gate)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["approveDisposition reads geom.verification.pointCount (stored 50) instead of decoding the real 3-point polyline (unchanged reviewQueue.ts:338-341)", "the persisted verification.pointCount equals the stored copy rather than the decoded count"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-decodes-3point-stored-passing", "action": { "actor": "api_client", "steps": ["Seed a REVIEW route whose geom.value decodes to 3 points but whose stored verification claims pointCount:50, ratio:1.0", "Call approveDisposition", "Query curated_routes + curated_route_geometry"] },
          "end_state": { "must_observe": ["curated_routes.geometryStatus == 'review'", "curated_route_geometry.verification.failedCondition == 'degenerate'", "persisted verification.pointCount == 3 (the decoded count, not 50)"], "must_not_observe": ["curated_routes.riderReady == true", "persisted verification.pointCount == 50 (the stale stored copy carried through unchanged)"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "approveDisposition persists the decoded pointCount, never the stale stored copy, and keeps a degenerate candidate in review", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX05-approval-remeasure.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
