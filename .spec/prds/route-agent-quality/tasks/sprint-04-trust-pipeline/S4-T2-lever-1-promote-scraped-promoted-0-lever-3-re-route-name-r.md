# S4-T2 — Lever 1 promote (scraped_promoted, $0) + Lever 3 re-route (name_routed) deterministic paths (REC-01, REC-03) (UC-REC-01, UC-REC-03)
> Status: ✅ Completed
> Commit: 0ff2e06f7f25de1683f75bc2be1c097a774b65c2
> Reviewer: convex-reviewer
> Completed: 2026-07-18T04:28:59Z

| Field | Value |
|-------|-------|
| TASK_ID | S4-T2 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 180 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-02, CAP-GEO-06 |
| DEPENDS_ON | S4-T1 |
| BLOCKS | S4-T5 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

~1,752 Lever-1 routes with valid polylines are promoted; ~1,076 Lever-3 routes are re-routed; provenance is recorded; failures route correctly (L1→next lever, L3→REVIEW)

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST call curatedGeometryGate.determineGateVerdict for every geometry
- MUST use real Google Geocoding API for endpoint parsing (no mocks)
- MUST record provenance='scraped_promoted' for Lever 1, provenance='name_routed' for Lever 3
- MUST send Lever 1 failures to next lever (NOT REVIEW), Lever 3 failures to REVIEW queue

**NEVER**
- NEVER promote in-row polyline that fails the gate
- NEVER store name_routed geometry without gate verification
- NEVER use LLM for endpoint parsing (deterministic parser only)
- NEVER bypass geocoding region bias (150mi check still applies)
- NEVER let a Lever 3 failure continue to next lever (REVIEW is terminal)

**STRICTLY**
- STRICTLY Lever 1 is zero-cost (no LLM, no geocoding, just polyline decode)
- STRICTLY Lever 3 parses A-to-B / road-name structure deterministically
- STRICTLY both levers pass the same gate (ratio 0.6–1.6, anchors, degenerate)
- STRICTLY Lever 3 geocodes with region bias (centroid ±1.2° bounds)
- STRICTLY provenance is stamped on every stored geometry row

## DONE WHEN

- AC-1 [Lever 1 decodes and length-validates in-row polyline, promoting gate-passing rows with provenance='scraped_promoted'] [PRIMARY]: Geometry is persisted with provenance='scraped_promoted' and verification.verdict='pass'
- AC-2 [Lever 1 sends failing routes to next lever (not REVIEW queue)]: Route is NOT stored and is sent to Lever 2 queue (not REVIEW)
- AC-3 [Lever 3 parses A-to-B / road-name structure, geocodes endpoints with region bias, routes via Google, gates result, stores provenance='name_routed']: Geometry is persisted with provenance='name_routed' and verification.verdict='pass' (if gate passes)
- AC-4 [Lever 3 sends gate-failing routes to REVIEW queue (terminal state)]: Route is queued for REVIEW with failure reason (not sent to next lever)
- AC-5 [Lever 3 deterministic parser extracts A-to-B and road-name structures without LLM]: Endpoints are extracted without LLM calls (zero cost)
- AC-6 [Lever 3 geocoding uses region bias (centroid ±1.2° bounds) to anchor queries]: Geocode API call includes bounds parameter centered on centroid
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Implement Lever 1 (promote legacy in-row polylines at zero cost) and Lever 3 (deterministic A-to-B re-routing via parsed endpoints), both calling the single gate and recording provenance

**Success state:** ~1,752 Lever-1 routes with valid polylines are promoted; ~1,076 Lever-3 routes are re-routed; provenance is recorded; failures route correctly (L1→next lever, L3→REVIEW)

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `lever1-promote-passing` (seed_method: `public_api`): Route with in-row polyline (50 points, 41mi decoded), claimedMiles=41
    - routeId: 'test:lever1-pass', name: 'Lever 1 Passing', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 41, compositeScore: 0.85
- `lever1-promote-failing` (seed_method: `public_api`): Route with in-row polyline (100 points, 200mi decoded), claimedMiles=100 (ratio 2.0, fails)
    - routeId: 'test:lever1-fail', name: 'Lever 1 Failing', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 100, compositeScore: 0.85
