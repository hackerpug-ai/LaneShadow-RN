# DISC-001: Make Discovery the default landing; demote chat to Plan-a-ride drawer entry

**Sprint:** sprint-01-live-discovery-home  
**Agent:** react-native-ui-implementer → react-native-ui-reviewer  
**Estimate:** 180 minutes (M)  
**Type:** FEATURE  
**Status:** Backlog  
**Proposed By:** react-native-ui-planner

---

## BACKGROUND

The chat planning agent is currently the default home screen. This task makes Discovery the default landing and demotes chat to a secondary "Plan a ride" drawer entry. The tab bar is hidden, so "default" is enforced by route ordering/redirect, not by a visible tab. Chat screen internals are NOT modified — only its position as default landing changes.

## CRITICAL CONSTRAINTS

**MUST:**
- Create discover.tsx rendering RouteDiscoveryScreen
- Register discover as Tabs.Screen in _layout.tsx
- Set discover as default landing via route ordering/redirect
- Update drawer: 'Discover' → /(app)/(tabs)/discover, 'Plan a ride' → /(app)/(tabs)
- Resolve duplicate 'Home' entry (repurpose or remove)
- Leave chat internals unchanged

**NEVER:**
- Make Discovery the default landing while it still renders MOCK_ROUTES — this task depends on DISC-003 completing first
- Modify index.tsx (chat) internals — only its position as default landing changes
- Leave two drawer entries pointing to the same screen (must resolve duplicate 'Home' entry)
- Delete or stub the chat screen — it must remain reachable via 'Plan a ride'

**STRICTLY:**
- Enforce default landing via route ordering/redirect (tab bar is hidden)
- No two drawer entries may resolve to the same route

## SPECIFICATION

**Objective:** Make Discovery the default landing screen and demote chat to a 'Plan a ride' drawer entry without modifying chat internals.

**Success State:** App cold-launches to Discovery screen, drawer shows 'Discover' (primary) and 'Plan a ride' (secondary), chat remains reachable and functional, no duplicate drawer entries exist.

## ACCEPTANCE CRITERIA

### AC-1: Rider can launch the app and see Discovery as the default home screen [PRIMARY]

**GIVEN:** App is installed on real device and Discovery is wired to live data (DISC-003 complete)  
**WHEN:** Rider cold-launches the app  
**THEN:** Discovery screen renders immediately with full-bleed map showing real curated pins (not chat planning screen)

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS device + real Android device (app launch)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** discoveryIsDefaultLanding

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, mock_home, static]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Cold-launch the app on real device, observe initial screen
    MUST_OBSERVE: Discovery screen renders immediately (testID='route-discovery-screen'), full-bleed map with real curated pins (not chat planning screen)
    MUST_NOT_OBSERVE: Chat planning screen as default, splash screen stuck, error or crash on launch

### AC-2: Rider can see routes ranked by composite score when sort is set to best

**GIVEN:** App launched to Discovery screen on real device with live Convex data  
**WHEN:** Rider observes pins with sort=Best (default)  
**THEN:** Pins with highest compositeScore (0-1) appear first with rank badges 1, 2, 3..., pin order matches score descending

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** bestSortSurfacesTopRoutes

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, no_sort_effect]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, verify sort=Best (default), inspect first few pins
    MUST_OBSERVE: Pins with highest compositeScore (0-1) appear first (rank badges 1, 2, 3...), pin order matches score descending
    MUST_NOT_OBSERVE: Random pin order, low-score pins ranked first, no rank badges visible

### AC-3: Rider can browse routes by proximity to their current location

**GIVEN:** App launched to Discovery screen on real device with location available  
**WHEN:** Rider toggles sort to Nearest  
**THEN:** Pins ordered by distanceMi ascending (closest first), distance labels show 'X.X mi' format

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** proximityBrowseWorks

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, no_location_effect]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen with location available, toggle sort to Nearest, inspect pin order
    MUST_OBSERVE: Pins ordered by distanceMi ascending (closest first), distance labels show 'X.X mi' format
    MUST_NOT_OBSERVE: Pins ordered by score when Nearest selected, no distance labels, random order

