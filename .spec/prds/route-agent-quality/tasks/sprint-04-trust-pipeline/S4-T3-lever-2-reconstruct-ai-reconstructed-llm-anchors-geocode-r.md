# S4-T3 — Lever 2 reconstruct (ai_reconstructed) LLM anchors -> geocode -> route -> gate, structured outputs via the model layer (REC-02) (UC-REC-02)
> Status: ✅ Completed
> Commit: ea61c1b3
> Reviewer: convex-reviewer
> Completed: 2026-07-18T06:11:31Z

| Field | Value |
|-------|-------|
| TASK_ID | S4-T3 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 180 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner + aisdk-planner (lever-2 structured output)` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01 |
| DEPENDS_ON | S4-T1 |
| BLOCKS | S4-T5 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

~948 Lever-2 routes with descriptions are reconstructed; anchor extraction produces 3-7 ordered intersections; geocoding filters off-region anchors; routing produces via-waypoint polylines; provenance='ai_reconstructed'

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST resolve anchor-extraction + repair-round extractions as Zod structured outputs through the Mastra model layer (convex/actions/agent/lib/models.ts) — never a bespoke provider fetch or free-text regex parse
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST use model layer getAgentModel('high') for anchor extraction
- MUTH call determineGateVerdict for every reconstructed geometry
- MUST record provenance='ai_reconstructed' on stored geometry
- MUTH respect 2-attempt budget (repair round uses same budget)

**NEVER**
- NEVER silently return an empty anchor array when the model yields no intersections or drops structured-output — fail honestly via the text-mode JSON fallback ladder or a typed error
- NEVER bypass geocoding region bias for reconstructed routes
- NEVER route without waypoint intermediates (via=true)
- NEVER store geometry that fails the gate (without repair round)
- NEVER extract anchors without structured outputs (JSON schema)
- NEVER exceed 2 total attempts per route (first + repair)

**STRICTLY**
- STRICTLY anchor extraction returns ordered intersection list
- STRICTLY geocoding rejects anchors >150mi from centroid
- STRICTLY routing thins anchors to ≤8 waypoints
- STRICTLY repair round passes geocode log as feedback
- STRICTLY better attempt is selected by |log(ratio)| distance

## DONE WHEN

- AC-1 [Lever 2 extracts ordered intersection anchors from description via LLM structured outputs] [PRIMARY]: Anchors are extracted as ordered intersection list (e.g. 'Santa Maria, CA', 'Los Olivos, CA')
- AC-2 [Lever 2 geocodes anchors with region bias, filtering off-region anchors (>150mi)]: All geocoded anchors are within 150mi of centroid
- AC-3 [Lever 2 routes via waypoints (via=true) through anchors, thinned to ≤8 points]: Polyline is routed through all anchors with via=true in intermediates
- AC-4 [Lever 2 calls gate on routed geometry, stores with provenance='ai_reconstructed' if passing, routes to repair round if failing]: Geometry is persisted with provenance='ai_reconstructed'
- AC-5 [Lever 2 repair round passes geocode log as feedback to LLM for second attempt]: Second LLM call includes 'Routed length came out X but claimed is Y' + geocode results
- AC-6 [Lever 2 routes to REVIEW queue after 2 failed attempts (exhausted budget)]: Route is queued for REVIEW with failedCondition
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Implement Lever 2 reconstruction pipeline: LLM anchor extraction (ordered intersections) → region-biased geocoding → waypoint routing → gate verification → repair round if needed

**Success state:** ~948 Lever-2 routes with descriptions are reconstructed; anchor extraction produces 3-7 ordered intersections; geocoding filters off-region anchors; routing produces via-waypoint polylines; provenance='ai_reconstructed'

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `lever2-anchor-extraction-tepusquet` (seed_method: `public_api`): Route with Tepusquet Loop description (Highway 101 in Santa Maria, Exit Betteravia Road...)
    - routeId: 'motorcycleroads:twist-of-tepusquet-loop', name: 'Twist of Tepusquet Loop', summary: 'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East...', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85
- `lever2-minimal-description` (seed_method: `public_api`): Route with minimal 2-intersection description
    - routeId: 'test:lever2-minimal', name: 'Minimal Description', summary: 'Take Highway 1 from San Francisco to Santa Cruz', lengthMiles: 50, centroidLat: 37.5, centroidLng: -122.0, compositeScore: 0.85
- `lever2-failing-ratio` (seed_method: `public_api`): Route where reconstruction fails ratio gate (routed too long)
    - routeId: 'test:lever2-fail-ratio', name: 'Failing Ratio', summary: 'Long description triggering 200mi routed from 100mi claimed', lengthMiles: 100, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Lever 2 extracts ordered intersection anchors from description via LLM structured outputs

**Requirement:** GIVEN A route with turn-by-turn description (Highway 101 in Santa Maria, Exit Betteravia Road...) WHEN Lever 2 calls the reconstruction LLM via model layer THEN Anchors are extracted as ordered intersection list (e.g. 'Santa Maria, CA', 'Los Olivos, CA')

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Mastra model layer + z.ai provider)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-anchor-extraction.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: anchor extraction is stubbed; LLM returns empty array; structured outputs are not enforced
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-anchor-extraction-tepusquet`
    - ACTION (api_client): Seed route with Tepusquet description; Call extractAnchors via model layer; Verify ordered anchors returned
    - MUST_OBSERVE: anchors.length >= 3, anchors[0] contains 'Santa Maria', anchors sorted by .order ascending (anchors[0].order == 0)
    - MUST_NOT_OBSERVE: anchors.length == 0, anchors are unordered
