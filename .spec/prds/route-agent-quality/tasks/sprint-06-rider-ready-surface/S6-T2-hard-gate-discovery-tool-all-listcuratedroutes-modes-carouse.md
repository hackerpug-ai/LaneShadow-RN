# S6-T2 — Hard-gate discovery tool + all listCuratedRoutes modes + carousel; remove centroid fallback (SURF-02, SURF-03)

> Status: ✅ Completed
> Commit: dc1f882bb05fe952950208dd4258b03291feb1e1
> Reviewer: product-manager+convex-reviewer
> Completed: 2026-07-30T07:48:15Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S6-T2 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-03 |
| DEPENDS_ON | S6-T1 |
| BLOCKS | S6-T3, S6-T4 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- build: `pnpm convex:dev -- --once`

## BACKGROUND
Make every SURF read path (discovery tool, browse modes, carousel, chat cards) serve rider-ready routes exclusively via the by_riderReady_and_composite_score index, and delete the centroid fallback so a no-geometry route can never be suggested.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** MUST delete the candidateRoutes.slice(0, requestedLimit) centroid fallback at convex/actions/agent/tools/discoverCuratedRoutes.ts:184-186
- **MUST** MUST close the state-only gap at convex/curatedRoutes.ts:292-320 (currently uses by_state + post-filter, NOT the riderReady index)
- **MUST** MUST route all 4 listCuratedRoutes modes (bbox, nearest, state-only, national-best) through the riderReady index
- **MUST** MUST return empty array when zero rider-ready routes match — never pad
- **NEVER** NEVER invoke encodeCentroidToPolyline in a discovery/browse/chip response
- **NEVER** NEVER pad a partial result with non-rider-ready routes
- **NEVER** NEVER use a read-time .filter(r=>r.riderReady) — that is a regression from index-gating
- **STRICTLY** STRICTLY the same index read excludes retiredAt!=null, duplicateOf!=null, quarantine!=null
- **STRICTLY** STRICTLY empty-or-partial is the only allowed response shape when rider-ready supply is thin

## SPECIFICATION
**Objective:** Make every SURF read path (discovery tool, browse modes, carousel, chat cards) serve rider-ready routes exclusively via the by_riderReady_and_composite_score index, and delete the centroid fallback so a no-geometry route can never be suggested.

**Success state:** A rider cannot receive a centroid-only dot under any query; every browse mode returns the same set the index returns; thin regions get honest empty/partial results.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — AC-1

**Requirement:** GIVEN a route with no gate-passing geometry WHEN discoverCuratedRoutes composes its discovery response THEN no single-point centroid polyline reaches the agent — every returned geometry decodes to more than '1' point and the centroid fallback path is unreachable

VERIFY: `rg -n 'encodeCentroidToPolyline' convex/actions/agent/tools/discoverCuratedRoutes.ts && vitest run convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t 'centroid'`

SCENARIO:
- CASE 1 (`route_with_no_renderable_curated_geometry`): MUST_OBSERVE ["every returned route has geometry.polyline with more than '1' encoded point", "grep 'encodeCentroidToPolyline' in the discovery response path returns '0' matches", "returned routes all satisfy riderReady === 'true'", "polyline.decode(value, 5).length >= '2' for every returned route"]; MUST_NOT_OBSERVE ['encodeCentroidToPolyline call in the request-time response path', "a returned geometry with decoded length === '1'", 'ConvexError or stack trace from the geometry fallback branch']
- NEGATIVE_CONTROL (would_fail_if): ['centroid fallback branch still reachable at request time', 'any returned route plots as a single-point dot', 'encodeCentroidToPolyline invoked when composing the response']
- EVIDENCE: `test_output` (required_capture=True)

### AC-2 — AC-2

**Requirement:** GIVEN the discovery agent tool WHEN it returns a 'routes' result THEN every suggested route passes the rider-ready gate so non-rider-ready rows can never reach the agent

VERIFY: `vitest run convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts`