### AC-4: System displays loading overlay while fetching and empty overlay when no routes match

**GIVEN:** App launched to Discovery screen on real device with live Convex  
**WHEN:** Initial load happens / user navigates to ocean bbox / applies narrow filter  
**THEN:** DiscoveryLoadingOverlay shows during initial fetch, DiscoveryEmptyOverlay shows when no routes in view, DiscoveryEmptyOverlay shows when filter returns zero results

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device against live Convex  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** loadingAndEmptyOverlaysWork

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, no_overlays]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, navigate to ocean bbox, observe overlays
    MUST_OBSERVE: DiscoveryLoadingOverlay shows during initial fetch, DiscoveryEmptyOverlay shows when no routes in view
    MUST_NOT_OBSERVE: No loading overlay (stuck empty), no empty overlay on zero results, inline empty state View

### AC-5: Rider can open 'Plan a ride' chat agent from drawer without it being default home

**GIVEN:** App launched to Discovery screen on real device  
**WHEN:** Rider opens app drawer and taps 'Plan a ride' entry  
**THEN:** Chat planning screen opens (testID from index.tsx present), drawer 'Plan a ride' entry exists (testID='drawer-plan-a-ride')

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (drawer navigation)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** planARideEntryWorks

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, missing_drawer_entry]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open app drawer, tap 'Plan a ride' entry
    MUST_OBSERVE: Chat planning screen opens (testID from index.tsx present), drawer 'Plan a ride' entry exists (testID='drawer-plan-a-ride')
    MUST_NOT_OBSERVE: No 'Plan a ride' entry in drawer, chat screen as default landing, drawer entry not tappable

### AC-6: Rider can launch app and land on Discovery screen as default home

**GIVEN:** App is installed on real device  
**WHEN:** Rider kills app and cold-launches from home screen  
**THEN:** Discovery screen is first visible screen, no navigation to chat required to reach Discovery

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS device + real Android device (app launch)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** coldLaunchLandsOnDiscovery

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, chat_as_default]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Kill app, cold-launch from home screen, observe first screen
    MUST_OBSERVE: Discovery screen is first visible screen, no navigation to chat required to reach Discovery
    MUST_NOT_OBSERVE: Chat map appears first, must tap 'Discover' to see Discovery screen

### AC-7: Rider can open drawer and tap 'Plan a ride' to reach unmodified chat

**GIVEN:** App launched to Discovery screen on real device  
**WHEN:** Rider opens drawer and taps 'Plan a ride'  
**THEN:** Chat screen renders unchanged from original index.tsx, chat features work (map/chat modes, sessions list)

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (drawer navigation)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** drawerPlanARideOpensChat

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, broken_drawer_routing]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open drawer, tap 'Plan a ride'
    MUST_OBSERVE: Chat screen renders unchanged from original index.tsx, chat features work (map/chat modes, sessions list)
    MUST_NOT_OBSERVE: Chat screen broken or missing features, navigation error or crash, chat screen modified from original

### AC-8: Rider can open drawer and see 'Discover' as primary entry that returns home

**GIVEN:** App launched to Discovery screen on real device  
**WHEN:** Rider opens drawer and verifies 'Discover' entry exists  
**THEN:** Drawer shows 'Discover' as first/primary Navigate entry (testID='drawer-discover'), tapping 'Discover' returns to Discovery screen

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (drawer navigation)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** drawerDiscoverEntryReturnsHome

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, missing_discover_entry]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open drawer, verify 'Discover' entry exists, tap 'Discover'
    MUST_OBSERVE: Drawer shows 'Discover' as first/primary Navigate entry (testID='drawer-discover'), tapping 'Discover' returns to Discovery screen
    MUST_NOT_OBSERVE: No 'Discover' entry in drawer, 'Discover' entry missing or disabled, 'Discover' routes to wrong screen