- CASE 2 — start_ref `lever2-anchor-extraction-minimal`
    - ACTION (api_client): Seed route with minimal 2-intersection description; Call extractAnchors; Verify 2 anchors returned
    - MUST_OBSERVE: anchors.length == 2
    - MUST_NOT_OBSERVE: anchors.length < 2, LLM call failed

### AC-2 — Lever 2 geocodes anchors with region bias, filtering off-region anchors (>150mi)

**Requirement:** GIVEN Extracted anchors ['Santa Maria, CA', 'Los Olivos, CA'] and centroid (34.95, -120.42) WHEN Lever 2 geocodes each anchor with bounds centered on centroid THEN All geocoded anchors are within 150mi of centroid

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding API with region bias)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: geocoding is mocked; region bias is not applied; off-region anchors are not filtered
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-geocode-with-bias`
    - ACTION (api_client): Geocode 'Santa Maria, CA' with centroid (34.95, -120.42); Verify response includes lat/lng within 150mi
    - MUST_OBSERVE: geocodedAnchors[0].lat != null AND geocodedAnchors[0].lng != null, distanceFromCentroid <= 150
    - MUST_NOT_OBSERVE: distanceFromCentroid > 150, geocoding failed
- CASE 2 — start_ref `lever2-geocode-off-region-filtered`
    - ACTION (api_client): Geocode anchor 300mi from centroid; Verify isAnchorInRegion returns false; Verify anchor is filtered out
    - MUST_OBSERVE: isAnchorInRegion == false, offRegionAnchor present in routingIntermediates == false
    - MUST_NOT_OBSERVE: anchor used for routing

### AC-3 — Lever 2 routes via waypoints (via=true) through anchors, thinned to ≤8 points

**Requirement:** GIVEN 7 geocoded in-region anchors WHEN Lever 2 calls Google Routes API with via-waypoint routing THEN Polyline is routed through all anchors with via=true in intermediates

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Google Routes API with via-waypoints)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: routing is mocked; intermediates don't use via=true; anchor thinning is bypassed
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-route-via-waypoints`
    - ACTION (api_client): Route through 7 anchors with via=true; Verify polyline encoded response; Verify routedMiles > 0
    - MUST_OBSERVE: encodedPolyline.length > 100 characters, distanceMeters > 0, intermediates.every(i => i.via == true) (all via-waypoints)
    - MUST_NOT_OBSERVE: routing failed, via=false in intermediates
