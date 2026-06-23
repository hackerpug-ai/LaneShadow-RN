# DISC-002: Verify + harden useCuratedDiscovery against all five UC-DISC-04 ACs (row shape, center derivation, nearest/best, UI-enum archetypes, 0–1 scores, loading≠empty)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** To Do · **Priority:** P1 · **Effort:** S · **Estimate:** 60 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** react-native-ui-implementer owns RN hooks consumed by the plan-view UI and the @testing-library/react-native + live-Convex integration harness; this is a client-side data-shape verification task, not a Convex backend change.  

## Outcome

useCuratedDiscovery returns live curated rows in the exact {id,name,lat,lng,archetype(UI enum),score(0-1),distanceMi} shape, with correct loading≠empty signals, location-derived center, nearest/best ordering, and unrescaled 0-1 scores, proven against live Convex.

## Specification

hooks/use-curated-discovery.ts already wraps useQuery(api.curatedRoutes.listCuratedRoutes, params) and maps the flat Convex return (routeId, name, centroidLat, centroidLng, primaryArchetype, compositeScore, distanceMi) to the discovery-row shape {id,name,lat,lng,archetype,score,distanceMi}. This task adds the missing integration test coverage that proves all five UC-DISC-04 ACs against live Convex dev and hardens any gaps found. Verify: (1) the mapper preserves the UI-enum archetype produced by listCuratedRoutes' dbArchetypeToUi (curatedRoutes.ts:124) and never lets a raw DB value (mountain/desert/scenic_byway/coastal) through as `archetype`; (2) `derivedCenter` falls back to useCurrentLocation {lat,lng} when params.center absent (lines 44-45); (3) the queryArgs sort logic (line 54) sends sort:'nearest' with center only when located and degrades to 'best' otherwise; (4) `score` is `route.compositeScore` unmodified (line 70) — assert a representative non-trivial value such as 0.82 survives without becoming 82; (5) routes===undefined ↔ isLoading and routes===[] ↔ isEmpty (lines 76-80). Mount the hook in a renderHook harness wired to a real ConvexReactClient pointed at the live Convex dev deployment holding the 5,654-row catalog (mirror hooks/__tests__/use-chat-planning.integration.test.ts for the live-Convex provider pattern). Where the hook needs hardening, prefer minimal in-place fixes (e.g. an explicit UI-enum type guard on the mapped archetype) over signature changes. This maps to T-DISC-004 (10-e2e-testing-criteria.md).

## Critical Constraints

- NEVER rescale compositeScore to 0-100 in the hook — scores MUST pass through on the raw 0-1 scale (formatting is a render concern). A 0-100 escape is a hard fail.
- NEVER conflate loading and empty: routes===undefined ⇒ isLoading true; routes===[] ⇒ isEmpty true. They must be distinguishable by the caller.
- NEVER widen scope to the suggestion-card UI (that is DISC-016/017) or to the agent tool (DATA-008/008b) — this task owns the hook only.
- This is a carried/BUILT hook: verify-and-harden, do NOT rewrite its public signature {center?,bbox?,state?,archetypes?,sort,limit} → {routes,isLoading,isEmpty} (downstream callers depend on it).

## Acceptance Criteria

### AC-1: Returns consumed row shape from live Convex
*(PRIMARY)*
- **flow_ref:** `HF-DISC-04-CORE` · `.spec/scenarios/UC-DISC-04/core-hook-returns-rows.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** a real ConvexReactClient pointed at live Convex dev with the seeded 5,654-route catalog and a center near a known riding region
- **WHEN** useCuratedDiscovery({ center, sort:'nearest', limit:5 }) resolves
- **THEN** routes is a non-empty array whose first row has id,name,lat,lng,archetype(UI enum),score,distanceMi all populated
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test hooks/use-curated-discovery.integration.test.ts` → `returnsConsumedRowShapeAgainstLiveConvex`
- **Scenario** (start `live_catalog_near_asheville`):
  - must observe: routes.length >= 1; a real road name string (non-empty, e.g. a catalog name like 'Blue Ridge Parkway'); typeof routes[0].id === 'string' && routes[0].id.length > 0; typeof routes[0].name === 'string' && routes[0].name.length > 0; typeof routes[0].lat === 'number' && typeof routes[0].lng === 'number'; typeof routes[0].score === 'number'; Object.keys(routes[0]) includes all of id,name,lat,lng,archetype,score,distanceMi (7 keys present)
  - must NOT observe: routes === undefined after resolve; routes === [] (empty array); routes.length === 0; routes[0].id === undefined (any of the 7 keys missing/undefined); archetype value 'mountain' | 'desert' | 'scenic_byway' | 'coastal' (raw DB enum)
  - negative control (would fail if): would fail if listCuratedRoutes is disconnected (query never resolves); would fail if useCuratedDiscovery is mocked/stubbed to return [] (empty); would fail if the mapper drops fields so first row keys are undefined

