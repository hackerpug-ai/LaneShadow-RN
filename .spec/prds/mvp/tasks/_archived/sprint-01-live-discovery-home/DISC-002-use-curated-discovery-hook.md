# DISC-002: Author useCuratedDiscovery hook wrapping listCuratedRoutes

**Sprint:** sprint-01-live-discovery-home  
**Agent:** react-native-ui-implementer → react-native-ui-reviewer  
**Estimate:** 120 minutes (M)  
**Type:** FEATURE  
**Status:** Backlog  
**Proposed By:** react-native-ui-planner

---

## BACKGROUND

The Discovery screen currently renders 8 hardcoded `MOCK_ROUTES` and needs to be wired to live Convex data. This task authors the `useCuratedDiscovery` hook that wraps `api.curatedRoutes.listCuratedRoutes` and returns discovery rows in the exact shape `RouteDiscoveryScreen` already consumes. The hook must preserve the raw 0-1 compositeScore scale (formatting to % is a render concern, not a hook concern) and honor Convex's `undefined`=loading / `[]`=empty conventions.

## CRITICAL CONSTRAINTS

**MUST:**
- Derive query center from `useCurrentLocation` when no explicit center is passed
- Return UI enum archetypes only (twisties|scenic|technical|cruising|sport|adventure) — never expose DB-only enums (mountain|coastal|scenic_byway|desert)
- Honor Convex conventions: `undefined`=loading, `[]`=empty — never conflate these states

**NEVER:**
- Rescale compositeScore from 0-1 to 0-100 — scores must pass through raw as 0-1 floats
- Stub the Convex query — PRIMARY AC must mount against live `api.curatedRoutes.listCuratedRoutes`
- Derive center from mock coordinates — use `useCurrentLocation` when center is absent

**STRICTLY:**
- Pass UI enum archetypes through to the query (mapped to DB enum by backend)
- Carry compositeScore as raw 0-1 float — no formatting in hook

## SPECIFICATION

**Objective:** Create a Convex-backed hook that returns live curated discovery rows in the shape RouteDiscoveryScreen consumes.

**Success State:** `useCuratedDiscovery` is imported and used in `route-discovery-screen.tsx`, returning `{routes, isLoading, isEmpty}` with rows in `{id,name,lat,lng,archetype(UI enum),score(0-1),distanceMi}` shape, loading/empty states correctly signaled, and center derived from location.

## ACCEPTANCE CRITERIA

### AC-1: useCuratedDiscovery returns rows in correct shape from live Convex [PRIMARY]

**GIVEN:** Live Convex dev deployment is running and has curated_routes data  
**WHEN:** `useCuratedDiscovery` is called with center from `useCurrentLocation` and default params  
**THEN:** Hook returns routes array where each row has `id` (string), `name` (string), `lat` (number), `lng` (number), `archetype` (one of twisties|scenic|technical|cruising|sport|adventure), `score` (number 0-1), `distanceMi` (number)

**TEST_TIER:** integration  
**VERIFICATION_SERVICE:** live Convex dev deployment (api.curatedRoutes.listCuratedRoutes)  
**TDD_STATE:** none  
**TEST_FILE:** hooks/use-curated-discovery.test.ts  
**TEST_FUNCTION:** useCuratedDiscoveryReturnsCorrectShape

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, empty, mock, static, view-injected]
- **EVIDENCE:** artifact_type=api_response, required_capture=true
- **CASES:**
  - ACTION: Call useCuratedDiscovery with center from useCurrentLocation and default params
    MUST_OBSERVE: routes array with ≥1 row having id (string), name (string), lat (number), lng (number), archetype (one of twisties|scenic|technical|cruising|sport|adventure), score (number 0-1), distanceMi (number)
    MUST_NOT_OBSERVE: archetype values of mountain|coastal|scenic_byway|desert, score values of 0-100 or 92/95, undefined routes array, missing fields

### AC-2: useCuratedDiscovery surfaces loading and empty states correctly