- CASE 2 — start_ref `lever2-anchor-thinning`
    - ACTION (api_client): Generate 15 anchors; Call thinAnchorsForRouting(anchors, 8); Verify 8 anchors returned
    - MUST_OBSERVE: thinnedAnchors.length == 8, thinnedAnchors first == anchors[0] and last == anchors[N-1]
    - MUST_NOT_OBSERVE: thinnedAnchors.length > 8, all anchors used

### AC-4 — Lever 2 calls gate on routed geometry, stores with provenance='ai_reconstructed' if passing, routes to repair round if failing

**Requirement:** GIVEN Routed polyline with 50 points, routedMiles=41, claimedMiles=41 WHEN Lever 2 calls determineGateVerdict and verdict='pass' THEN Geometry is persisted with provenance='ai_reconstructed'

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + persistGeometryVerified)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-gate-persist.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: gate is bypassed; provenance is not set; persistGeometryVerified is not called
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever2-persist-passing`
    - ACTION (api_client): Seed route with description; Run Lever 2 reconstructForRoute; Query curated_route_geometry
    - MUST_OBSERVE: verification.verdict == 'pass', verification.provenance == 'ai_reconstructed', verification.routedMiles > 0
    - MUST_NOT_OBSERVE: verification.verdict == 'review', provenance == null
- CASE 2 — start_ref `lever2-route-to-repair`
    - ACTION (api_client): Seed route where first attempt fails gate; Run reconstructForRoute; Verify repair round runs
    - MUST_OBSERVE: routingCallCount == 2, storedRatio == max(attempt1Ratio, attempt2Ratio)
    - MUST_NOT_OBSERVE: routingCallCount == 1, first attempt stored if worse

### AC-5 — Lever 2 repair round passes geocode log as feedback to LLM for second attempt

**Requirement:** GIVEN First reconstruction fails gate with ratio=0.5 WHEN Repair round runs with geocode log feedback THEN Second LLM call includes 'Routed length came out X but claimed is Y' + geocode results

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real repair round with feedback)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-repair-feedback.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: feedback is not passed to LLM; geocode log is not included; repair round is stubbed
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-repair-feedback-includes-log`
    - ACTION (api_client): Run first attempt (fails); Capture repair round feedback; Verify geocode log is included
    - MUST_OBSERVE: feedback.geocodeLog.length >= 1, feedback.text contains 'Routed length' literal
    - MUST_NOT_OBSERVE: feedback is empty, geocode log missing

### AC-6 — Lever 2 routes to REVIEW queue after 2 failed attempts (exhausted budget)