- `lever3-highway-passing` (seed_method: `public_api`): Route with highway reference pattern, centroid in CA
    - routeId: 'test:lever3-hwy', name: 'Route 680 — Alameda County', centroidLat: 37.7, centroidLng: -122.0, lengthMiles: 25, compositeScore: 0.85, highwayNumber: '680', state: 'California'
- `lever3-ato-b-passing` (seed_method: `public_api`): Route with A-to-B pattern
    - routeId: 'test:lever3-ato-b', name: 'San Francisco to Santa Cruz — Coastal Run', centroidLat: 37.5, centroidLng: -122.0, lengthMiles: 50, compositeScore: 0.85, state: 'California'
- `lever3-failing-ratio` (seed_method: `public_api`): Route where re-routing produces ratio out of band
    - routeId: 'test:lever3-fail', name: 'Long Route Short Name', centroidLat: 34.95, centroidLng: -120.42, lengthMiles: 10, compositeScore: 0.85

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Lever 1 decodes and length-validates in-row polyline, promoting gate-passing rows with provenance='scraped_promoted'

**Requirement:** GIVEN A route with legacy in-row polyline (curatedRoutePolyline field) containing 50 points, decoded length=41mi, claimedMiles=41 WHEN Lever 1 decodes the polyline and calls the gate THEN Geometry is persisted with provenance='scraped_promoted' and verification.verdict='pass'

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Lever 1 promotion path + Google-free polyline decode)
- FLOW_REF: UC-REC-01
- VERIFY: `pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: polyline decode is stubbed; gate is bypassed for in-row geometry; provenance is not set to 'scraped_promoted'
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever1-promote-passing`
    - ACTION (api_client): Seed route with in-row polyline (50 points, 41mi decoded), claimedMiles=41; Run Lever 1 promote path; Query curated_route_geometry for routeId
    - MUST_OBSERVE: verification.verdict == 'pass', verification.provenance == 'scraped_promoted', verification.routedMiles == 41
    - MUST_NOT_OBSERVE: verification.verdict == 'review', verification.provenance == null
- CASE 2 — start_ref `lever1-promote-failing-ratio`
    - ACTION (api_client): Seed route with in-row polyline (50 points, 200mi decoded), claimedMiles=100; Run Lever 1 promote path; Verify route is NOT persisted
    - MUST_OBSERVE: curated_route_geometry row does not exist or verdict='review'
    - MUST_NOT_OBSERVE: verification.verdict == 'pass', verification.provenance == 'scraped_promoted'

### AC-2 — Lever 1 sends failing routes to next lever (not REVIEW queue)

**Requirement:** GIVEN A route with in-row polyline that fails the gate (ratio out of band) WHEN Lever 1 processes the route and gate fails THEN Route is NOT stored and is sent to Lever 2 queue (not REVIEW)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Lever 1 failure routing)
- FLOW_REF: UC-REC-01
- VERIFY: `pnpm test convex/__tests__/S4T2-lever1-failure-routing.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: failing routes are sent to REVIEW queue; failure routing is stubbed; next lever queue is not updated
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever1-failure-to-next-lever`
    - ACTION (api_client): Seed route with failing in-row polyline; Run Lever 1; Verify route is queued for Lever 2 (not REVIEW)
    - MUST_OBSERVE: route queued for Lever 2 processing
    - MUST_NOT_OBSERVE: route queued for REVIEW, geometry stored with verdict='pass'

### AC-3 — Lever 3 parses A-to-B / road-name structure, geocodes endpoints with region bias, routes via Google, gates result, stores provenance='name_routed'

**Requirement:** GIVEN A route with name='Route 680 — Alameda County' (highway reference pattern) WHEN Lever 3 parses endpoints, geocodes, routes, and gates THEN Geometry is persisted with provenance='name_routed' and verification.verdict='pass' (if gate passes)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding + Routes API)
- FLOW_REF: UC-REC-03
- VERIFY: `pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Google API calls are mocked; parser is deterministic but geocoding is stubbed; provenance is not set to 'name_routed'
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever3-highway-reroute-passing`
    - ACTION (api_client): Seed route with name='Route 680 — Alameda County', centroid in CA; Run Lever 3 parse → geocode → route → gate; Query curated_route_geometry
    - MUST_OBSERVE: verification.verdict == 'pass', verification.provenance == 'name_routed', verification.routedMiles > 0
    - MUST_NOT_OBSERVE: verification.verdict == 'review', verification.provenance == null