**GIVEN:** Live Convex dev deployment is running  
**WHEN:** `useCuratedDiscovery` is called and the query is loading / returns empty  
**THEN:** Hook returns `isLoading: true` and `routes: undefined` on first render, then `isLoading: false` and `routes: []` when query returns empty, with `isEmpty: true` when `routes===[]`

**TEST_TIER:** integration  
**VERIFICATION_SERVICE:** live Convex dev deployment  
**TDD_STATE:** none  
**TEST_FILE:** hooks/use-curated-discovery.test.ts  
**TEST_FUNCTION:** useCuratedDiscoveryLoadingAndEmptyStates

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, conflated_states]
- **EVIDENCE:** artifact_type=api_response, required_capture=true
- **CASES:**
  - ACTION: Call useCuratedDiscovery and observe initial state, then wait for Convex query to resolve
    MUST_OBSERVE: isLoading: true and routes: undefined on first render, isLoading: false and routes: [] when query returns empty, isEmpty: true when routes===[]
    MUST_NOT_OBSERVE: isLoading: false with undefined routes, isEmpty: true with undefined routes, routes===[] treated as loading

### AC-3: useCuratedDiscovery derives center from useCurrentLocation when not passed

**GIVEN:** Live Convex dev deployment is running and expo-location is available  
**WHEN:** `useCuratedDiscovery` is called without a center param  
**THEN:** Hook derives center from `useCurrentLocation` and passes it to the query

**TEST_TIER:** integration  
**VERIFICATION_SERVICE:** live Convex dev deployment + expo-location  
**TDD_STATE:** none  
**TEST_FILE:** hooks/use-curated-discovery.test.ts  
**TEST_FUNCTION:** useCuratedDiscoveryDerivesCenter

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, hardcoded_center]
- **EVIDENCE:** artifact_type=api_response, required_capture=true
- **CASES:**
  - ACTION: Call useCuratedDiscovery without center param, verify useCurrentLocation provides lat/lng
    MUST_OBSERVE: center param passed to listCuratedRoutes matches useCurrentLocation return (lat, lng within tolerance)
    MUST_NOT_OBSERVE: hardcoded Denver center (39.7, -105.0), missing or undefined center param

### AC-4: useCuratedDiscovery applies archetypes and sort correctly

**GIVEN:** Live Convex dev deployment is running  
**WHEN:** `useCuratedDiscovery` is called with archetypes=['scenic','twisties'], sort='best' then with archetypes=[], sort='nearest'  
**THEN:** First call returns only scenic|twisties routes ordered by compositeScore desc, second call returns all routes ordered by distanceMi asc

**TEST_TIER:** integration  
**VERIFICATION_SERVICE:** live Convex dev deployment  
**TDD_STATE:** none  
**TEST_FILE:** hooks/use-curated-discovery.test.ts  
**TEST_FUNCTION:** useCuratedDiscoveryFiltersAndSorts

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, no_filter_effect]
- **EVIDENCE:** artifact_type=api_response, required_capture=true
- **CASES:**
  - ACTION: Call useCuratedDiscovery with archetypes=['scenic','twisties'], sort='best', then again with archetypes=[], sort='nearest'
    MUST_OBSERVE: First call returns only scenic|twisties routes ordered by compositeScore desc, second call returns all routes ordered by distanceMi asc
    MUST_NOT_OBSERVE: Routes with non-scenic/twisties archetypes in first call, routes ordered by score when sort='nearest', unordered results

### AC-5: useCuratedDiscovery carries compositeScore as raw 0-1

**GIVEN:** Live Convex dev deployment is running with routes having 0-1 compositeScore values  
**WHEN:** `useCuratedDiscovery` is called and returned rows are inspected  
**THEN:** All score values are in 0-1 range (e.g., 0.72, 0.88, 0.95) and no values are 0-100 integers like 92 or 95

