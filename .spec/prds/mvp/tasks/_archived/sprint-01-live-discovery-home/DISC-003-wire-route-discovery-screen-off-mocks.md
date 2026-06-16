# DISC-003: Wire RouteDiscoveryScreen from MOCK_ROUTES to live hook with overlays

**Sprint:** sprint-01-live-discovery-home  
**Agent:** react-native-ui-implementer → react-native-ui-reviewer  
**Estimate:** 180 minutes (L)  
**Type:** FEATURE  
**Status:** Backlog  
**Proposed By:** react-native-ui-planner

---

## BACKGROUND

The Discovery screen currently renders 8 hardcoded `MOCK_ROUTES` and uses an inline empty View. This task wires the screen to the live `useCuratedDiscovery` hook, removes the mock rankBadge hack, and wires the proper loading/empty overlay components. Composite scores must render as bars/percent (not raw 0-100 decimals). Chip counts must come from live results.

## CRITICAL CONSTRAINTS

**MUST:**
- Feed selectedArchetypes, sortMode from local UI state into useCuratedDiscovery params
- Render DiscoveryLoadingOverlay when `isLoading`, DiscoveryEmptyOverlay when `isEmpty`
- Calculate chip counts from live result set (not MOCK_ROUTES)

**NEVER:**
- Render MOCK_ROUTES — screen must use live useCuratedDiscovery hook only
- Display raw 0-1 scores as decimals — must render as bars (ScoreDimensionBar) or percent (e.g., '72%')
- Use inline empty View — must render DiscoveryEmptyOverlay and DiscoveryLoadingOverlay components
- Keep the mock rankBadge hack (lines ~250-272) — remove it and use real pin rendering

**STRICTLY:**
- Remove lines ~250-272 mock rankBadge absolute-positioned overlay
- Wire chip counts from live result set — no hardcoded mock counts

## SPECIFICATION

**Objective:** Replace MOCK_ROUTES with live Convex data via useCuratedDiscovery, wire overlays, remove mock hack, and render scores correctly.

**Success State:** RouteDiscoveryScreen calls useCuratedDiscovery, renders live pins, shows DiscoveryLoadingOverlay/DiscoveryEmptyOverlay at right times, removes mock rankBadge hack, and scores render as bars/percent.

## ACCEPTANCE CRITERIA

### AC-1: RouteDiscoveryScreen renders real curated pins from live Convex instead of 8 MOCK_ROUTES [PRIMARY]

**GIVEN:** Live Convex dev deployment is running and useCuratedDiscovery hook exists  
**WHEN:** RouteDiscoveryScreen is opened on a real device  
**THEN:** Screen shows ≥1 pin with routeId matching a live curated_routes row, pins distributed across map (not clustered in Denver), chip counts reflect live data

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS device + real Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-discovery-screen.test.tsx  
**TEST_FUNCTION:** discoveryScreenShowsLivePins

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, mock_routes, static, view-injected]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open app on real device, observe Discovery screen loads
    MUST_OBSERVE: ≥1 pin with routeId matching a live curated_routes row, pins distributed across map (not clustered in Denver), chip counts reflect live data (not '8' for all)
    MUST_NOT_OBSERVE: 8 Denver-centered fake pins (MOCK_ROUTES pattern), chip counts all showing '8' or mock values, mock route names like 'Mount Evans Scenic Byway' at identical coordinates

### AC-2: Tapping an archetype chip updates the pin set and chip counts from live result

**GIVEN:** Live Convex dev deployment is running and Discovery screen is open  
**WHEN:** Rider taps 'Scenic' chip  
**THEN:** Pin count reduces to only scenic routes, scenic chip count reflects live result (e.g., '12', '99+'), non-scenic pins removed from map

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-discovery-screen.test.tsx  
**TEST_FUNCTION:** discoveryChipFilterUpdates

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, mock_counts, no_filter_effect]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, tap 'Scenic' chip, observe pin set and chip counts
    MUST_OBSERVE: Pin count reduces to only scenic routes, scenic chip count reflects live result (e.g., '12', '99+'), non-scenic pins removed from map
    MUST_NOT_OBSERVE: Chip count stays at '8' or mock value, pin set unchanged, non-scenic pins still visible

### AC-3: Toggling Best/Nearest updates pin ordering and rank/distance labels