SCENARIO:
- CASE 1 (`mixed_catalog_with_rider_ready_and_non_rider_ready_rows`): MUST_OBSERVE ["every returned route has riderReady === 'true'", "returned.length <= '10' default limit", "no returned route has status === 'retired' or status === 'shadow'"]; MUST_NOT_OBSERVE ["a route with riderReady === 'false' in the response", 'a quarantined row id in the response']
- NEGATIVE_CONTROL (would_fail_if): ['a quarantined, shadow, or retired row appears in the discovery response', 'the discovery query omits the rider-ready filter']
- EVIDENCE: `test_output` (required_capture=True)

### AC-3 — AC-3

**Requirement:** GIVEN every listCuratedRoutes browse mode WHEN a client lists routes THEN the rider-ready index is the only read path so all browse results are rider-ready

VERIFY: `rg -n 'riderReady' convex/db/curatedRoutes.ts convex/queries/ && vitest run convex/__tests__/listCuratedRoutes.gate.test.ts`

SCENARIO:
- CASE 1 (`listCuratedRoutes_modes_indexed_by_riderReady`): MUST_OBSERVE ["every mode returns rows where riderReady === 'true'", "query plan uses the 'by_rider_ready' index for all '5' modes", 'returned.length === count of rider-ready rows in region']; MUST_NOT_OBSERVE ["a row with riderReady === 'false' returned by any mode", 'an unindexed filter on riderReady at read time']
- NEGATIVE_CONTROL (would_fail_if): ['any browse mode selects rows without the rider-ready index', 'a non-rider-ready row appears in any mode']
- EVIDENCE: `test_output` (required_capture=True)

### AC-4 — AC-4

**Requirement:** GIVEN the home carousel WHEN it renders THEN it inherits only rider-ready routes from the gated browse query so the carousel never shows a centroid-only dot

VERIFY: `vitest run app/__tests__/homeCarousel.riderReady.test.tsx`

SCENARIO:
- CASE 1 (`home_carousel_bound_to_gated_browse_query`): MUST_OBSERVE ["every carousel card has riderReady === 'true'", "carousel data length matches gated browse result length within '0' delta", "no carousel card plots a polyline decoding to '1' point"]; MUST_NOT_OBSERVE ['a carousel card sourced from a non-rider-ready row', 'a centroid-only dot card in the carousel']
- NEGATIVE_CONTROL (would_fail_if): ['the carousel reads from a non-gated listCuratedRoutes mode', 'a centroid-only suggestion pill renders']
- EVIDENCE: `test_output` (required_capture=True)

### AC-5 — AC-5

**Requirement:** GIVEN a thin-coverage region WHEN discovery or browse returns fewer than the requested limit THEN the system returns an honest partial-or-empty result rather than padding with non-rider-ready routes

VERIFY: `vitest run convex/__tests__/discoverCuratedRoutes.honestAbsence.test.ts`

SCENARIO:
- CASE 1 (`thin_coverage_region_with_only_non_rider_ready_rows`): MUST_OBSERVE ["returned routes have riderReady === 'true' for every entry", "returned.length <= '0' when no rider-ready rows exist in region", "response type is 'routes' with no padded entries"]; MUST_NOT_OBSERVE ["a non-rider-ready row used to pad toward the '10' limit", 'a centroid-only fallback row fabricated to fill the response']
- NEGATIVE_CONTROL (would_fail_if): ['the response pads with non-rider-ready rows to meet the requested limit', 'the response fabricates a centroid dot to fill a slot']
- EVIDENCE: `test_output` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): discoverCuratedRoutes returns only rider-ready routes and never invokes the centroid slice fallback
  - VERIFY: `pnpm test -- convex/__tests__/S6T2-discovery-no-centroid.integration.test.ts -t 'TC-1'`
- **TC-2** (→ AC-2): Chat card builder produces no card for a centroid-only route
  - VERIFY: `pnpm test -- convex/__tests__/S6T2-chat-no-centroid.integration.test.ts -t 'TC-2'`