- CASE 2 — start_ref `lever3-ato-b-reroute-passing`
    - ACTION (api_client): Seed route with name='San Francisco to Santa Cruz — Coastal Run'; Run Lever 3 parse → geocode → route → gate; Query curated_route_geometry
    - MUST_OBSERVE: verification.verdict == 'pass', verification.provenance == 'name_routed', anchorCount == 2
    - MUST_NOT_OBSERVE: verification.verdict == 'review'

### AC-4 — Lever 3 sends gate-failing routes to REVIEW queue (terminal state)

**Requirement:** GIVEN A route with parsed endpoints that geocode and route but fail the gate (ratio out of band) WHEN Lever 3 completes re-routing and gate fails THEN Route is queued for REVIEW with failure reason (not sent to next lever)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Lever 3 + REVIEW queue)
- FLOW_REF: UC-REC-03
- VERIFY: `pnpm test convex/__tests__/S4T2-lever3-failure-to-review.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: REVIEW queue is not updated; failure reason is not recorded; route is sent to next lever instead
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever3-failure-to-review-queue`
    - ACTION (api_client): Seed route where re-routing fails gate; Run Lever 3; Verify REVIEW queue entry exists
    - MUST_OBSERVE: reviewQueue.length == 1 AND reviewQueue[0].failedCondition != null
    - MUST_NOT_OBSERVE: route queued for next lever, geometry stored with verdict='pass'

### AC-5 — Lever 3 deterministic parser extracts A-to-B and road-name structures without LLM

**Requirement:** GIVEN Route names matching 'from X to Y' or 'Route N — County' or 'A — B' patterns WHEN Lever 3 parser runs deterministic regex extraction THEN Endpoints are extracted without LLM calls (zero cost)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real deterministic parser, no LLM)
- FLOW_REF: UC-REC-03
- VERIFY: `pnpm test convex/__tests__/S4T2-lever3-parser-deterministic.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: LLM is called for parsing; parser is a stub returning fixed endpoints; regex patterns are not matched
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `lever3-parser-from-to`
    - ACTION (api_client): Parse 'from San Francisco to Santa Cruz'; Verify extracted endpoints are ['San Francisco', 'Santa Cruz']
    - MUST_OBSERVE: endpoints.length == 2, endpoints[0] == 'San Francisco', endpoints[1] == 'Santa Cruz'
    - MUST_NOT_OBSERVE: endpoints.length != 2, LLM call made
- CASE 2 — start_ref `lever3-parser-highway`
    - ACTION (api_client): Parse 'Route 680 — Alameda County'; Verify highway number '680' and county 'Alameda' extracted
    - MUST_OBSERVE: highwayNumber == '680', region == 'Alameda County'
    - MUST_NOT_OBSERVE: LLM call made, extraction failed

### AC-6 — Lever 3 geocoding uses region bias (centroid ±1.2° bounds) to anchor queries

**Requirement:** GIVEN A route with centroid (34.95, -120.42) and endpoint 'Santa Maria' WHEN Lever 3 geocodes the endpoint with region bias THEN Geocode API call includes bounds parameter centered on centroid

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding API with bounds)
- FLOW_REF: UC-REC-03
- VERIFY: `pnpm test convex/__tests__/S4T2-lever3-geocode-bias.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Geocoding is called without bounds; bounds are hardcoded; geocoding is mocked
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever3-geocode-with-bias`
    - ACTION (api_client): Geocode 'Santa Maria' with centroid (34.95, -120.42); Capture Google API request URL; Verify bounds parameter matches centroid ±1.2°
    - MUST_OBSERVE: geocodeUrl contains 'bounds=' (region-biased to centroid), bounds centered on (34.95, -120.42)
    - MUST_NOT_OBSERVE: no bounds parameter, bounds not matching centroid

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Lever 1 promotes gate-passing in-row polylines with provenance scraped_promoted | AC-1 | `pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts --grep 'TC-1'` |
| TC-2 | Lever 1 rejects gate-failing in-row polylines | AC-1 | `pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts --grep 'TC-2'` |
| TC-3 | Lever 1 routes failures to next lever not REVIEW | AC-2 | `pnpm test convex/__tests__/S4T2-lever1-failure-routing.integration.test.ts --grep 'TC-3'` |
| TC-4 | Lever 3 parses A-to-B structures deterministically | AC-3 | `pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts --grep 'TC-4'` |
| TC-5 | Lever 3 parses road-name structures deterministically | AC-3 | `pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts --grep 'TC-5'` |
| TC-6 | Lever 3 routes failures to REVIEW queue | AC-4 | `pnpm test convex/__tests__/S4T2-lever3-failure-to-review.integration.test.ts --grep 'TC-6'` |
| TC-7 | Lever 3 parser does not call LLM | AC-5 | `pnpm test convex/__tests__/S4T2-lever3-parser-deterministic.integration.test.ts --grep 'TC-7'` |
| TC-8 | Lever 3 geocoding includes region bias | AC-6 | `pnpm test convex/__tests__/S4T2-lever3-geocode-bias.integration.test.ts --grep 'TC-8'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryReconstruct.ts (MODIFY) - add Lever 1 promote + Lever 3 re-route paths
- convex/curatedRoutes.ts (MODIFY) - add deterministic parser for A-to-B / road-name patterns
- convex/actions/agent/lib/endpointParser.ts (NEW) - deterministic regex parser
- convex/__tests__/S4T2-*.integration.test.ts (NEW) - integration tests for both levers
- convex/schema.ts (MODIFY) - REVIEW queue table schema