**GIVEN:** Live Convex dev deployment is running and Discovery screen is open with pins  
**WHEN:** Rider toggles sort from Best to Nearest  
**THEN:** Rank badges (1-10) appear when sort=Best, distance labels (e.g., '3.2 mi') appear when sort=Nearest, pin order changes based on sort mode

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-discovery-screen.test.tsx  
**TEST_FUNCTION:** discoverySortToggleUpdates

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, no_sort_effect]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, toggle sort from Best to Nearest, observe pin badges/labels
    MUST_OBSERVE: Rank badges (1-10) appear when sort=Best, distance labels (e.g., '3.2 mi') appear when sort=Nearest, pin order changes based on sort mode
    MUST_NOT_OBSERVE: Rank badges in Nearest mode, distance labels in Best mode, no change in pin order

### AC-4: DiscoveryLoadingOverlay and DiscoveryEmptyOverlay appear at the right times

**GIVEN:** Live Convex dev deployment is running and Discovery screen is open  
**WHEN:** Initial load happens / user navigates to ocean bbox / applies narrow filter  
**THEN:** DiscoveryLoadingOverlay shows during initial load, DiscoveryEmptyOverlay shows when no routes in bbox, DiscoveryEmptyOverlay shows when filter returns zero results

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-discovery-screen.test.tsx  
**TEST_FUNCTION:** discoveryOverlaysFire

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, inline_empty_view]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, navigate to ocean bbox (no routes), apply narrow filter in live area
    MUST_OBSERVE: DiscoveryLoadingOverlay shows during initial load, DiscoveryEmptyOverlay shows when no routes in bbox, DiscoveryEmptyOverlay shows when filter returns zero results
    MUST_NOT_OBSERVE: Inline empty View (testID='empty-state'), no overlay on zero results, loading overlay stuck on after data loads

### AC-5: Composite scores render as bars/percent of 0-1 value, never as raw 0-100 number

**GIVEN:** Live Convex dev deployment is running and Discovery screen shows pins with scores  
**WHEN:** Rider inspects pin badges/distance labels for score display  
**THEN:** Scores render as '72%' or bars (ScoreDimensionBar) not '0.72' or '72', pin with score 0.95 shows '95%' or ~full bar

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-discovery-screen.test.tsx  
**TEST_FUNCTION:** discoveryScoresRenderAsBars

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, raw_0_100_display]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, inspect pin badges/distance labels for score display
    MUST_OBSERVE: Scores rendered as '72%' or bars (ScoreDimensionBar) not '0.72' or '72', pin with score 0.95 shows '95%' or ~full bar
    MUST_NOT_OBSERVE: Raw decimals like '0.72' or '0.95', 0-100 integers like '72' without % sign, mock scores like '92' (MOCK_ROUTES pattern)

## TEST CRITERIA

- **TC-1:** All 5 AC tests pass on real device against live Convex  
  **VERIFY:** `pnpm test components/discovery/route-discovery-screen.test.tsx`  
  **MAPS_TO_AC:** AC-1

- **TC-2:** Type checking passes  
  **VERIFY:** `pnpm type-check`  
  **MAPS_TO_AC:** AC-1

- **TC-3:** Linting passes  
  **VERIFY:** `pnpm lint`  
  **MAPS_TO_AC:** AC-1

- **TC-4:** No MOCK_ROUTES remain in route-discovery-screen.tsx  
  **VERIFY:** `grep -n 'MOCK_ROUTES' components/discovery/route-discovery-screen.tsx; exit 1 if found`  
  **MAPS_TO_AC:** AC-1

- **TC-5:** Mock rankBadge hack (lines ~250-272) removed  
  **VERIFY:** `grep -n 'rank-badge' components/discovery/route-discovery-screen.tsx | grep -v 'rankBadge'; exit 1 if found in mock overlay pattern`  
  **MAPS_TO_AC:** AC-1

## READING LIST

1. **components/discovery/route-discovery-screen.tsx** [PRIMARY PATTERN]  
   Lines: 36-272  
   Focus: MOCK_ROUTES array and inline empty state to replace

2. **components/discovery/discovery-filter-bar.tsx**  
   Lines: 74-148  
   Focus: DiscoveryFilterBar props and UI enum archetypes

3. **components/discovery/discovery-sort-toggle.tsx**  
   Lines: 32-66  
   Focus: DiscoverySortToggle sort mode contract