**TEST_TIER:** integration  
**VERIFICATION_SERVICE:** live Convex dev deployment  
**TDD_STATE:** none  
**TEST_FILE:** hooks/use-curated-discovery.test.ts  
**TEST_FUNCTION:** useCuratedDiscoveryScoreScale

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, rescale_to_0_100]
- **EVIDENCE:** artifact_type=api_response, required_capture=true
- **CASES:**
  - ACTION: Call useCuratedDiscovery and inspect returned score values
    MUST_OBSERVE: All score values are in 0-1 range (e.g., 0.72, 0.88, 0.95), no values are 0-100 integers like 92 or 95
    MUST_NOT_OBSERVE: score values of 92, 88, 95 (mock 0-100 scale), score values outside 0-1 range, score transformed to percentage string

## TEST CRITERIA

- **TC-1:** All 5 AC tests pass against live Convex with no mocks  
  **VERIFY:** `pnpm test hooks/use-curated-discovery.test.ts`  
  **MAPS_TO_AC:** AC-1

- **TC-2:** Type checking passes with no errors in hook file  
  **VERIFY:** `pnpm type-check`  
  **MAPS_TO_AC:** AC-1

- **TC-3:** Linting passes with no errors  
  **VERIFY:** `pnpm lint`  
  **MAPS_TO_AC:** AC-1

## READING LIST

1. **hooks/use-current-location.ts** [PRIMARY PATTERN]  
   Lines: 1-70  
   Focus: Primary pattern for React hooks wrapping async services with loading/error states

2. **components/discovery/route-discovery-screen.tsx**  
   Lines: 36-109  
   Focus: MOCK_ROUTES shape — the exact row shape the hook must return

3. **.spec/prds/mvp/05-uc-disc.md**  
   Lines: 84-98  
   Focus: UC-DISC-04 specification — hook contract and shape requirements

4. **.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md**  
   Lines: 43-48  
   Focus: Hook architecture — useCuratedDiscovery design and requirements

5. **.spec/prds/mvp/10-e2e-testing-criteria.md**  
   Lines: 84-88  
   Focus: T-DISC-004 — integration test criteria for the hook

## GUARDRAILS

**WRITE_ALLOWED:**
- `hooks/use-curated-discovery.ts` (NEW)
- `hooks/use-curated-discovery.test.ts` (NEW)

**WRITE_PROHIBITED:**
- `hooks/use-route-discovery.ts` — leave untouched for offline fast-follow
- `convex/*.ts` — no backend changes in this task
- Any file not explicitly listed above

## CODE PATTERN

```typescript
// Pattern from use-current-location.ts
export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
    loading: true,
    error: null,
  })
  // ... async resolution with loading/error states
  return state
}

// Apply same pattern to useCuratedDiscovery
export function useCuratedDiscovery(params: DiscoveryParams) {
  const [state, setState] = useState<DiscoveryState>({
    routes: undefined,
    isLoading: true,
    isEmpty: false,
  })
  // ... wrap useQuery(api.curatedRoutes.listCuratedRoutes, params)
  return { routes, isLoading, isEmpty }
}
```

## DESIGN

**References:**
- UC-DISC-04: Hook returns live rows in RouteDiscoveryScreen shape
- 07-ui-infrastructure.md: Hook architecture, 0-1 score scale, location-derived center

**Interaction Notes:**
- Hook is pure data — no UI, no SafeAreaView needed
- Platform-agnostic (only depends on expo-location and Convex)
- Test on both iOS and Android for location permission flow

**Component Library:**
- N/A — this is a hook, not a UI component

**Expo Config:**
- No Expo configuration changes required for this task

## AGENT INSTRUCTIONS

### FOR EACH ACCEPTANCE CRITERION:

#### RED PHASE
1. READ: Current AC definition, existing hooks patterns, test examples
2. WRITE: ONE test that exercises GIVEN-WHEN-THEN against live Convex
3. RUN: `pnpm test hooks/use-curated-discovery.test.ts`
4. VERIFY: Test FAILS (not errors — fails)
5. RETURN: { phase: "RED", test_file, test_function, failure_output }