### AC-9: System can render chat planning screen unchanged (no code edits to index.tsx)

**GIVEN:** App is installed on real device and drawer navigation works  
**WHEN:** git diff is run on app/(app)/(tabs)/index.tsx and chat is opened via drawer  
**THEN:** git diff shows minimal/zero changes to index.tsx, chat screen renders with all original features intact

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (git diff + visual inspection)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** chatInternalsUnchanged

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, chat_modified]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Run git diff on app/(app)/(tabs)/index.tsx, open chat via drawer and inspect
    MUST_OBSERVE: git diff shows minimal/zero changes to index.tsx, chat screen renders with all original features intact
    MUST_NOT_OBSERVE: Significant edits to chat internals, missing chat features, broken chat UI or logic

### AC-10: Rider can navigate Discover → Plan a ride → Discover without duplicate drawer entries

**GIVEN:** App launched to Discovery screen on real device  
**WHEN:** Rider opens app (lands on Discovery), opens drawer/taps 'Plan a ride', opens drawer/taps 'Discover'  
**THEN:** Each drawer entry points to distinct route (no duplicates), 'Discover' returns to Discovery home, 'Plan a ride' to chat, no two drawer entries resolve to same screen

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (drawer navigation loop)  
**TDD_STATE:** none  
**TEST_FILE:** app/(app)/(tabs)/discover.test.tsx  
**TEST_FUNCTION:** discoverPlanARideDiscoverLoop

**SCENARIO:**
- **START_REF:** app_launch
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, duplicate_drawer_entries]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open app (lands on Discovery), open drawer/tap 'Plan a ride', open drawer/tap 'Discover'
    MUST_OBSERVE: Each drawer entry points to distinct route (no duplicates), 'Discover' returns to Discovery home, 'Plan a ride' to chat
    MUST_NOT_OBSERVE: Two drawer entries both labeled 'Home', both 'Discover' and another entry route to Discovery, duplicate routes causing confusion

## TEST CRITERIA

- **TC-1:** All 10 AC tests pass on real device  
  **VERIFY:** `pnpm test app/(app)/(tabs)/discover.test.tsx`  
  **MAPS_TO_AC:** AC-1

- **TC-2:** Type checking passes  
  **VERIFY:** `pnpm type-check`  
  **MAPS_TO_AC:** AC-1

- **TC-3:** Linting passes  
  **VERIFY:** `pnpm lint`  
  **MAPS_TO_AC:** AC-1

- **TC-4:** Chat internals unchanged (git diff check)  
  **VERIFY:** `git diff app/(app)/(tabs)/index.tsx | wc -l; exit 0 if < 10 lines changed`  
  **MAPS_TO_AC:** AC-9

- **TC-5:** No duplicate drawer entries  
  **VERIFY:** `grep -c 'label.*Home' components/layouts/menu-layout.tsx; exit 0 if == 1`  
  **MAPS_TO_AC:** AC-10

## READING LIST

1. **app/(app)/(tabs)/_layout.tsx** [PRIMARY PATTERN]  
   Lines: 1-66  
   Focus: Tabs.Screen registration pattern and tabBarStyle.display:'none'

2. **components/layouts/menu-layout.tsx**  
   Lines: 92-117  
   Focus: Navigate section structure and drawer item pattern

3. **.spec/prds/mvp/09-technical-requirements/09-routing.md**  
   Lines: 1-45  
   Focus: Route Delta and default-landing change strategy

4. **.spec/prds/mvp/05-uc-disc.md**  
   Lines: 44-65  
   Focus: UC-DISC-02 specification — default landing and drawer requirements

5. **app/(app)/(tabs)/index.tsx**  
   Lines: 1-50  
   Focus: Chat screen structure — ensure we don't modify internals

## GUARDRAILS