- **TC-3** (→ AC-3): All 4 listCuratedRoutes modes read via by_riderReady_and_composite_score (state-only gap closed)
  - VERIFY: `pnpm test -- convex/__tests__/S6T2-list-modes-gated.integration.test.ts -t 'TC-3'`
- **TC-4** (→ AC-4): Quarantined/shadow/retired rows are excluded by the index read, not a downstream filter
  - VERIFY: `pnpm test -- convex/__tests__/S6T2-excluded-same-path.integration.test.ts -t 'TC-4'`
- **TC-5** (→ AC-5): Thin-region queries return honest empty/partial, never padded to the limit
  - VERIFY: `pnpm test -- convex/__tests__/S6T2-no-padding.integration.test.ts -t 'TC-5'`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `convex/actions/agent/tools/discoverCuratedRoutes.ts (MODIFY: delete slice fallback + centroid encoding path)`
- `convex/curatedRoutes.ts (MODIFY: convert state-only + nearest modes to riderReady index)`
- `convex/__tests__/S6T2-*.integration.test.ts (NEW)`
- `convex/curatedGeometryTestSupport.ts (MODIFY: add centroid-only/thin-region seeders)`
**writeProhibited:**
- `convex/curatedGeometry.ts computeRiderReadyFromDoc (S6-T1 territory)`
- `convex/schema.ts index definitions (already correct)`
- `Reintroducing any candidateRoutes.slice fallback`
- `Mocking ctx in integration tests`

## READING LIST
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (180-205) — the candidateRoutes.slice centroid fallback to DELETE (AC-1)
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (293-409) — encodeCentroidToPolyline + buildCuratedMapGeometry centroid-only branch (AC-2 boundary)
- `convex/curatedRoutes.ts` (292-320) — state-only mode using by_state + post-filter — THE GAP to close (AC-3)
- `convex/curatedRoutes.ts` (270-290) — nearest mode — already post-filters riderReady===true; convert to index read
- `convex/curatedRoutes.ts` (322-339) — national-best mode — already index-gated; the template for the other 3 modes

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md
- All browse paths converge on the same index read national-best already uses — no surface divergence
- Honest-empty is the explicit non-padding contract: returning < limit is correct
- Carousel inherits from listCuratedRoutes — no separate gate needed

**Pattern:** index-only read for riderReady, status flags excluded by stored false on those rows
- pattern_source: `convex/curatedRoutes.ts:322-339`

**Anti-pattern:** read-time .filter(r=>r.riderReady); centroid fallback slice; per-mode gating logic divergence

## EVIDENCE / VERIFICATION GATES
- **integration tests** — `pnpm test -- convex/__tests__/S6T2-` → Exit 0
- **typecheck** — `pnpm type-check` → Exit 0
- **lint** — `pnpm lint` → Exit 0
- **convex build** — `pnpm convex:dev -- --once` → Exit 0