4. **.spec/prds/mvp/05-uc-disc.md**  
   Lines: 101-116  
   Focus: UC-DISC-05 specification — wiring requirements and overlay constraints

5. **.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md**  
   Lines: 14-26  
   Focus: Component reuse triage — which Discovery components are ready vs. need rework

## GUARDRAILS

**WRITE_ALLOWED:**
- `components/discovery/route-discovery-screen.tsx` (MODIFY) — Replace MOCK_ROUTES with useCuratedDiscovery, remove rankBadge hack, wire overlays
- `components/discovery/route-discovery-screen.test.tsx` (NEW) — E2E tests for live wiring
- `components/discovery/discovery-loading-overlay.tsx` (MODIFY) — Wire testID if missing
- `components/discovery/discovery-empty-overlay.tsx` (MODIFY) — Wire testID if missing

**WRITE_PROHIBITED:**
- `app/(app)/(tabs)/index.tsx` — chat internals are NOT modified in this task
- `hooks/use-curated-discovery.ts` — created in DISC-002, not modified here
- Any file not explicitly listed above

## CODE PATTERN

```typescript
// BEFORE (current MOCK_ROUTES pattern):
const MOCK_ROUTES = [/* 8 hardcoded routes */];
const filteredRoutes = useMemo(() => {
  if (selectedArchetypes.length === 0) return MOCK_ROUTES;
  return MOCK_ROUTES.filter((route) => selectedArchetypes.includes(route.archetype));
}, [selectedArchetypes]);

// AFTER (live wiring pattern):
const { routes, isLoading, isEmpty } = useCuratedDiscovery({
  center: undefined, // derived from useCurrentLocation in hook
  archetypes: selectedArchetypes,
  sort: sortMode,
});

// Remove mock rankBadge hack (lines ~250-272)
// Wire overlays:
{isLoading && <DiscoveryLoadingOverlay />}
{isEmpty && <DiscoveryEmptyOverlay />}

// Score formatting in render:
const scorePercent = Math.round(route.score * 100);
// Render as `${scorePercent}%` or <ScoreDimensionBar value={route.score} />
```

## DESIGN

**References:**
- UC-DISC-05: Wire Discovery from MOCK_ROUTES to live data with overlays
- 07-ui-infrastructure.md: Component reuse triage and overlay requirements

**Interaction Notes:**
- Map is full-bleed (no SafeAreaView wrapper)
- Overlays handle their own safe area padding via `useSafeAreaInsets().top`
- All chips/toggles ≥44dp minimum touch target
- Test on both iOS and Android for overlay positioning

**Component Library:**
- DiscoveryFilterBar — reuse existing component with live counts
- DiscoverySortToggle — reuse existing component
- DiscoveryLoadingOverlay — reuse existing component
- DiscoveryEmptyOverlay — reuse existing component
- StateFilterSheet — reuse for state selection (UC-DISC-03)