**WRITE_ALLOWED:**
- `app/(app)/(tabs)/discover.tsx` (NEW) — Discovery screen route rendering RouteDiscoveryScreen
- `app/(app)/(tabs)/_layout.tsx` (MODIFY) — Register discover as Tabs.Screen, set as default landing
- `components/layouts/menu-layout.tsx` (MODIFY) — Update Navigate section: 'Discover' primary, 'Plan a ride' new entry, resolve duplicate 'Home'

**WRITE_PROHIBITED:**
- `app/(app)/(tabs)/index.tsx` (chat) internals — DO NOT modify chat screen internals
- `components/discovery/*` — Discovery components are wired in DISC-003, not touched here
- Any file not explicitly listed above

## CODE PATTERN

```typescript
// NEW FILE: app/(app)/(tabs)/discover.tsx
import { RouteDiscoveryScreen } from '../../../components/discovery/route-discovery-screen';
import { MenuLayout } from '../../../components/layouts/menu-layout';

export default function DiscoverScreen() {
  return (
    <MenuLayout
      headerTitle="Discover"
      testID="route-discovery-screen"
      menuOpen={false}
      onMenuOpenChange={() => {}}
    >
      <RouteDiscoveryScreen />
    </MenuLayout>
  );
}

// MODIFY: app/(app)/(tabs)/_layout.tsx
<Tabs>
  {/* Existing tabs */}
  <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
  {/* ... other tabs */}
</Tabs>

// Set discover as default via route ordering or redirect:
// Option 1: Reorder Tabs so discover is first
// Option 2: Add redirect in index.tsx (if needed)

// MODIFY: components/layouts/menu-layout.tsx
items: [
  {
    label: 'Discover',
    icon: 'compass', // or 'map-legend'
    onPress: () => router.push('/(app)/(tabs)/discover'),
    testID: 'drawer-discover',
  },
  {
    label: 'Plan a ride',
    icon: 'motorbike', // or 'route'
    onPress: () => router.push('/(app)/(tabs)'),
    testID: 'drawer-plan-a-ride',
  },
  // ... other items
  // Remove or repurpose duplicate 'Home' entry
]
```

## DESIGN

**References:**
- UC-DISC-02: Discovery as default home, chat demoted to drawer
- 09-routing.md: Route Delta and default-landing change strategy

**Interaction Notes:**
- Tab bar is hidden (tabBarStyle.display:'none') — navigation via drawer + router.push
- Default landing enforced by route ordering/redirect, not visible tab selection
- Drawer entries ≥44dp minimum touch target
- Test cold-launch behavior on both iOS and Android

**Component Library:**
- RouteDiscoveryScreen — reuse component wired in DISC-003
- MenuLayout — reuse existing drawer with updated Navigate items

**Drawer Labels (from frontend-designer):**
- Primary "Discover" → MaterialCommunityIcons 'compass'/'map-legend' → /(app)/(tabs)/discover
- "Plan a ride" → 'motorbike'/'route' → chat (/(app)/(tabs))
- Repurpose legacy "Home" entry (menu-layout.tsx ~lines 96-100) so two entries never resolve to the same screen
- Icon vocab consistent with existing drawer ('home-variant','cog','bookmark-multiple')

**Default Landing Strategy:**
- Tab bar is hidden, so "default" is enforced by route ordering/redirect
- Option 1: Reorder Tabs so discover is first in list
- Option 2: Add redirect in index.tsx (router.push('/(app)/(tabs)/discover'))
- Choose option that requires least code change and is most maintainable

**No-Mock-Home Rule:**
- This task depends_on DISC-003 (Discovery must be wired to live data first)
- Discovery cannot become default landing while it still renders MOCK_ROUTES
- This dependency is enforced in the CRITICAL CONSTRAINTS

**Expo Config:**
- No Expo configuration changes required

## AGENT INSTRUCTIONS

### FOR EACH ACCEPTANCE CRITERION:

#### RED PHASE
1. READ: Current AC definition, _layout.tsx, menu-layout.tsx
2. WRITE: ONE E2E test that exercises GIVEN-WHEN-THEN on real device
3. RUN: `pnpm test app/(app)/(tabs)/discover.test.tsx`
4. VERIFY: Test FAILS (not errors — fails)
5. RETURN: { phase: "RED", test_file, test_function, failure_output }

#### GREEN PHASE
1. READ: Failing test, AC definition, existing routing patterns
2. WRITE: MINIMAL routing/drawer changes to make test pass
3. RUN: `pnpm test app/(app)/(tabs)/discover.test.tsx`
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
2. **Each AC has a test:** Test file contains one test per AC (10 tests total)
3. **All tests pass:** `pnpm test app/(app)/(tabs)/discover.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0, no type errors
5. **Lint:** `pnpm lint` → Exit 0, no lint errors
6. **Scope compliance:** `git diff --name-only` ⊆ {discover.tsx, _layout.tsx, menu-layout.tsx}
7. **Chat internals unchanged:** `git diff app/(app)/(tabs)/index.tsx` → < 10 lines changed
8. **No duplicate drawer entries:** `grep -c 'label.*Home' menu-layout.tsx` → == 1
9. **On-device build:** `pnpm client:dev` → Expo starts, cold-launch lands on Discovery
10. **E2E coverage:** All ACs have TEST_TIER: e2e, verified on real device
11. **Scenario is un-fakeable (PRIMARY):** AC-1 scenario asserts cold-launch lands on Discovery, NEGATIVE_CONTROL would fail if chat still default
12. **No-mock-home rule:** DISC-003 dependency satisfied (Discovery wired to live data)

## AGENT ASSIGNMENT

**Implementer:** react-native-ui-implementer  
**Reviewer:** react-native-ui-reviewer

**Rationale:** Frontend React Native task requiring routing changes and drawer updates. Implementer creates discover route and updates navigation; reviewer verifies default landing and drawer correctness.

## EVIDENCE GATES

1. **RED phase evidence:** TDD_STATE values show each test went red before green
2. **Each AC has a test:** Test file contains one test per AC (10 tests total)
3. **All tests pass:** `pnpm test app/(app)/(tabs)/discover.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0
5. **Lint:** `pnpm lint` → Exit 0
6. **Scope compliance:** `git diff --name-only` ⊆ writeAllowed
7. **Chat internals unchanged:** `git diff index.tsx` → < 10 lines
8. **No duplicate drawer entries:** Single 'Home' entry in drawer
9. **On-device build:** `pnpm client:dev` → Expo starts
10. **E2E coverage:** All ACs have TEST_TIER: e2e
11. **Scenario is un-fakeable (PRIMARY):** AC-1 asserts Discovery default landing
12. **No-mock-home rule:** DISC-003 complete

## REVIEW CRITERIA

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence present in TDD_STATE history
- Minimal implementation; no gold-plating
- Pattern consistent with READING LIST (_layout.tsx, menu-layout.tsx)
- SCOPE respected (git diff --name-only ⊆ writeAllowed)
- Chat internals unchanged (git diff check passes)
- No duplicate drawer entries
- All ACs verified on real device

**Should verify:**
- Default landing enforced correctly (route ordering/redirect)
- Drawer navigation works (Discover ↔ Plan a ride)
- Cold-launch behavior consistent on iOS + Android

**Verdict:** [APPROVED | NEEDS_FIXES]

## DEPENDENCIES

**Depends on:**
- **DISC-003** (Discovery must be wired to live data first — no-mock-home rule)
- **DISC-002** (useCuratedDiscovery hook must exist)

**Blocks:**
- None

**Parallel:**
- None (must wait for DISC-003 to complete)

## NOTES

**No-Mock-Home Rule:**
- This is the highest-stakes dependency in the sprint
- Discovery CANNOT become default landing while it still renders MOCK_ROUTES
- This dependency is explicitly enforced: DISC-001 depends_on DISC-003
- Orchestrator must verify DISC-003 is complete before starting DISC-001