### AC-2: Loading and empty are distinct signals
- **GIVEN** the hook before the query resolves, and a query that resolves to []
- **WHEN** the consumer reads isLoading and isEmpty
- **THEN** isLoading is true while routes===undefined and false once resolved; isEmpty is true only when routes===[]
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test hooks/use-curated-discovery.integration.test.ts` → `loadingIsDistinctFromEmpty`
- **Scenario** (start `live_catalog_empty_bbox`):
  - must observe: before resolve: isLoading===true AND isEmpty===false; after resolve: isLoading===false AND isEmpty===true AND routes.length===0
  - must NOT observe: isEmpty===true while routes===undefined; isLoading stuck true after resolve
  - negative control (would fail if): isEmpty true while still loading (undefined treated as empty); isLoading never flips false

### AC-3: Center derived from useCurrentLocation
- **GIVEN** useCurrentLocation returning a real {lat,lng} and no explicit center passed
- **WHEN** useCuratedDiscovery({ sort:'nearest', limit:5 }) builds its query args
- **THEN** the query center equals the current-location coordinates and distanceMi is populated on returned rows
- **Test tier:** `integration` · **Service:** live Convex dev + useCurrentLocation (expo-location)
- **Verify:** `pnpm test hooks/use-curated-discovery.integration.test.ts` → `derivesCenterFromCurrentLocation`
- **Scenario** (start `current_location_present`):
  - must observe: routes.length >= 1; every returned row has a numeric distanceMi >= 0 (e.g. 12.4); routes.every(r => typeof r.distanceMi === 'number')
  - must NOT observe: routes === undefined after resolve; routes === [] (empty array); routes.length === 0; distanceMi === undefined on every row
  - negative control (would fail if): would fail if center derivation is removed so the query goes out with no center; would fail if useCurrentLocation is stubbed to return null and the hook still hardcodes/omits distanceMi

### AC-4: Nearest-first when located, best-first fallback
- **GIVEN** a located query (sort:'nearest' + center) and an unlocated query (sort:'nearest', no center)
- **WHEN** both resolve against live Convex
- **THEN** the located result is ascending by distanceMi; the unlocated result degrades to best-first (descending compositeScore)
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test hooks/use-curated-discovery.integration.test.ts` → `ordersNearestThenBestFallback`
- **Scenario** (start `live_catalog_near_asheville`):
  - must observe: located: distanceMi non-decreasing across rows (e.g. 3.1, 7.8, 12.4); unlocated: compositeScore non-increasing across rows (e.g. 0.91, 0.84, 0.77)
  - must NOT observe: located result ordered by score not distance; empty result for either query
  - negative control (would fail if): sort arg hardcoded; nearest order not ascending by distance; fallback not best-first