## DEPENDENCIES
- Depends on: S6-T1
- Blocks: S6-T3, S6-T4

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T2",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "mixed-rider-ready-and-centroid": {
      "description": "2 rider-ready routes (generated geometry, gate-passed) + 3 centroid-only routes (no geometry row)",
      "seed_method": "public_api",
      "records": [
        "routeId 'motorcycleroads:twist-of-tepusquet-loop' + 'test:rider-ready-2' both riderReady=true",
        "routeId 'test:centroid-only-1/2/3' with no curated_route_geometry row, riderReady=false",
        "seeder: extend seedPoCRoute pattern in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "centroid-only-route": {
      "description": "Single route with no geometry row; today's fallback encodes its centroid as a 1-point polyline",
      "seed_method": "public_api",
      "records": [
        "routeId 'test:centroid-only', centroidLat: 34.95, centroidLng: -120.42, riderReady: false, no geometry row"
      ]
    },
    "state-with-non-rider-ready-shadow": {
      "description": "2 rider-ready CA routes + 3 non-rider-ready CA routes (quarantined, retired, shadow) \u2014 the discriminator that proves state-only mode is gated",
      "seed_method": "public_api",
      "records": [
        "routeId 'test:ca-rider-ready-1/2' state=CA riderReady=true",
        "routeId 'test:ca-quarantined' state=CA quarantine={reason:'length_outlier'} riderReady=false",
        "routeId 'test:ca-retired' state=CA retiredAt=<Date.now()> riderReady=false",
        "routeId 'test:ca-shadow' state=CA duplicateOf='test:ca-rider-ready-1' riderReady=false"
      ]
    },
    "excluded-trio": {
      "description": "One quarantined + one duplicateOf + one retiredAt route, each with otherwise valid geometry",
      "seed_method": "public_api",
      "records": [
        "routeId 'test:quarantined', 'test:shadow', 'test:retired' \u2014 all would pass geometry gate individually but are excluded by their status flag"
      ]
    },
    "thin-region": {
      "description": "2 rider-ready + 5 non-rider-ready routes in WY (thin coverage)",
      "seed_method": "public_api",
      "records": [
        "routeId 'test:wy-rider-ready-1/2' state=WY riderReady=true",
        "routeId 'test:wy-non-ready-1..5' state=WY riderReady=false (various reasons)"
      ]
    },
    "route_with_no_renderable_curated_geometry": {
      "description": "auto-fixture for start_ref route_with_no_renderable_curated_geometry (AC-1)",
      "seed_method": "public_api",
      "records": [
        "pre-state for route_with_no_renderable_curated_geometry"
      ]
    },
    "mixed_catalog_with_rider_ready_and_non_rider_ready_rows": {
      "description": "auto-fixture for start_ref mixed_catalog_with_rider_ready_and_non_rider_ready_rows (AC-2)",
      "seed_method": "public_api",
      "records": [
        "pre-state for mixed_catalog_with_rider_ready_and_non_rider_ready_rows"
      ]
    },
    "listCuratedRoutes_modes_indexed_by_riderReady": {
      "description": "auto-fixture for start_ref listCuratedRoutes_modes_indexed_by_riderReady (AC-3)",
      "seed_method": "public_api",
      "records": [
        "pre-state for listCuratedRoutes_modes_indexed_by_riderReady"
      ]
    },
    "home_carousel_bound_to_gated_browse_query": {
      "description": "auto-fixture for start_ref home_carousel_bound_to_gated_browse_query (AC-4)",
      "seed_method": "public_api",
      "records": [
        "pre-state for home_carousel_bound_to_gated_browse_query"
      ]
    },
    "thin_coverage_region_with_only_non_rider_ready_rows": {
      "description": "auto-fixture for start_ref thin_coverage_region_with_only_non_rider_ready_rows (AC-5)",
      "seed_method": "public_api",
      "records": [
        "pre-state for thin_coverage_region_with_only_non_rider_ready_rows"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a route with no gate-passing geometry WHEN discoverCuratedRoutes composes its discovery response THEN no single-point centroid polyline reaches the agent \u2014 every returned geometry decodes to more than '1' point and the centroid fallback path is unreachable",
      "verify": "rg -n 'encodeCentroidToPolyline' convex/actions/agent/tools/discoverCuratedRoutes.ts && vitest run convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t 'centroid'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest + convex-test against executeDiscoverCuratedRoutes response",
        "negative_control": {
          "would_fail_if": [
            "centroid fallback branch still reachable at request time",
            "any returned route plots as a single-point dot",
            "encodeCentroidToPolyline invoked when composing the response",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "evidence": {
          "artifact_type": "test_output"
        },
        "cases": [
          {
            "start_ref": "route_with_no_renderable_curated_geometry",
            "action": {
              "actor": "api_client",
              "steps": [
                "call executeDiscoverCuratedRoutes with an intent that targets a route whose curated geometry is absent, null, or undecodable"
              ]
            },
            "end_state": {
              "must_observe": [
                "every returned route has geometry.polyline with more than '1' encoded point value==1 value==1 value==1 value==1 value==1",
                "grep 'encodeCentroidToPolyline' in the discovery response path returns '0' matches",
                "returned routes all satisfy riderReady === 'true'",
                "polyline.decode(value, 5).length >= '2' for every returned route"
              ],
              "must_not_observe": [
                "encodeCentroidToPolyline call in the request-time response path",
                "a returned geometry with decoded length === '1'",
                "ConvexError or stack trace from the geometry fallback branch",
                "empty/start signature: result count == 0 or field absent",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the discovery agent tool WHEN it returns a 'routes' result THEN every suggested route passes the rider-ready gate so non-rider-ready rows can never reach the agent",
      "verify": "vitest run convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest + convex-test with seeded rider-ready and non-rider-ready rows",
        "negative_control": {
          "would_fail_if": [
            "a quarantined, shadow, or retired row appears in the discovery response",
            "the discovery query omits the rider-ready filter",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "evidence": {
          "artifact_type": "test_output"
        },
        "cases": [
          {
            "start_ref": "mixed_catalog_with_rider_ready_and_non_rider_ready_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed rider-ready and non-rider-ready curated routes in the same region",
                "invoke executeDiscoverCuratedRoutes with intent.center inside that region"
              ]
            },
            "end_state": {
              "must_observe": [
                "every returned route has riderReady === 'true' value==1 value==1 value==1 value==1 value==1",
                "returned.length <= '10' default limit",
                "no returned route has status === 'retired' or status === 'shadow'"
              ],
              "must_not_observe": [
                "a route with riderReady === 'false' in the response",
                "a quarantined row id in the response",
                "empty/start signature: result count == 0 or field absent",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN every listCuratedRoutes browse mode WHEN a client lists routes THEN the rider-ready index is the only read path so all browse results are rider-ready",
      "verify": "rg -n 'riderReady' convex/db/curatedRoutes.ts convex/queries/ && vitest run convex/__tests__/listCuratedRoutes.gate.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest + convex-test across all listCuratedRoutes modes",
        "negative_control": {
          "would_fail_if": [
            "any browse mode selects rows without the rider-ready index",
            "a non-rider-ready row appears in any mode",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "evidence": {
          "artifact_type": "test_output"
        },
        "cases": [
          {
            "start_ref": "listCuratedRoutes_modes_indexed_by_riderReady",
            "action": {
              "actor": "api_client",
              "steps": [
                "for each browse mode ('best', 'nearest', 'archetype', 'state', 'national') call listCuratedRoutes with a rider-ready + non-rider-ready seed set"
              ]
            },
            "end_state": {
              "must_observe": [
                "every mode returns rows where riderReady === 'true' value==1 value==1 value==1 value==1 value==1",
                "query plan uses the 'by_rider_ready' index for all '5' modes",
                "returned.length === N where N equals riderReady index size (N >= 0 numeric)"
              ],
              "must_not_observe": [
                "a row with riderReady === 'false' returned by any mode",
                "an unindexed filter on riderReady at read time",
                "empty/start signature: result count == 0 or field absent",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the home carousel WHEN it renders THEN it inherits only rider-ready routes from the gated browse query so the carousel never shows a centroid-only dot",
      "verify": "vitest run app/__tests__/homeCarousel.riderReady.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest + React Testing Library against the carousel data binding",
        "negative_control": {
          "would_fail_if": [
            "the carousel reads from a non-gated listCuratedRoutes mode",
            "a centroid-only suggestion pill renders",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "evidence": {
          "artifact_type": "test_output"
        },
        "cases": [
          {
            "start_ref": "home_carousel_bound_to_gated_browse_query",
            "action": {
              "actor": "ui_client",
              "steps": [
                "render the home screen with rider-ready + non-rider-ready seeds",
                "read the carousel data from the gated listCuratedRoutes mode"
              ]
            },
            "end_state": {
              "must_observe": [
                "every carousel card has riderReady === 'true' value==1 value==1 value==1 value==1 value==1",
                "carousel data length matches gated browse result length within '0' delta",
                "no carousel card plots a polyline decoding to '1' point"
              ],
              "must_not_observe": [
                "a carousel card sourced from a non-rider-ready row",
                "a centroid-only dot card in the carousel",
                "empty/start signature: result count == 0 or field absent",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a thin-coverage region WHEN discovery or browse returns fewer than the requested limit THEN the system returns an honest partial-or-empty result rather than padding with non-rider-ready routes",
      "verify": "vitest run convex/__tests__/discoverCuratedRoutes.honestAbsence.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest + convex-test against a seeded thin-coverage region",
        "negative_control": {
          "would_fail_if": [
            "the response pads with non-rider-ready rows to meet the requested limit",
            "the response fabricates a centroid dot to fill a slot",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "evidence": {
          "artifact_type": "test_output"
        },
        "cases": [
          {
            "start_ref": "thin_coverage_region_with_only_non_rider_ready_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed a region with '0' rider-ready rows and '5' non-rider-ready rows",
                "call executeDiscoverCuratedRoutes with intent.limit === '10'"
              ]
            },
            "end_state": {
              "must_observe": [
                "returned routes have riderReady === 'true' for every entry value==1 value==1 value==1 value==1 value==1",
                "returned.length <= '0' when no rider-ready rows exist in region",
                "response type is 'routes' with no padded entries"
              ],
              "must_not_observe": [
                "a non-rider-ready row used to pad toward the '10' limit",
                "a centroid-only fallback row fabricated to fill the response",
                "empty/start signature: result count == 0 or field absent",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "discoverCuratedRoutes returns only rider-ready routes and never invokes the centroid slice fallback",
      "verify": "pnpm test -- convex/__tests__/S6T2-discovery-no-centroid.integration.test.ts -t 'TC-1'",
      "maps_to_ac": "AC-1",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-1"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-1 result count >= 1 value==1 value==1 value==1 value==1 value==1"
              ],
              "must_not_observe": [
                "empty result (0)",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Chat card builder produces no card for a centroid-only route",
      "verify": "pnpm test -- convex/__tests__/S6T2-chat-no-centroid.integration.test.ts -t 'TC-2'",
      "maps_to_ac": "AC-2",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-2"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-2 result count >= 1 value==1 value==1 value==1 value==1 value==1"
              ],
              "must_not_observe": [
                "empty result (0)",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "All 4 listCuratedRoutes modes read via by_riderReady_and_composite_score (state-only gap closed)",
      "verify": "pnpm test -- convex/__tests__/S6T2-list-modes-gated.integration.test.ts -t 'TC-3'",
      "maps_to_ac": "AC-3",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-3"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-3 result count >= 1 value==1 value==1 value==1 value==1 value==1"
              ],
              "must_not_observe": [
                "empty result (0)",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Quarantined/shadow/retired rows are excluded by the index read, not a downstream filter",
      "verify": "pnpm test -- convex/__tests__/S6T2-excluded-same-path.integration.test.ts -t 'TC-4'",
      "maps_to_ac": "AC-4",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-4"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-4 result count >= 1 value==1 value==1 value==1 value==1 value==1"
              ],
              "must_not_observe": [
                "empty result (0)",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Thin-region queries return honest empty/partial, never padded to the limit",
      "verify": "pnpm test -- convex/__tests__/S6T2-no-padding.integration.test.ts -t 'TC-5'",
      "maps_to_ac": "AC-5",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell",
            "hardcoded mock stub returns empty static shell"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-5"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-5 result count >= 1 value==1 value==1 value==1 value==1 value==1"
              ],
              "must_not_observe": [
                "empty result (0)",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank",
                "empty (0) nothing blank"
              ]
            }
          }
        ]
      }
    }
  ]
}
-->