**Design Enrichments (from frontend-designer):**
- **Drawer labels:**
  - Primary "Discover" (MaterialCommunityIcons 'compass'/'map-legend') → /(app)/(tabs)/discover
  - "Plan a ride" ('motorbike'/'route') → chat
  - Repurpose legacy "Home" entry (menu-layout.tsx ~lines 96-100) so two entries never resolve to the same screen
  - Icon vocab consistent with existing drawer ('home-variant','cog','bookmark-multiple')

**Default Landing Implementation:**
- Tab bar is hidden (tabBarStyle.display:'none' in _layout.tsx)
- "Default" enforced by route ordering/redirect, not visible tab
- Option 1: Reorder Tabs so discover is first
- Option 2: Add redirect in existing index.tsx (router.push('/(app)/(tabs)/discover'))
- Choose option that requires least code change

**Chat Internals Unchanged:**
- `app/(app)/(tabs)/index.tsx` must NOT be modified except for routing (if needed)
- All chat features (map/chat modes, sessions list, etc.) must remain functional
- Git diff check enforces this: < 10 lines changed

**testIDs Carried:**
- drawer-discover
- drawer-plan-a-ride
- route-discovery-screen (inherited from RouteDiscoveryScreen)

**Verification on Real Device:**
- All ACs require real device testing (iOS + Android)
- App cold-launch behavior is device-specific
- Drawer navigation must work on both platforms