**Score Rendering Rule:**
- compositeScore (0-1) displays as `Math.round(score*100)` bar-fill width and/or "NN%" label
- NEVER raw 0-100 or 0.6 decimal
- Fill color: `semantic.color.primary.default` (#EE7C2B)
- Track color: `semantic.color.surface.inset`

**Chip Count Formatting:**
- `formatCount`: ≤99 as digit, >99 as '99+', ≥1000 as '1.2k'
- Counts sourced from LIVE result, not hardcoded mock values

**Glassmorphic Overlays:**
- Background via `surface.glass` token
- Top padding via `useSafeAreaInsets().top`
- Semi-transparent to show map behind

**Remove Mock RankBadge Hack:**
- Delete lines ~250-272 absolute-positioned overlay in route-discovery-screen.tsx
- Real pin rendering happens via Mapbox markers (DISC-004)

**Expo Config:**
- No Expo configuration changes required

## AGENT INSTRUCTIONS

### FOR EACH ACCEPTANCE CRITERION:

#### RED PHASE
1. READ: Current AC definition, route-discovery-screen.tsx, overlay components
2. WRITE: ONE E2E test that exercises GIVEN-WHEN-THEN on real device
3. RUN: `pnpm test components/discovery/route-discovery-screen.test.tsx`
4. VERIFY: Test FAILS (not errors — fails)
5. RETURN: { phase: "RED", test_file, test_function, failure_output }

#### GREEN PHASE
1. READ: Failing test, AC definition, useCuratedDiscovery hook interface
2. WRITE: MINIMAL screen changes to make test pass
3. RUN: `pnpm test components/discovery/route-discovery-screen.test.tsx`
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
3. **All tests pass:** `pnpm test components/discovery/route-discovery-screen.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0, no type errors
5. **Lint:** `pnpm lint` → Exit 0, no lint errors
6. **Scope compliance:** `git diff --name-only` ⊆ {route-discovery-screen.tsx, test file, overlay components}
7. **No MOCK_ROUTES:** `grep -n 'MOCK_ROUTES' route-discovery-screen.tsx` → Exit 1 (not found)
8. **On-device build:** `pnpm client:dev` → Expo starts, screen renders on real device
9. **E2E coverage:** All ACs have TEST_TIER: e2e, verified on real device against live Convex
10. **Scenario is un-fakeable (PRIMARY):** AC-1 scenario seeded via live query, MUST_OBSERVE asserts live pins not mock Denver cluster, NEGATIVE_CONTROL would fail on MOCK_ROUTES

## AGENT ASSIGNMENT

**Implementer:** react-native-ui-implementer  
**Reviewer:** react-native-ui-reviewer

**Rationale:** Frontend React Native task requiring screen wiring, overlay integration, and score formatting. Implementer wires screen and writes E2E tests; reviewer verifies live data mounting and overlay correctness.

## EVIDENCE GATES

1. **RED phase evidence:** TDD_STATE values show each test went red before green
2. **Each AC has a test:** Test file contains one test per AC (5 tests total)
3. **All tests pass:** `pnpm test components/discovery/route-discovery-screen.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0
5. **Lint:** `pnpm lint` → Exit 0
6. **Scope compliance:** `git diff --name-only` ⊆ writeAllowed
7. **No MOCK_ROUTES:** `grep -n 'MOCK_ROUTES' route-discovery-screen.tsx` → Exit 1
8. **On-device build:** `pnpm client:dev` → Expo starts
9. **E2E coverage:** All ACs have TEST_TIER: e2e
10. **Scenario is un-fakeable (PRIMARY):** AC-1 asserts live pins replace mocks

## REVIEW CRITERIA

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence present in TDD_STATE history
- Minimal implementation; no gold-plating
- Pattern consistent with READING LIST (filter bar, sort toggle)
- SCOPE respected (git diff --name-only ⊆ writeAllowed)
- MOCK_ROUTES fully removed (grep test passes)
- All ACs verified on real device against live Convex

**Should verify:**
- Scores render as bars/% not raw decimals
- Overlays fire at correct times
- Chip counts update from live data

**Verdict:** [APPROVED | NEEDS_FIXES]

## DEPENDENCIES

**Depends on:**
- **DISC-002** (useCuratedDiscovery hook must exist and work)
- **DATA-005** (listCuratedRoutes query must be deployed)
- **DATA-002** (archetype mapping must be deployed)

**Blocks:**
- **DISC-001** (default landing change depends on Discovery being wired to live data first)

**Parallel:**
- DISC-004 (map convergence can happen in parallel)

## NOTES

**No-Mock-Home Rule:**
- This task is the prerequisite for DISC-001 (default landing change)
- Discovery cannot become default landing while it still renders MOCK_ROUTES
- This dependency is enforced: DISC-001 depends_on DISC-003

**Design Enrichments (from frontend-designer):**
- **Score rendering:** compositeScore (0-1) displays as `Math.round(score*100)` bar-fill width and/or "NN%" label; NEVER raw 0-100 or 0.6 decimal; fill `semantic.color.primary.default` (#EE7C2B) on `semantic.color.surface.inset` track
- **Chip counts:** formatCount (≤99 digit, >99 "99+", ≥1000 "1.2k") from LIVE result
- **Glassmorphic overlays:** via `surface.glass` token + `useSafeAreaInsets().top`
- **Remove mock rankBadge hack:** lines ~250-272 in route-discovery-screen.tsx

**testIDs Carried:**
- route-discovery-screen
- discovery-filter-bar
- discovery-filter-bar-chip-{archetype} (all, twisties, scenic, technical, cruising, sport, adventure)
- discovery-sort-toggle
- discovery-loading-overlay
- discovery-empty-overlay
- route-pin-{routeId} (rendered by screen, implemented in DISC-004)

**Verification on Real Device:**
- All ACs require real device testing (iOS + Android)
- Primary AC asserts live pins replace mock Denver cluster
- Overlays and score formatting verified visually

**Fixtures Shared Across Tasks:**
- `founder_location`: useCurrentLocation returns lat ~39.7-40.4, lng ~-105.0 to -105.8
- `ocean_bbox`: Bbox with no curated_routes centroids (middle of Atlantic)
- `live_southeast_bbox`: Bbox returning ≥1 curated route (e.g., North Carolina)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "RouteDiscoveryScreen renders real curated pins from live Convex instead of 8 MOCK_ROUTES on a real device",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx --grep 'discoveryScreenShowsLivePins'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS device + real Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "mock_routes", "static", "view-injected"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open app on real device", "Observe Discovery screen loads"] },
            "end_state": {
              "must_observe": ["≥1 pin with routeId matching a live curated_routes row", "Pins distributed across map (not clustered in Denver)", "Chip counts reflect live data (not '8' for all)"],
              "must_not_observe": ["8 Denver-centered fake pins (MOCK_ROUTES pattern)", "Chip counts all showing '8' or mock values", "Mock route names like 'Mount Evans Scenic Byway' at identical coordinates"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Tapping an archetype chip updates the pin set and chip counts from live result",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx --grep 'discoveryChipFilterUpdates'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "mock_counts", "no_filter_effect"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Tap 'Scenic' chip", "Observe pin set and chip counts"] },
            "end_state": {
              "must_observe": ["Pin count reduces to only scenic routes", "Scenic chip count reflects live result (e.g., '12', '99+')", "Non-scenic pins removed from map"],
              "must_not_observe": ["Chip count stays at '8' or mock value", "Pin set unchanged", "Non-scenic pins still visible"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Toggling Best/Nearest updates pin ordering and rank/distance labels on a real device",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx --grep 'discoverySortToggleUpdates'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "no_sort_effect"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Toggle sort from Best to Nearest", "Observe pin badges/labels"] },
            "end_state": {
              "must_observe": ["Rank badges (1-10) appear when sort=Best", "Distance labels (e.g., '3.2 mi') appear when sort=Nearest", "Pin order changes based on sort mode"],
              "must_not_observe": ["Rank badges in Nearest mode", "Distance labels in Best mode", "No change in pin order"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "DiscoveryLoadingOverlay and DiscoveryEmptyOverlay appear at the right times on a real device",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx --grep 'discoveryOverlaysFire'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "inline_empty_view"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Navigate to ocean bbox (no routes)", "Apply narrow filter in live area"] },
            "end_state": {
              "must_observe": ["DiscoveryLoadingOverlay shows during initial load", "DiscoveryEmptyOverlay shows when no routes in bbox", "DiscoveryEmptyOverlay shows when filter returns zero results"],
              "must_not_observe": ["Inline empty View (testID='empty-state')", "No overlay on zero results", "Loading overlay stuck on after data loads"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Composite scores render as bars/percent of 0-1 value, never as raw 0-100 number",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx --grep 'discoveryScoresRenderAsBars'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "raw_0_100_display"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Inspect pin badges/distance labels for score display"] },
            "end_state": {
              "must_observe": ["Scores rendered as '72%' or bars (ScoreDimensionBar) not '0.72' or '72'", "Pin with score 0.95 shows '95%' or ~full bar"],
              "must_not_observe": ["Raw decimals like '0.72' or '0.95'", "0-100 integers like '72' without % sign", "Mock scores like '92' (MOCK_ROUTES pattern)"]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All 5 AC tests pass on real device against live Convex",
      "verify": "pnpm test components/discovery/route-discovery-screen.test.tsx",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Type checking passes",
      "verify": "pnpm type-check",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Linting passes",
      "verify": "pnpm lint",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "No MOCK_ROUTES remain in route-discovery-screen.tsx",
      "verify": "grep -n 'MOCK_ROUTES' components/discovery/route-discovery-screen.tsx; exit 1 if found",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Mock rankBadge hack (lines ~250-272) removed",
      "verify": "grep -n 'rank-badge' components/discovery/route-discovery-screen.tsx | grep -v 'rankBadge'; exit 1 if found in mock overlay pattern",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