#### GREEN PHASE
1. READ: Failing test, AC definition, use-current-location pattern
2. WRITE: MINIMAL hook implementation to make test pass
3. RUN: `pnpm test hooks/use-curated-discovery.test.ts`
4. VERIFY: Test PASSES
5. RETURN: { phase: "GREEN", files_changed, test_output }

#### REFACTOR PHASE
1. READ: Implementation just written
2. WRITE: Improved code (if needed)
3. RUN: `pnpm test`
4. VERIFY: Tests still pass
5. RETURN: { phase: "REFACTOR", files_changed, still_passing }

### AFTER ALL ACs COMPLETE:
The domain-specific reviewer (react-native-ui-reviewer) is dispatched.

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **RED phase evidence:** TDD_STATE values show each test went red before green
2. **Each AC has a test:** Test file contains one test per AC (5 tests total)
3. **All tests pass:** `pnpm test hooks/use-curated-discovery.test.ts` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0, no type errors
5. **Lint:** `pnpm lint` → Exit 0, no lint errors
6. **Scope compliance:** `git diff --name-only` ⊆ {hooks/use-curated-discovery.ts, hooks/use-curated-discovery.test.ts}
7. **Integration coverage:** PRIMARY AC-1 has TEST_TIER: integration, verified against live Convex
8. **Scenario is un-fakeable (PRIMARY):** AC-1 scenario seeded via real Convex query, MUST_OBSERVE asserts real row shapes from live data, NEGATIVE_CONTROL would fail on disconnect/stub

## AGENT ASSIGNMENT

**Implementer:** react-native-ui-implementer  
**Reviewer:** react-native-ui-reviewer

**Rationale:** Frontend React Native task requiring Convex integration and hook architecture. Implementer writes hook and integration tests; reviewer verifies real Convex mounting and 0-1 score preservation.

## EVIDENCE GATES

1. **RED phase evidence:** TDD_STATE values show each test went red before green
2. **Each AC has a test:** Test file contains one test per AC (5 tests total)
3. **All tests pass:** `pnpm test hooks/use-curated-discovery.test.ts` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0
5. **Lint:** `pnpm lint` → Exit 0
6. **Scope compliance:** `git diff --name-only` ⊆ writeAllowed
7. **Integration coverage:** PRIMARY AC-1 has TEST_TIER: integration
8. **Scenario is un-fakeable (PRIMARY):** AC-1 scenario asserts live Convex query returns real row shapes

## REVIEW CRITERIA

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence present in TDD_STATE history
- Minimal implementation; no gold-plating
- Pattern consistent with READING LIST (use-current-location.ts)
- SCOPE respected (git diff --name-only ⊆ writeAllowed)
- PRIMARY AC mounted against live Convex (no mocks)

**Should verify:**
- 0-1 score scale preserved (no rescaling to 0-100)
- UI enum archetypes only (no DB enum leakage)
- Loading/empty states correctly conflated

**Verdict:** [APPROVED | NEEDS_FIXES]

## DEPENDENCIES

**Depends on:**
- **DATA-005** (listCuratedRoutes Convex query must be deployed and functional)
- **DATA-002** (archetype mapping transform must be deployed so UI enums map correctly)

**Blocks:**
- **DISC-003** (RouteDiscoveryScreen wiring depends on this hook existing and working)

**Parallel:**
- DISC-004 (map convergence can happen in parallel)

## NOTES

**Cross-Specialist Dependencies:**
- This task depends on Convex backend work (DATA-005: listCuratedRoutes public query)
- DATA-002 must be deployed for archetype mapping to work correctly

**No-Mock-Home Rule:**
- This hook is a prerequisite for DISC-003, which is a prerequisite for DISC-001
- Discovery cannot become default landing until the screen is wired to live data (no MOCK_ROUTES)

**Verification on Real Device:**
- Hook integration tests run against live Convex dev deployment
- No mocks or stubs — PRIMARY AC requires live query mounting