**Fixtures Shared Across Tasks:**
- `app_launch`: App cold-launches from home screen, Expo initializes, initial route renders
- `founder_location`: useCurrentLocation returns lat ~39.7-40.4, lng ~-105.0 to -105.8
- `ocean_bbox`: Bbox with no curated_routes centroids (returns [])

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "Rider can launch the app and see Discovery as the default home screen with a full-bleed map of real curated route pins",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'discoveryIsDefaultLanding'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS device + real Android device (app launch)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "mock_home", "static"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Cold-launch the app on real device", "Observe initial screen"] },
            "end_state": {
              "must_observe": ["Discovery screen renders immediately (testID='route-discovery-screen')", "Full-bleed map with real curated pins (not chat planning screen)"],
              "must_not_observe": ["Chat planning screen as default", "Splash screen stuck", "Error or crash on launch"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can see routes ranked by composite score so the best roads surface first when sort is set to best",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'bestSortSurfacesTopRoutes'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "no_sort_effect"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Verify sort=Best (default)", "Inspect first few pins"] },
            "end_state": {
              "must_observe": ["Pins with highest compositeScore (0-1) appear first (rank badges 1, 2, 3...)", "Pin order matches score descending"],
              "must_not_observe": ["Random pin order", "Low-score pins ranked first", "No rank badges visible"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can browse routes by proximity to their current location when location is available",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'proximityBrowseWorks'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "no_location_effect"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen with location available", "Toggle sort to Nearest", "Inspect pin order"] },
            "end_state": {
              "must_observe": ["Pins ordered by distanceMi ascending (closest first)", "Distance labels show 'X.X mi' format"],
              "must_not_observe": ["Pins ordered by score when Nearest selected", "No distance labels", "Random order"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "System displays the loading overlay while curated routes are being fetched and the empty overlay when no routes match the current view",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'loadingAndEmptyOverlaysWork'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "no_overlays"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Navigate to ocean bbox", "Observe overlays"] },
            "end_state": {
              "must_observe": ["DiscoveryLoadingOverlay shows during initial fetch", "DiscoveryEmptyOverlay shows when no routes in view"],
              "must_not_observe": ["No loading overlay (stuck empty)", "No empty overlay on zero results", "Inline empty state View"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can open the secondary 'Plan a ride' chat agent from the drawer without it being the default home",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'planARideEntryWorks'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (drawer navigation)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "missing_drawer_entry"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Open app drawer", "Tap 'Plan a ride' entry"] },
            "end_state": {
              "must_observe": ["Chat planning screen opens (testID from index.tsx present)", "Drawer 'Plan a ride' entry exists (testID='drawer-plan-a-ride')"],
              "must_not_observe": ["No 'Plan a ride' entry in drawer", "Chat screen as default landing", "Drawer entry not tappable"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can launch the app on a real device and land on the Discovery screen (not the chat map) as the default home",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'coldLaunchLandsOnDiscovery'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS device + real Android device (app launch)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "chat_as_default"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Kill app, cold-launch from home screen", "Observe first screen"] },
            "end_state": {
              "must_observe": ["Discovery screen is first visible screen", "No navigation to chat required to reach Discovery"],
              "must_not_observe": ["Chat map appears first", "Must tap 'Discover' to see Discovery screen"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can open the drawer and tap 'Plan a ride' to reach the unmodified chat planning agent screen",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'drawerPlanARideOpensChat'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (drawer navigation)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "broken_drawer_routing"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Open drawer", "Tap 'Plan a ride'"] },
            "end_state": {
              "must_observe": ["Chat screen renders unchanged from original index.tsx", "Chat features work (map/chat modes, sessions list)"],
              "must_not_observe": ["Chat screen broken or missing features", "Navigation error or crash", "Chat screen modified from original"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can open the drawer and see 'Discover' as the primary Navigate entry that returns to the Discovery home",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'drawerDiscoverEntryReturnsHome'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (drawer navigation)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "missing_discover_entry"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Open drawer", "Verify 'Discover' entry exists", "Tap 'Discover'"] },
            "end_state": {
              "must_observe": ["Drawer shows 'Discover' as first/primary Navigate entry (testID='drawer-discover')", "Tapping 'Discover' returns to Discovery screen"],
              "must_not_observe": ["No 'Discover' entry in drawer", "'Discover' entry missing or disabled", "'Discover' routes to wrong screen"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "System can render the chat planning screen unchanged (no code edits to index.tsx beyond what default-landing requires)",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'chatInternalsUnchanged'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (git diff + visual inspection)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "chat_modified"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "api_client", "steps": ["Run git diff on app/(app)/(tabs)/index.tsx", "Open chat via drawer and inspect"] },
            "end_state": {
              "must_observe": ["git diff shows minimal/zero changes to index.tsx", "Chat screen renders with all original features intact"],
              "must_not_observe": ["Significant edits to chat internals", "Missing chat features", "Broken chat UI or logic"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Rider can navigate Discover → Plan a ride → Discover without the drawer pointing two entries at the same screen",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx --grep 'discoverPlanARideDiscoverLoop'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (drawer navigation loop)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "duplicate_drawer_entries"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "app_launch",
            "action": { "actor": "user", "steps": ["Open app (lands on Discovery)", "Open drawer, tap 'Plan a ride'", "Open drawer, tap 'Discover'"] },
            "end_state": {
              "must_observe": ["Each drawer entry points to distinct route (no duplicates)", "'Discover' returns to Discovery home, 'Plan a ride' to chat", "No two drawer entries resolve to same screen"],
              "must_not_observe": ["Two drawer entries both labeled 'Home'", "Both 'Discover' and another entry route to Discovery", "Duplicate routes causing confusion"]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All 10 AC tests pass on real device",
      "verify": "pnpm test app/(app)/(tabs)/discover.test.tsx",
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
      "description": "Chat internals unchanged (git diff check)",
      "verify": "git diff app/(app)/(tabs)/index.tsx | wc -l; exit 0 if < 10 lines changed",
      "maps_to_ac": "AC-9"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "No duplicate drawer entries",
      "verify": "grep -c 'label.*Home' components/layouts/menu-layout.tsx; exit 0 if == 1",
      "maps_to_ac": "AC-10"
    }
  ]
}
-->