### AC-5: compositeScore carried at 0-1, never rescaled
- **GIVEN** live curated rows whose compositeScore is a 0-1 float
- **WHEN** useCuratedDiscovery maps them to discovery rows
- **THEN** each row.score equals the source compositeScore on the 0-1 scale (0 <= score <= 1), never multiplied to 0-100
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test hooks/use-curated-discovery.integration.test.ts` → `carriesScoreOnRawZeroToOneScale`
- **Scenario** (start `live_catalog_near_asheville`):
  - must observe: at least one row.score strictly between 0 and 1 (e.g. 0.82); max(routes.map(r => r.score)) <= 1
  - must NOT observe: any row.score > 1 (e.g. 82); all row.score === 0 (every score degenerate); routes === [] (empty array)
  - negative control (would fail if): would fail if the mapper rescales score by *100 (raw 0.82 becomes a static 82 on the 0-100 scale); would fail if the mapper hardcodes score to 0 / returns 0 for a non-zero source compositeScore; would fail if listCuratedRoutes is stubbed/disconnected so no real 0-1 score flows through

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration test asserts first row exposes id,name,lat,lng,archetype(UI enum),score,distanceMi against live Convex. | AC-1 | `pnpm test hooks/use-curated-discovery.integration.test.ts -t returnsConsumedRowShapeAgainstLiveConvex` |
| TC-2 | Test asserts isLoading↔undefined and isEmpty↔[] are never both-true and never conflated. | AC-2 | `pnpm test hooks/use-curated-discovery.integration.test.ts -t loadingIsDistinctFromEmpty` |
| TC-3 | Test asserts query center derives from useCurrentLocation and distanceMi populates. | AC-3 | `pnpm test hooks/use-curated-discovery.integration.test.ts -t derivesCenterFromCurrentLocation` |
| TC-4 | Test asserts nearest-ascending order when located and best-descending fallback when not. | AC-4 | `pnpm test hooks/use-curated-discovery.integration.test.ts -t ordersNearestThenBestFallback` |
| TC-5 | Test asserts every row.score in [0,1] with at least one non-degenerate fraction. | AC-5 | `pnpm test hooks/use-curated-discovery.integration.test.ts -t carriesScoreOnRawZeroToOneScale` |

## Reading List

- `hooks/use-curated-discovery.ts` (39-81) — PRIMARY PATTERN — the hook under verification: derivedCenter (44-45), queryArgs sort logic (47-58), mapper (62-74), loading/empty (76-80)
- `hooks/__tests__/use-chat-planning.integration.test.ts` (1-80) — live-Convex ConvexReactClient provider + renderHook integration pattern to mirror
- `convex/curatedRoutes.ts` (36-134) — returnValidator + buildRouteCard — the flat return shape (compositeScore, primaryArchetype via dbArchetypeToUi, distanceMi) the mapper consumes
- `.spec/prds/mvp/05-uc-disc.md` (46-60) — UC-DISC-04 ACs the five integration ACs map to
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (73-77) — T-DISC-004 pass/fail — the verification bar (shape, loading/empty, center, nearest/best, 0-1 no rescale)

## Guardrails

- ONE hook, state-driven — no per-variant hook files.
- All UI colors elsewhere via useSemanticTheme(); this hook holds no styling.
- No new runtime dependency (expo-location + convex/react already present).

## Design

- ref: 07-ui-infrastructure.md §3 (hook architecture — useCuratedDiscovery contract)
- ref: 10-design-system.md §4 (archetype UI↔DB enum table — UI enum the mapper must emit)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test hooks/use-curated-discovery.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check hooks/use-curated-discovery.ts hooks/use-curated-discovery.integration.test.ts` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-empty: PRIMARY test must fail when listCuratedRoutes is pointed at an empty deployment before passing against the seeded catalog` |

## Coding Standards

- Named exports; no unnecessary useMemo/useCallback beyond existing.
- TypeScript strict — no `any` on the mapped archetype; narrow to DiscoveryArchetype.
- Integration test hits real Convex dev — no mocked useQuery (project iron rule: no mocks for the verification service).

## Dependencies

- Depends on: DATA-005 (listCuratedRoutes query), DATA-002 (archetype map applied in read path)
- Blocks: DISC-016 (suggestion-card tap), DISC-017 (suggestion slot content)
- Parallel: DISC-019, DISC-021

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "live_catalog_near_asheville": {
      "description": "live Convex dev with the seeded 5,654-route curated catalog; query center at Asheville NC {lat:35.5951,lng:-82.5515}",
      "seed_method": "migration_fixture",
      "records": [
        "5,654 curated_routes rows seeded into geospatial index",
        "multiple routes within ~50mi of Asheville with 0-1 compositeScore"
      ]
    },
    "live_catalog_empty_bbox": {
      "description": "live Convex dev queried with a bbox over open ocean that matches zero centroids",
      "seed_method": "migration_fixture",
      "records": [
        "bbox {north:0.1,south:-0.1,east:-30,west:-30.2} \u2192 0 matching centroids"
      ]
    },
    "current_location_present": {
      "description": "useCurrentLocation resolves to a real fixed coordinate",
      "seed_method": "public_api",
      "records": [
        "{lat:35.5951,lng:-82.5515}"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN a real ConvexReactClient pointed at live Convex dev with the seeded 5,654-route catalog and a center near a known riding region WHEN useCuratedDiscovery({ center, sort:'nearest', limit:5 }) resolves THEN routes is a non-empty array whose first row has id,name,lat,lng,archetype(UI enum),score,distanceMi all populated",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts` \u2192 `returnsConsumedRowShapeAgainstLiveConvex",
      "scenario": {
        "start_ref": "live_catalog_near_asheville",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev (api.curatedRoutes.listCuratedRoutes)",
        "negative_control": {
          "would_fail_if": [
            "would fail if listCuratedRoutes is disconnected (query never resolves)",
            "would fail if useCuratedDiscovery is mocked/stubbed to return [] (empty)",
            "would fail if the mapper drops fields so first row keys are undefined"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "live_catalog_near_asheville",
            "action": {
              "actor": "api_client",
              "steps": [
                "mount useCuratedDiscovery({center:{lat:35.5951,lng:-82.5515}, sort:'nearest', limit:5}) against live Convex",
                "await routes !== undefined"
              ]
            },
            "end_state": {
              "must_observe": [
                "routes.length >= 1",
                "a real road name string (non-empty, e.g. a catalog name like 'Blue Ridge Parkway')",
                "typeof routes[0].id === 'string' && routes[0].id.length > 0",
                "typeof routes[0].name === 'string' && routes[0].name.length > 0",
                "typeof routes[0].lat === 'number' && typeof routes[0].lng === 'number'",
                "typeof routes[0].score === 'number'",
                "Object.keys(routes[0]) includes all of id,name,lat,lng,archetype,score,distanceMi (7 keys present)"
              ],
              "must_not_observe": [
                "routes === undefined after resolve",
                "routes === [] (empty array)",
                "routes.length === 0",
                "routes[0].id === undefined (any of the 7 keys missing/undefined)",
                "archetype value 'mountain' | 'desert' | 'scenic_byway' | 'coastal' (raw DB enum)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the hook before the query resolves, and a query that resolves to [] WHEN the consumer reads isLoading and isEmpty THEN isLoading is true while routes===undefined and false once resolved; isEmpty is true only when routes===[]",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts` \u2192 `loadingIsDistinctFromEmpty",
      "scenario": {
        "start_ref": "live_catalog_empty_bbox",
        "tier": "visible",
        "negative_control": {
          "would_fail_if": [
            "isEmpty true while still loading (undefined treated as empty)",
            "isLoading never flips false"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "action": {
              "actor": "api_client",
              "steps": [
                "mount the hook with a bbox over open ocean (zero matches)",
                "sample {isLoading,isEmpty,routes} before and after resolve"
              ]
            },
            "end_state": {
              "must_observe": [
                "before resolve: isLoading===true AND isEmpty===false",
                "after resolve: isLoading===false AND isEmpty===true AND routes.length===0"
              ],
              "must_not_observe": [
                "isEmpty===true while routes===undefined",
                "isLoading stuck true after resolve"
              ]
            }
          }
        ],
        "test_tier": "integration",
        "verification_service": "live Convex dev (api.curatedRoutes.listCuratedRoutes)"
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN useCurrentLocation returning a real {lat,lng} and no explicit center passed WHEN useCuratedDiscovery({ sort:'nearest', limit:5 }) builds its query args THEN the query center equals the current-location coordinates and distanceMi is populated on returned rows",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts` \u2192 `derivesCenterFromCurrentLocation",
      "scenario": {
        "start_ref": "current_location_present",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev + useCurrentLocation (expo-location)",
        "negative_control": {
          "would_fail_if": [
            "would fail if center derivation is removed so the query goes out with no center",
            "would fail if useCurrentLocation is stubbed to return null and the hook still hardcodes/omits distanceMi"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "current_location_present",
            "action": {
              "actor": "api_client",
              "steps": [
                "stub useCurrentLocation to return a fixed real coordinate via the real hook surface",
                "mount useCuratedDiscovery({sort:'nearest', limit:5}) with NO center",
                "inspect returned rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "routes.length >= 1",
                "every returned row has a numeric distanceMi >= 0 (e.g. 12.4)",
                "routes.every(r => typeof r.distanceMi === 'number')"
              ],
              "must_not_observe": [
                "routes === undefined after resolve",
                "routes === [] (empty array)",
                "routes.length === 0",
                "distanceMi === undefined on every row"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN a located query (sort:'nearest' + center) and an unlocated query (sort:'nearest', no center) WHEN both resolve against live Convex THEN the located result is ascending by distanceMi; the unlocated result degrades to best-first (descending compositeScore)",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts` \u2192 `ordersNearestThenBestFallback",
      "scenario": {
        "start_ref": "live_catalog_near_asheville",
        "tier": "visible",
        "negative_control": {
          "would_fail_if": [
            "sort arg hardcoded",
            "nearest order not ascending by distance",
            "fallback not best-first"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "action": {
              "actor": "api_client",
              "steps": [
                "located: mount with center + sort:'nearest'; read distanceMi sequence",
                "unlocated: mount with sort:'nearest' and no center/location; read compositeScore sequence"
              ]
            },
            "end_state": {
              "must_observe": [
                "located: distanceMi non-decreasing across rows (e.g. 3.1, 7.8, 12.4)",
                "unlocated: compositeScore non-increasing across rows (e.g. 0.91, 0.84, 0.77)"
              ],
              "must_not_observe": [
                "located result ordered by score not distance",
                "empty result for either query"
              ]
            }
          }
        ],
        "test_tier": "integration",
        "verification_service": "live Convex dev (api.curatedRoutes.listCuratedRoutes)"
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN live curated rows whose compositeScore is a 0-1 float WHEN useCuratedDiscovery maps them to discovery rows THEN each row.score equals the source compositeScore on the 0-1 scale (0 <= score <= 1), never multiplied to 0-100",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts` \u2192 `carriesScoreOnRawZeroToOneScale",
      "scenario": {
        "start_ref": "live_catalog_near_asheville",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev (api.curatedRoutes.listCuratedRoutes)",
        "negative_control": {
          "would_fail_if": [
            "would fail if the mapper rescales score by *100 (raw 0.82 becomes a static 82 on the 0-100 scale)",
            "would fail if the mapper hardcodes score to 0 / returns 0 for a non-zero source compositeScore",
            "would fail if listCuratedRoutes is stubbed/disconnected so no real 0-1 score flows through"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "live_catalog_near_asheville",
            "action": {
              "actor": "api_client",
              "steps": [
                "mount the hook against live Convex",
                "assert every row.score is in [0,1] and at least one row.score is a non-zero fraction"
              ]
            },
            "end_state": {
              "must_observe": [
                "at least one row.score strictly between 0 and 1 (e.g. 0.82)",
                "max(routes.map(r => r.score)) <= 1"
              ],
              "must_not_observe": [
                "any row.score > 1 (e.g. 82)",
                "all row.score === 0 (every score degenerate)",
                "routes === [] (empty array)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Integration test asserts first row exposes id,name,lat,lng,archetype(UI enum),score,distanceMi against live Convex.",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts -t returnsConsumedRowShapeAgainstLiveConvex"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Test asserts isLoading\u2194undefined and isEmpty\u2194[] are never both-true and never conflated.",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts -t loadingIsDistinctFromEmpty"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Test asserts query center derives from useCurrentLocation and distanceMi populates.",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts -t derivesCenterFromCurrentLocation"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Test asserts nearest-ascending order when located and best-descending fallback when not.",
      "maps_to_ac": "AC-4",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts -t ordersNearestThenBestFallback"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Test asserts every row.score in [0,1] with at least one non-degenerate fraction.",
      "maps_to_ac": "AC-5",
      "verify": "pnpm test hooks/use-curated-discovery.integration.test.ts -t carriesScoreOnRawZeroToOneScale"
    }
  ]
}
-->