**Requirement:** GIVEN Route where both first and repair attempts fail the gate WHEN Repair round completes and second attempt also fails THEN Route is queued for REVIEW with failedCondition

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Lever 2 + REVIEW queue)
- FLOW_REF: UC-REC-02
- VERIFY: `pnpm test convex/__tests__/S4T3-lever2-exhausted-to-review.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: REVIEW queue is not updated; budget is exceeded (>2 attempts); failure reason is not recorded
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever2-exhausted-to-review`
    - ACTION (api_client): Seed route where both attempts fail; Run reconstructForRoute; Verify REVIEW queue entry
    - MUST_OBSERVE: reviewQueue.length == 1, routingCallCount == 2, verdict == 'review'
    - MUST_NOT_OBSERVE: routingCallCount > 2, verdict == 'pass'

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Lever 2 extracts ordered intersection anchors from description | AC-1 | `pnpm test convex/__tests__/S4T3-lever2-anchor-extraction.integration.test.ts --grep 'TC-1'` |
| TC-2 | Lever 2 geocodes anchors with region bias | AC-2 | `pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts --grep 'TC-2'` |
| TC-3 | Lever 2 filters off-region anchors | AC-2 | `pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts --grep 'TC-3'` |
| TC-4 | Lever 2 routes via waypoints with via=true | AC-3 | `pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts --grep 'TC-4'` |
| TC-5 | Lever 2 thins anchors to ≤8 waypoints | AC-3 | `pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts --grep 'TC-5'` |
| TC-6 | Lever 2 stores passing geometry with provenance ai_reconstructed | AC-4 | `pnpm test convex/__tests__/S4T3-lever2-gate-persist.integration.test.ts --grep 'TC-6'` |
| TC-7 | Lever 2 repair round passes geocode log as feedback | AC-5 | `pnpm test convex/__tests__/S4T3-lever2-repair-feedback.integration.test.ts --grep 'TC-7'` |
| TC-8 | Lever 2 routes to REVIEW after 2 failed attempts | AC-6 | `pnpm test convex/__tests__/S4T3-lever2-exhausted-to-review.integration.test.ts --grep 'TC-8'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/curatedGeometryReconstruct.ts (MODIFY) - extend reconstructForRoute for full pipeline
- convex/actions/agent/lib/anchorExtraction.ts (MODIFY) - add structured outputs
- convex/actions/agent/lib/models.ts (MODIFY) - getAgentModel('high') for anchors
- convex/actions/agent/providers/geocodingProvider.ts (MODIFY) - region bias bounds
- convex/__tests__/S4T3-*.integration.test.ts (NEW) - integration tests

**writeProhibited:**
- Bypassing model layer - must use getAgentModel
- Skipping geocoding region bias - must apply centroid bounds
- Routing without via=true - must use waypoint routing
- Exceeding 2-attempt budget - repair round enforces this
- Storing geometry without gate verification - persistGeometryVerified only

## READING LIST

- `convex/actions/curatedGeometryReconstruct.ts` (326-421) — Reconstruct pipeline with repair round
- `convex/actions/agent/lib/anchorExtraction.ts` (extractAnchors) — LLM anchor extraction with structured outputs
- `convex/actions/agent/lib/models.ts` (10-48) — Model layer (getAgentModel 'high' for anchor extraction)
- `convex/actions/agent/providers/geocodingProvider.ts` (geocode with bounds) — Region-biased geocoding pattern
- `convex/actions/agent/providers/routingProvider.ts` (via-waypoint routing) — Google Routes API with via=true

## CODE PATTERN

- Pattern: LLM anchors → geocode → route → gate → repair
- Pattern source: `convex/actions/curatedGeometryReconstruct.ts:326-421`
- Anti-pattern: Bypassing gate, unstructured LLM outputs, exceeded budget

## VERIFICATION GATES

- test: `pnpm test convex/__tests__/S4T3-*.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator: `python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py .spec/tasks/sprint-04/S4-T3.json` → Exit 0, zero CRITICAL violations

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - Lever 2 reconstruction pipeline with LLM anchor extraction, geocoding, routing, and gate verification
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S4-T1
- Blocks: S4-T5

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
  "task_id": "S4-T3",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "lever2-anchor-extraction-tepusquet": {
      "description": "Route with Tepusquet Loop description (Highway 101 in Santa Maria, Exit Betteravia Road...)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'motorcycleroads:twist-of-tepusquet-loop', name: 'Twist of Tepusquet Loop', summary: 'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East...', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85"
      ]
    },
    "lever2-minimal-description": {
      "description": "Route with minimal 2-intersection description",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever2-minimal', name: 'Minimal Description', summary: 'Take Highway 1 from San Francisco to Santa Cruz', lengthMiles: 50, centroidLat: 37.5, centroidLng: -122.0, compositeScore: 0.85"
      ]
    },
    "lever2-failing-ratio": {
      "description": "Route where reconstruction fails ratio gate (routed too long)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever2-fail-ratio', name: 'Failing Ratio', summary: 'Long description triggering 200mi routed from 100mi claimed', lengthMiles: 100, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a route with turn-by-turn description (Highway 101 in Santa Maria, Exit Betteravia Road...) WHEN Lever 2 calls the reconstruction LLM via model layer THEN anchors are extracted as ordered intersection list (e.g. 'Santa Maria, CA', 'Los Olivos, CA')",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-anchor-extraction.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Mastra model layer + z.ai provider)",
        "negative_control": {
          "would_fail_if": [
            "anchor extraction is stubbed",
            "LLM returns empty array",
            "structured outputs are not enforced"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-anchor-extraction-tepusquet",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with Tepusquet description",
                "Call extractAnchors via model layer",
                "Verify ordered anchors returned"
              ]
            },
            "end_state": {
              "must_observe": [
                "anchors.length >= 3",
                "anchors[0] contains 'Santa Maria'",
                "anchors sorted by .order ascending (anchors[0].order == 0)"
              ],
              "must_not_observe": [
                "anchors.length == 0",
                "anchors are unordered"
              ]
            }
          },
          {
            "start_ref": "lever2-anchor-extraction-minimal",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with minimal 2-intersection description",
                "Call extractAnchors",
                "Verify 2 anchors returned"
              ]
            },
            "end_state": {
              "must_observe": [
                "anchors.length == 2"
              ],
              "must_not_observe": [
                "anchors.length < 2",
                "LLM call failed"
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
      "description": "GIVEN extracted anchors ['Santa Maria, CA', 'Los Olivos, CA'] and centroid (34.95, -120.42) WHEN Lever 2 geocodes each anchor with bounds centered on centroid THEN all geocoded anchors are within 150mi of centroid",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Google Geocoding API with region bias)",
        "negative_control": {
          "would_fail_if": [
            "geocoding is mocked",
            "region bias is not applied",
            "off-region anchors are not filtered"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-geocode-with-bias",
            "action": {
              "actor": "api_client",
              "steps": [
                "Geocode 'Santa Maria, CA' with centroid (34.95, -120.42)",
                "Verify response includes lat/lng within 150mi"
              ]
            },
            "end_state": {
              "must_observe": [
                "geocodedAnchors[0].lat != null AND geocodedAnchors[0].lng != null",
                "distanceFromCentroid <= 150"
              ],
              "must_not_observe": [
                "distanceFromCentroid > 150",
                "geocoding failed"
              ]
            }
          },
          {
            "start_ref": "lever2-geocode-off-region-filtered",
            "action": {
              "actor": "api_client",
              "steps": [
                "Geocode anchor 300mi from centroid",
                "Verify isAnchorInRegion returns false",
                "Verify anchor is filtered out"
              ]
            },
            "end_state": {
              "must_observe": [
                "isAnchorInRegion == false",
                "offRegionAnchor present in routingIntermediates == false"
              ],
              "must_not_observe": [
                "anchor used for routing"
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
      "description": "GIVEN 7 geocoded in-region anchors WHEN Lever 2 calls Google Routes API with via-waypoint routing THEN polyline is routed through all anchors with via=true in intermediates",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Google Routes API with via-waypoints)",
        "negative_control": {
          "would_fail_if": [
            "routing is mocked",
            "intermediates don't use via=true",
            "anchor thinning is bypassed"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-route-via-waypoints",
            "action": {
              "actor": "api_client",
              "steps": [
                "Route through 7 anchors with via=true",
                "Verify polyline encoded response",
                "Verify routedMiles > 0"
              ]
            },
            "end_state": {
              "must_observe": [
                "encodedPolyline.length > 100 characters",
                "distanceMeters > 0",
                "intermediates.every(i => i.via == true) (all via-waypoints)"
              ],
              "must_not_observe": [
                "routing failed",
                "via=false in intermediates"
              ]
            }
          },
          {
            "start_ref": "lever2-anchor-thinning",
            "action": {
              "actor": "api_client",
              "steps": [
                "Generate 15 anchors",
                "Call thinAnchorsForRouting(anchors, 8)",
                "Verify 8 anchors returned"
              ]
            },
            "end_state": {
              "must_observe": [
                "thinnedAnchors.length == 8",
                "thinnedAnchors first == anchors[0] and last == anchors[N-1]"
              ],
              "must_not_observe": [
                "thinnedAnchors.length > 8",
                "all anchors used"
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
      "description": "GIVEN routed polyline with 50 points, routedMiles=41, claimedMiles=41 WHEN Lever 2 calls determineGateVerdict and verdict='pass' THEN geometry is persisted with provenance='ai_reconstructed'",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-gate-persist.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + persistGeometryVerified)",
        "negative_control": {
          "would_fail_if": [
            "gate is bypassed",
            "provenance is not set",
            "persistGeometryVerified is not called"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-persist-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with description",
                "Run Lever 2 reconstructForRoute",
                "Query curated_route_geometry"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'pass'",
                "verification.provenance == 'ai_reconstructed'",
                "verification.routedMiles > 0"
              ],
              "must_not_observe": [
                "verification.verdict == 'review'",
                "provenance == null"
              ]
            }
          },
          {
            "start_ref": "lever2-route-to-repair",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route where first attempt fails gate",
                "Run reconstructForRoute",
                "Verify repair round runs"
              ]
            },
            "end_state": {
              "must_observe": [
                "routingCallCount == 2",
                "storedRatio == max(attempt1Ratio, attempt2Ratio)"
              ],
              "must_not_observe": [
                "routingCallCount == 1",
                "first attempt stored if worse"
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
      "description": "GIVEN first reconstruction fails gate with ratio=0.5 WHEN repair round runs with geocode log feedback THEN second LLM call includes 'Routed length came out X but claimed is Y' + geocode results",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-repair-feedback.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real repair round with feedback)",
        "negative_control": {
          "would_fail_if": [
            "feedback is not passed to LLM",
            "geocode log is not included",
            "repair round is stubbed"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-repair-feedback-includes-log",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run first attempt (fails)",
                "Capture repair round feedback",
                "Verify geocode log is included"
              ]
            },
            "end_state": {
              "must_observe": [
                "feedback.geocodeLog.length >= 1",
                "feedback.text contains 'Routed length' literal"
              ],
              "must_not_observe": [
                "feedback is empty",
                "geocode log missing"
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
      "description": "GIVEN route where both first and repair attempts fail the gate WHEN repair round completes and second attempt also fails THEN route is queued for REVIEW with failedCondition",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-exhausted-to-review.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Lever 2 + REVIEW queue)",
        "negative_control": {
          "would_fail_if": [
            "REVIEW queue is not updated",
            "budget is exceeded (>2 attempts)",
            "failure reason is not recorded"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever2-exhausted-to-review",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route where both attempts fail",
                "Run reconstructForRoute",
                "Verify REVIEW queue entry"
              ]
            },
            "end_state": {
              "must_observe": [
                "reviewQueue.length == 1",
                "routingCallCount == 2",
                "verdict == 'review'"
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
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Lever 2 extracts ordered intersection anchors from description",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-anchor-extraction.integration.test.ts --grep 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Lever 2 geocodes anchors with region bias",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts --grep 'TC-2'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Lever 2 filters off-region anchors",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-geocode-region.integration.test.ts --grep 'TC-3'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Lever 2 routes via waypoints with via=true",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts --grep 'TC-4'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Lever 2 thins anchors to ≤8 waypoints",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-waypoint-routing.integration.test.ts --grep 'TC-5'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Lever 2 stores passing geometry with provenance ai_reconstructed",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-gate-persist.integration.test.ts --grep 'TC-6'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Lever 2 repair round passes geocode log as feedback",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-repair-feedback.integration.test.ts --grep 'TC-7'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Lever 2 routes to REVIEW after 2 failed attempts",
      "verify": "pnpm test convex/__tests__/S4T3-lever2-exhausted-to-review.integration.test.ts --grep 'TC-8'",
      "maps_to_ac": "AC-6"
    }
  ]
}
-->
</details>