**Fixtures Shared Across Tasks:**
- `founder_location`: useCurrentLocation returns lat ~39.7-40.4, lng ~-105.0 to -105.8 (Colorado Front Range)
- `known_route_with_polyline`: Route like 'Trail Ridge Road' with polyline data and known archetype
- `known_double_spelled_state`: State 'North Carolina' has both 'North Carolina' and 'North-Carolina' spellings

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "useCuratedDiscovery returns rows in {id,name,lat,lng,archetype(UI enum),score(0-1),distanceMi} shape RouteDiscoveryScreen consumes",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts --grep 'useCuratedDiscoveryReturnsCorrectShape'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "live Convex dev deployment",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "empty", "mock", "static", "view-injected"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "api_client", "steps": ["Call useCuratedDiscovery with center from useCurrentLocation and default params"] },
            "end_state": {
              "must_observe": ["routes array with ≥1 row having id (string), name (string), lat (number), lng (number), archetype (one of twisties|scenic|technical|cruising|sport|adventure), score (number 0-1), distanceMi (number)"],
              "must_not_observe": ["archetype values of mountain|coastal|scenic_byway|desert", "score values of 0-100 or 92/95", "undefined routes array", "missing fields"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "useCuratedDiscovery surfaces loading state when routes is undefined and distinct empty state when routes===[]",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts --grep 'useCuratedDiscoveryLoadingAndEmptyStates'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "live Convex dev deployment",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "conflated_states"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "api_client", "steps": ["Call useCuratedDiscovery and observe initial state", "Wait for Convex query to resolve"] },
            "end_state": {
              "must_observe": ["isLoading: true and routes: undefined on first render", "isLoading: false and routes: [] when query returns empty", "isEmpty: true when routes===[]"],
              "must_not_observe": ["isLoading: false with undefined routes", "isEmpty: true with undefined routes", "routes===[] treated as loading"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "useCuratedDiscovery derives query center from useCurrentLocation when no explicit center is passed",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts --grep 'useCuratedDiscoveryDerivesCenter'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "live Convex dev deployment + expo-location",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "hardcoded_center"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "api_client", "steps": ["Call useCuratedDiscovery without center param", "Verify useCurrentLocation provides lat/lng"] },
            "end_state": {
              "must_observe": ["center param passed to listCuratedRoutes matches useCurrentLocation return (lat, lng within tolerance)"],
              "must_not_observe": ["hardcoded Denver center (39.7, -105.0)", "missing or undefined center param"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "useCuratedDiscovery applies UI-enum archetypes and best|nearest sort and receives rows filtered and ordered accordingly",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts --grep 'useCuratedDiscoveryFiltersAndSorts'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "live Convex dev deployment",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "no_filter_effect"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "api_client", "steps": ["Call useCuratedDiscovery with archetypes=['scenic','twisties'], sort='best'", "Call again with archetypes=[], sort='nearest'"] },
            "end_state": {
              "must_observe": ["First call returns only scenic|twisties routes ordered by compositeScore desc", "Second call returns all routes ordered by distanceMi asc"],
              "must_not_observe": ["Routes with non-scenic/twisties archetypes in first call", "Routes ordered by score when sort='nearest'", "Unordered results"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "useCuratedDiscovery carries compositeScore through on raw 0-1 scale without rescaling",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts --grep 'useCuratedDiscoveryScoreScale'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "live Convex dev deployment",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "rescale_to_0_100"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "api_client", "steps": ["Call useCuratedDiscovery and inspect returned score values"] },
            "end_state": {
              "must_observe": ["All score values are in 0-1 range (e.g., 0.72, 0.88, 0.95)", "No values are 0-100 integers like 92 or 95"],
              "must_not_observe": ["score values of 92, 88, 95 (mock 0-100 scale)", "score values outside 0-1 range", "score transformed to percentage string"]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All 5 AC tests pass against live Convex with no mocks",
      "verify": "pnpm test hooks/use-curated-discovery.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Type checking passes with no errors in hook file",
      "verify": "pnpm type-check",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Linting passes with no errors",
      "verify": "pnpm lint",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