**writeProhibited:**
- LLM calls for endpoint parsing - must be deterministic regex
- Bypassing gate for Lever 1 legacy polylines - gate applies to ALL geometry
- Storing geometry without provenance field - both levers must stamp provenance
- Sending Lever 3 failures to next lever - REVIEW is terminal for Lever 3
- Hardcoding geocoding bounds - must be computed from centroid

## READING LIST

- `convex/curatedGeometryReconstruct.ts` (93-172) — Geocoding and routing patterns for Lever 3
- `convex/curatedRoutes.ts` (190-280) — A-to-B / road-name parsing patterns
- `convex/curatedGeometryGate.ts` (73-96) — determineGateVerdict function
- `convex/curatedGeometry.ts` (persistGeometryVerified) — Geometry persistence via verified gate
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — Integration test tier is PRIMARY

## CODE PATTERN

- Pattern: Zero-cost promotion (L1) + deterministic re-routing (L3)
- Pattern source: `convex/curatedGeometryReconstruct.ts:93-212`
- Anti-pattern: LLM-based endpoint parsing, gate bypass, missing provenance

## VERIFICATION GATES

- test: `pnpm test convex/__tests__/S4T2-*.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator: `python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py .spec/tasks/sprint-04/S4-T2.json` → Exit 0, zero CRITICAL violations

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - both levers are deterministic path operations (promotion + re-routing) with zero LLM cost
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
  "task_id": "S4-T2",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "lever1-promote-passing": {
      "description": "Route with in-row polyline (50 points, 41mi decoded), claimedMiles=41",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever1-pass', name: 'Lever 1 Passing', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "lever1-promote-failing": {
      "description": "Route with in-row polyline (100 points, 200mi decoded), claimedMiles=100 (ratio 2.0, fails)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever1-fail', name: 'Lever 1 Failing', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 100, compositeScore: 0.85"
      ]
    },
    "lever3-highway-passing": {
      "description": "Route with highway reference pattern, centroid in CA",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever3-hwy', name: 'Route 680 — Alameda County', centroidLat: 37.7, centroidLng: -122.0, lengthMiles: 25, compositeScore: 0.85, highwayNumber: '680', state: 'California'"
      ]
    },
    "lever3-ato-b-passing": {
      "description": "Route with A-to-B pattern",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever3-ato-b', name: 'San Francisco to Santa Cruz — Coastal Run', centroidLat: 37.5, centroidLng: -122.0, lengthMiles: 50, compositeScore: 0.85, state: 'California'"
      ]
    },
    "lever3-failing-ratio": {
      "description": "Route where re-routing produces ratio out of band",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever3-fail', name: 'Long Route Short Name', centroidLat: 34.95, centroidLng: -120.42, lengthMiles: 10, compositeScore: 0.85"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a route with legacy in-row polyline (curatedRoutePolyline field) containing 50 points, decoded length=41mi, claimedMiles=41 WHEN Lever 1 decodes the polyline and calls the gate THEN geometry is persisted with provenance='scraped_promoted' and verification.verdict='pass'",
      "verify": "pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Lever 1 promotion path + Google-free polyline decode)",
        "negative_control": {
          "would_fail_if": [
            "polyline decode is stubbed",
            "gate is bypassed for in-row geometry",
            "provenance is not set to 'scraped_promoted'"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever1-promote-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with in-row polyline (50 points, 41mi decoded), claimedMiles=41",
                "Run Lever 1 promote path",
                "Query curated_route_geometry for routeId"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'pass'",
                "verification.provenance == 'scraped_promoted'",
                "verification.routedMiles == 41"
              ],
              "must_not_observe": [
                "verification.verdict == 'review'",
                "verification.provenance == null"
              ]
            }
          },
          {
            "start_ref": "lever1-promote-failing-ratio",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with in-row polyline (50 points, 200mi decoded), claimedMiles=100",
                "Run Lever 1 promote path",
                "Verify route is NOT persisted"
              ]
            },
            "end_state": {
              "must_observe": [
                "curated_route_geometry row does not exist or verdict='review'"
              ],
              "must_not_observe": [
                "verification.verdict == 'pass'",
                "verification.provenance == 'scraped_promoted'"
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
      "description": "GIVEN a route with in-row polyline that fails the gate (ratio out of band) WHEN Lever 1 processes the route and gate fails THEN route is NOT stored and is sent to Lever 2 queue (not REVIEW)",
      "verify": "pnpm test convex/__tests__/S4T2-lever1-failure-routing.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Lever 1 failure routing)",
        "negative_control": {
          "would_fail_if": [
            "failing routes are sent to REVIEW queue",
            "failure routing is stubbed",
            "next lever queue is not updated"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever1-failure-to-next-lever",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with failing in-row polyline",
                "Run Lever 1",
                "Verify route is queued for Lever 2 (not REVIEW)"
              ]
            },
            "end_state": {
              "must_observe": [
                "route queued for Lever 2 processing"
              ],
              "must_not_observe": [
                "route queued for REVIEW",
                "geometry stored with verdict='pass'"
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
      "description": "GIVEN a route with name='Route 680 — Alameda County' (highway reference pattern) WHEN Lever 3 parses endpoints, geocodes, routes, and gates THEN geometry is persisted with provenance='name_routed' and verification.verdict='pass' (if gate passes)",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Google Geocoding + Routes API)",
        "negative_control": {
          "would_fail_if": [
            "Google API calls are mocked",
            "parser is deterministic but geocoding is stubbed",
            "provenance is not set to 'name_routed'"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever3-highway-reroute-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with name='Route 680 — Alameda County', centroid in CA",
                "Run Lever 3 parse → geocode → route → gate",
                "Query curated_route_geometry"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'pass'",
                "verification.provenance == 'name_routed'",
                "verification.routedMiles > 0"
              ],
              "must_not_observe": [
                "verification.verdict == 'review'",
                "verification.provenance == null"
              ]
            }
          },
          {
            "start_ref": "lever3-ato-b-reroute-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with name='San Francisco to Santa Cruz — Coastal Run'",
                "Run Lever 3 parse → geocode → route → gate",
                "Query curated_route_geometry"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'pass'",
                "verification.provenance == 'name_routed'",
                "anchorCount == 2"
              ],
              "must_not_observe": [
                "verification.verdict == 'review'"
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
      "description": "GIVEN a route with parsed endpoints that geocode and route but fail the gate (ratio out of band) WHEN Lever 3 completes re-routing and gate fails THEN route is queued for REVIEW with failure reason (not sent to next lever)",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-failure-to-review.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Lever 3 + REVIEW queue)",
        "negative_control": {
          "would_fail_if": [
            "REVIEW queue is not updated",
            "failure reason is not recorded",
            "route is sent to next lever instead"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever3-failure-to-review-queue",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route where re-routing fails gate",
                "Run Lever 3",
                "Verify REVIEW queue entry exists"
              ]
            },
            "end_state": {
              "must_observe": [
                "reviewQueue.length == 1 AND reviewQueue[0].failedCondition != null"
              ],
              "must_not_observe": [
                "route queued for next lever",
                "geometry stored with verdict='pass'"
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
      "description": "GIVEN route names matching 'from X to Y' or 'Route N — County' or 'A — B' patterns WHEN Lever 3 parser runs deterministic regex extraction THEN endpoints are extracted without LLM calls (zero cost)",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-parser-deterministic.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real deterministic parser, no LLM)",
        "negative_control": {
          "would_fail_if": [
            "LLM is called for parsing",
            "parser is a stub returning fixed endpoints",
            "regex patterns are not matched"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever3-parser-from-to",
            "action": {
              "actor": "api_client",
              "steps": [
                "Parse 'from San Francisco to Santa Cruz'",
                "Verify extracted endpoints are ['San Francisco', 'Santa Cruz']"
              ]
            },
            "end_state": {
              "must_observe": [
                "endpoints.length == 2",
                "endpoints[0] == 'San Francisco'",
                "endpoints[1] == 'Santa Cruz'"
              ],
              "must_not_observe": [
                "endpoints.length != 2",
                "LLM call made"
              ]
            }
          },
          {
            "start_ref": "lever3-parser-highway",
            "action": {
              "actor": "api_client",
              "steps": [
                "Parse 'Route 680 — Alameda County'",
                "Verify highway number '680' and county 'Alameda' extracted"
              ]
            },
            "end_state": {
              "must_observe": [
                "highwayNumber == '680'",
                "region == 'Alameda County'"
              ],
              "must_not_observe": [
                "LLM call made",
                "extraction failed"
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
      "description": "GIVEN a route with centroid (34.95, -120.42) and endpoint 'Santa Maria' WHEN Lever 3 geocodes the endpoint with region bias THEN geocode API call includes bounds parameter centered on centroid",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-geocode-bias.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Google Geocoding API with bounds)",
        "negative_control": {
          "would_fail_if": [
            "Geocoding is called without bounds",
            "bounds are hardcoded",
            "geocoding is mocked"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "lever3-geocode-with-bias",
            "action": {
              "actor": "api_client",
              "steps": [
                "Geocode 'Santa Maria' with centroid (34.95, -120.42)",
                "Capture Google API request URL",
                "Verify bounds parameter matches centroid ±1.2°"
              ]
            },
            "end_state": {
              "must_observe": [
                "geocodeUrl contains 'bounds=' (region-biased to centroid)",
                "bounds centered on (34.95, -120.42)"
              ],
              "must_not_observe": [
                "no bounds parameter",
                "bounds not matching centroid"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Lever 1 promotes gate-passing in-row polylines with provenance scraped_promoted",
      "verify": "pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts --grep 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Lever 1 rejects gate-failing in-row polylines",
      "verify": "pnpm test convex/__tests__/S4T2-lever1-promote.integration.test.ts --grep 'TC-2'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Lever 1 routes failures to next lever not REVIEW",
      "verify": "pnpm test convex/__tests__/S4T2-lever1-failure-routing.integration.test.ts --grep 'TC-3'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Lever 3 parses A-to-B structures deterministically",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts --grep 'TC-4'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Lever 3 parses road-name structures deterministically",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-reroute.integration.test.ts --grep 'TC-5'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Lever 3 routes failures to REVIEW queue",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-failure-to-review.integration.test.ts --grep 'TC-6'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Lever 3 parser does not call LLM",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-parser-deterministic.integration.test.ts --grep 'TC-7'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Lever 3 geocoding includes region bias",
      "verify": "pnpm test convex/__tests__/S4T2-lever3-geocode-bias.integration.test.ts --grep 'TC-8'",
      "maps_to_ac": "AC-6"
    }
  ]
}
-->
</details>
