# DISC-004: Resolve map divergence: standardize Discovery pins on MapboxMapView

**Sprint:** sprint-01-live-discovery-home  
**Agent:** react-native-ui-implementer → react-native-ui-reviewer  
**Estimate:** 240 minutes (L)  
**Type:** FEATURE  
**Status:** Backlog  
**Proposed By:** react-native-ui-planner

---

## BACKGROUND

The Discovery screen currently uses `MapViewWrapper` (react-native-maps / Google Maps) while the home screen uses `MapboxMapView`. Running two native map SDKs in one app is a footgun. This task converges Discovery on `MapboxMapView`, reworks `RoutePin` to drop its `react-native-maps` `Marker` import, and ensures coordinate formats are correct (MapboxCamera.center is [lng,lat], MapboxMarker.coordinates is {latitude,longitude}).

## CRITICAL CONSTRAINTS

**MUST:**
- Use MapboxMapView in route-discovery-screen.tsx with theme, initialCamera, and markers
- Rework RoutePin to use Mapbox MarkerView children or MapboxMarker[] (not react-native-maps Marker)
- Pass camera center as [lng,lat] and marker coordinates as {latitude,longitude}
- Reconcile DB enum archetype prop with UI enum filter state via archetype mapping

**NEVER:**
- Import Marker from react-native-maps in RoutePin — this is the divergence to eliminate
- Transpose Mapbox coordinate formats — MapboxCamera.center is [lng,lat], MapboxMarker.coordinates is {latitude,longitude}
- Leave MapViewWrapper in Discovery screen — must swap to MapboxMapView
- Break pin tap handlers — RoutePin press must still trigger detail open

**STRICTLY:**
- Coordinate trap: MapboxMarker.coordinates={latitude,longitude} BUT MapboxCamera.center=[lng,lat] — do NOT transpose them

## SPECIFICATION

**Objective:** Eliminate map-component divergence by standardizing Discovery on MapboxMapView and reworking RoutePin to not depend on react-native-maps.

**Success State:** Discovery screen uses only MapboxMapView (no react-native-maps instance), RoutePin renders via Mapbox MarkerView without react-native-maps Marker import, pins render at correct coordinates, and pin tap handlers work.

## ACCEPTANCE CRITERIA

### AC-1: Discovery pins are rendered by MapboxMapView (same engine as home map) [PRIMARY]

**GIVEN:** Real device with Mapbox SDK working and Discovery screen is open  
**WHEN:** Discovery screen mounts on real device  
**THEN:** Only MapboxMapView is mounted (Mapbox native SDK), no react-native-maps Google Maps instance active on Discovery screen

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS device + real Android device (Mapbox native rendering)  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-pin.test.tsx  
**TEST_FUNCTION:** mapboxRendersDiscoveryPins

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, react-native-maps_mounted, static]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen on real device, inspect native map instance via device logs or rendering
    MUST_OBSERVE: Only MapboxMapView is mounted (Mapbox native SDK), no react-native-maps Google Maps instance active on Discovery screen
    MUST_NOT_OBSERVE: MapViewWrapper or react-native-maps instance mounted, two native map SDKs running simultaneously

### AC-2: RoutePin visuals render without importing Marker from react-native-maps

**GIVEN:** Real device with Mapbox SDK working and Discovery screen shows pins  
**WHEN:** Rider inspects route pins on map  
**THEN:** Copper circle pins (44×44dp) with archetype icons are visible, rank badges (1-10) in top-right corner when sort=Best, distance labels below pins when sort=Nearest

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (Mapbox native rendering)  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-pin.test.tsx  
**TEST_FUNCTION:** routePinVisualsWorkWithoutReactNativeMaps

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, react-native-maps_import]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, inspect route pins on map
    MUST_OBSERVE: Copper circle pins (44×44dp) with archetype icons, rank badges (1-10) in top-right corner when sort=Best, distance labels below pins when sort=Nearest
    MUST_NOT_OBSERVE: Missing pin visuals, no icons or badges, broken pin layout

### AC-3: Tapping a Mapbox pin opens the detail handler with correct routeId

**GIVEN:** Real device with Mapbox SDK working and Discovery screen shows pins  
**WHEN:** Rider taps a route pin  
**THEN:** Detail screen opens with correct routeId (matching tapped pin), navigation stack pushes detail route

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (Mapbox native rendering)  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-pin.test.tsx  
**TEST_FUNCTION:** pinTapOpensDetail

**SCENARIO:**
- **START_REF:** founder_location
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, broken_onPress]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen, tap a route pin
    MUST_OBSERVE: Detail screen opens with correct routeId (matching tapped pin), navigation stack pushes detail route
    MUST_NOT_OBSERVE: No response to tap, wrong routeId passed to detail, navigation not triggered

### AC-4: Camera center and marker coordinates use correct formats without transposition

**GIVEN:** Real device with Mapbox SDK working and known route with verified centroid  
**WHEN:** Discovery screen opens with known route and pin position is inspected  
**THEN:** Pin renders at correct location matching route centroid, camera centers correctly on user location or bbox

**TEST_TIER:** e2e  
**VERIFICATION_SERVICE:** real iOS/Android device (Mapbox native rendering)  
**TDD_STATE:** none  
**TEST_FILE:** components/discovery/route-pin.test.tsx  
**TEST_FUNCTION:** coordinateFormatsCorrect

**SCENARIO:**
- **START_REF:** known_route_with_polyline
- **NEGATIVE_CONTROL:** Would fail if [disconnect, stub, transposed_coords]
- **EVIDENCE:** artifact_type=screenshot, required_capture=true
- **CASES:**
  - ACTION: Open Discovery screen with known route, inspect pin position vs expected coordinates
    MUST_OBSERVE: Pin renders at correct location matching route centroid, camera centers correctly on user location or bbox
    MUST_NOT_OBSERVE: Pin in ocean (swapped lat/lng), camera in wrong hemisphere, pin offset from expected position

## TEST CRITERIA

- **TC-1:** All 4 AC tests pass on real device  
  **VERIFY:** `pnpm test components/discovery/route-pin.test.tsx`  
  **MAPS_TO_AC:** AC-1

- **TC-2:** Type checking passes  
  **VERIFY:** `pnpm type-check`  
  **MAPS_TO_AC:** AC-1

- **TC-3:** Linting passes  
  **VERIFY:** `pnpm lint`  
  **MAPS_TO_AC:** AC-1

- **TC-4:** No react-native-maps Marker import in RoutePin  
  **VERIFY:** `grep -n "from 'react-native-maps'" components/discovery/route-pin.tsx; exit 1 if found`  
  **MAPS_TO_AC:** AC-2

## READING LIST

1. **components/discovery/route-pin.tsx** [PRIMARY PATTERN]  
   Lines: 1-265  
   Focus: Current react-native-maps Marker usage to eliminate

2. **components/map/mapbox-map-view.tsx**  
   Lines: 1-100  
   Focus: MapboxMapView interface and marker rendering patterns

3. **.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md**  
   Lines: 28-42  
   Focus: Map divergence (#1 client risk) and Mapbox interface facts

4. **.spec/prds/mvp/05-uc-disc.md**  
   Lines: 118-131  
   Focus: UC-DISC-06 specification — Mapbox convergence requirements and coordinate-format trap

5. **app/(app)/(tabs)/index.tsx**  
   Lines: 1-100  
   Focus: Home map using MapboxMapView — proven working pattern to mirror

## GUARDRAILS

**WRITE_ALLOWED:**
- `components/discovery/route-discovery-screen.tsx` (MODIFY) — Swap MapViewWrapper→MapboxMapView
- `components/discovery/route-pin.tsx` (MODIFY) — Drop react-native-maps Marker import, rework for Mapbox MarkerView or MapboxMarker[]
- `components/map/mapbox-map-view.tsx` (MODIFY) — Add any needed props for Discovery marker rendering

**WRITE_PROHIBITED:**
- `components/map/map-view.tsx` — do not modify the existing react-native-maps wrapper
- `app/(app)/(tabs)/index.tsx` — home map is proven working, do not modify
- Any file not explicitly listed above

## CODE PATTERN

```typescript
// BEFORE (react-native-maps pattern in route-pin.tsx):
import { Marker } from 'react-native-maps';
export function RoutePin({ coordinate, onPress, ... }) {
  return (
    <Marker coordinate={coordinate}>
      <Pressable onPress={() => onPress(routeId)}>
        {/* Pin visuals */}
      </Pressable>
    </Marker>
  );
}

// AFTER (Mapbox MarkerView pattern in route-discovery-screen.tsx):
import { MapboxMapView } from '@rnmapbox/maps';
<MapboxMapView
  style={styles.map}
  cameraPosition={{
    center: [lng, lat], // MapboxCamera.center is [lng,lat]
    zoom: 10,
  }}
>
  {markers.map((route) => (
    <Mapbox.MarkerView
      key={route.id}
      coordinate={{ latitude: route.lat, longitude: route.lng }} // MapboxMarker.coordinates is {lat,lng}
    >
      <RoutePinVisualBody
        onPress={() => handlePinPress(route.id)}
        // ... pin props
      />
    </Mapbox.MarkerView>
  ))}
</MapboxMapView>
```

## DESIGN

**References:**
- UC-DISC-06: Resolve map divergence, standardize on MapboxMapView
- 07-ui-infrastructure.md: Map divergence (#1 client risk) and Mapbox interface facts

**Interaction Notes:**
- Map is full-bleed (no SafeAreaView wrapper)
- Pin touch targets remain 44×44dp minimum
- Test pin tap hit area on both iOS and Android
- Mapbox token wiring already proven on-device

**Component Library:**
- MapboxMapView — reuse existing home map component for Discovery
- MarkerView — Mapbox's native marker rendering system
- MapboxMarker[] — array-based marker API alternative

**Pin Visuals (REUSABLE):**
- Copper circle 44×44dp body
- Archetype MaterialCommunityIcons icon (same icons as before)
- Best-mode rank badge 1–10 circular 18×18dp in top-right corner
- Nearest-mode "X.Y mi" glassmorphic pill below pin body
- Color: `semantic.color.primary.default` (copper #EE7C2B)
- Open contrast concern: copper pin on copper-tinted dark Mapbox → 1dp white stroke ring is the in-scope fix if on-device contrast fails (verified Sprint 2)

**Coordinate-Format Trap:**
- MapboxMarker.coordinates = {latitude,longitude} (Google-format)
- MapboxCamera.center = [lng,lat] (Mapbox-format)
- DO NOT transpose them — this is a critical bug to avoid

**Archetype Reconciliation:**
- RoutePin receives DB enum (twisties|mountain|coastal|adventure|scenic_byway|desert)
- Discovery screen uses UI enum (twisties|scenic|technical|cruising|sport|adventure)
- Mapping happens in DATA-002 (backend) — RoutePin just passes through what it receives

**Expo Config:**
- No Expo configuration changes required

## AGENT INSTRUCTIONS

### FOR EACH ACCEPTANCE CRITERION:

#### RED PHASE
1. READ: Current AC definition, route-pin.tsx, mapbox-map-view.tsx
2. WRITE: ONE E2E test that exercises GIVEN-WHEN-THEN on real device
3. RUN: `pnpm test components/discovery/route-pin.test.tsx`
4. VERIFY: Test FAILS (not errors — fails)
5. RETURN: { phase: "RED", test_file, test_function, failure_output }

#### GREEN PHASE
1. READ: Failing test, AC definition, MapboxMapView interface
2. WRITE: MINIMAL changes to swap to Mapbox and rework RoutePin
3. RUN: `pnpm test components/discovery/route-pin.test.tsx`
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
2. **Each AC has a test:** Test file contains one test per AC (4 tests total)
3. **All tests pass:** `pnpm test components/discovery/route-pin.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0, no type errors
5. **Lint:** `pnpm lint` → Exit 0, no lint errors
6. **Scope compliance:** `git diff --name-only` ⊆ {route-discovery-screen.tsx, route-pin.tsx, mapbox-map-view.tsx}
7. **No react-native-maps import:** `grep -n "from 'react-native-maps'" route-pin.tsx` → Exit 1 (not found)
8. **On-device build:** `pnpm client:dev` → Expo starts, Mapbox renders on real device
9. **E2E coverage:** All ACs have TEST_TIER: e2e, verified on real device
10. **Scenario is un-fakeable (PRIMARY):** AC-1 scenario asserts only MapboxMapView mounted, NEGATIVE_CONTROL would fail if react-native-maps still active

## AGENT ASSIGNMENT

**Implementer:** react-native-ui-implementer  
**Reviewer:** react-native-ui-reviewer

**Rationale:** Frontend React Native task requiring Mapbox native rendering and coordinate format correctness. Implementer converges maps and writes E2E tests; reviewer verifies single map SDK mounts and coordinates are correct.

## EVIDENCE GATES

1. **RED phase evidence:** TDD_STATE values show each test went red before green
2. **Each AC has a test:** Test file contains one test per AC (4 tests total)
3. **All tests pass:** `pnpm test components/discovery/route-pin.test.tsx` → Exit 0
4. **Type check:** `pnpm type-check` → Exit 0
5. **Lint:** `pnpm lint` → Exit 0
6. **Scope compliance:** `git diff --name-only` ⊆ writeAllowed
7. **No react-native-maps:** `grep -n "from 'react-native-maps'" route-pin.tsx` → Exit 1
8. **On-device build:** `pnpm client:dev` → Expo starts
9. **E2E coverage:** All ACs have TEST_TIER: e2e
10. **Scenario is un-fakeable (PRIMARY):** AC-1 asserts only Mapbox mounted

## REVIEW CRITERIA

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence present in TDD_STATE history
- Minimal implementation; no gold-plating
- Pattern consistent with READING LIST (home map Mapbox usage)
- SCOPE respected (git diff --name-only ⊆ writeAllowed)
- react-native-maps Marker import fully removed (grep test passes)
- All ACs verified on real device with Mapbox rendering

**Should verify:**
- Coordinate formats not transposed (camera center vs marker coordinates)
- Pin tap handlers work correctly
- Visuals render as expected (copper circles, icons, badges)

**Verdict:** [APPROVED | NEEDS_FIXES]

## DEPENDENCIES

**Depends on:**
- None (map convergence is independent of backend work)

**Blocks:**
- None

**Parallel:**
- DISC-002, DISC-003 (map convergence can happen in parallel with hook and screen wiring)

## NOTES

**Independent Task:**
- This task can run in parallel with DISC-002 and DISC-003
- Does not depend on backend work (DATA-005)
- Does not depend on hook being wired (DISC-002)
- Does not depend on screen being live (DISC-003)

**Design Enrichments (from frontend-designer):**
- **Pin visuals REUSABLE:** Copper circle 44×44dp + archetype MaterialCommunityIcons icon + best-mode rank badge 1–10 circular 18×18dp + nearest-mode "X.Y mi" glassmorphic pill — only the `react-native-maps` `Marker` wrapper is dropped
- **Pin color:** `semantic.color.primary.default` (copper)
- **Open contrast concern:** Copper pin on copper-tinted dark Mapbox → 1dp white stroke ring is the in-scope fix if on-device contrast fails (verified Sprint 2)
- **Coordinate trap:** MapboxMarker.coordinates={latitude,longitude} vs MapboxCamera.center=[lng,lat]

**Coordinate-Format Details:**
- MapboxMapView uses two different coordinate formats:
  - `MapboxCamera.center = [lng, lat]` (GeoJSON-style, longitude first)
  - `MapboxMarker.coordinates = {latitude, longitude}` (Google-style, lat first)
- This is a common source of bugs — pins end up in the ocean if swapped
- The home screen (index.tsx) already uses MapboxMapView correctly — mirror that pattern

**testIDs Carried:**
- route-pin-{routeId} (each pin gets unique testID for E2E testing)

**Verification on Real Device:**
- All ACs require real device testing (iOS + Android)
- Mapbox rendering is device-specific and cannot be tested in headless environments
- Primary AC asserts single map SDK mounted (no dual SDK footgun)

**Fixtures Shared Across Tasks:**
- `founder_location`: useCurrentLocation returns lat ~39.7-40.4, lng ~-105.0 to -105.8
- `known_route_with_polyline`: Route with verified centroid (e.g., 'Trail Ridge Road' at ~40.4, -105.8)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "Discovery pins are rendered by MapboxMapView (same engine as home map) with no react-native-maps map mounted on the screen",
      "verify": "pnpm test components/discovery/route-pin.test.tsx --grep 'mapboxRendersDiscoveryPins'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS device + real Android device (Mapbox native rendering)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "react-native-maps_mounted", "static"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen on real device", "Inspect native map instance via device logs or rendering"] },
            "end_state": {
              "must_observe": ["Only MapboxMapView is mounted (Mapbox native SDK)", "No react-native-maps Google Maps instance active on Discovery screen"],
              "must_not_observe": ["MapViewWrapper or react-native-maps instance mounted", "Two native map SDKs running simultaneously"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "RoutePin visuals (copper circle, archetype icon, rank badge, distance label) render without importing Marker from react-native-maps",
      "verify": "pnpm test components/discovery/route-pin.test.tsx --grep 'routePinVisualsWorkWithoutReactNativeMaps'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (Mapbox native rendering)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "react-native-maps_import"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Inspect route pins on map"] },
            "end_state": {
              "must_observe": ["Copper circle pins (44x44dp) with archetype icons", "Rank badges (1-10) in top-right corner when sort=Best", "Distance labels below pins when sort=Nearest"],
              "must_not_observe": ["Missing pin visuals", "No icons or badges", "Broken pin layout"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Tapping a Mapbox pin opens the detail handler with the correct routeId on a real device",
      "verify": "pnpm test components/discovery/route-pin.test.tsx --grep 'pinTapOpensDetail'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (Mapbox native rendering)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "broken_onPress"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "founder_location",
            "action": { "actor": "user", "steps": ["Open Discovery screen", "Tap a route pin"] },
            "end_state": {
              "must_observe": ["Detail screen opens with correct routeId (matching tapped pin)", "Navigation stack pushes detail route"],
              "must_not_observe": ["No response to tap", "Wrong routeId passed to detail", "Navigation not triggered"]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "Camera center is passed as [lng,lat] and marker coordinates as {latitude,longitude} without transposition",
      "verify": "pnpm test components/discovery/route-pin.test.tsx --grep 'coordinateFormatsCorrect'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device (Mapbox native rendering)",
        "negative_control": { "would_fail_if": ["disconnect", "stub", "transposed_coords"] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [
          {
            "start_ref": "known_route_with_polyline",
            "action": { "actor": "user", "steps": ["Open Discovery screen with known route", "Inspect pin position vs expected coordinates"] },
            "end_state": {
              "must_observe": ["Pin renders at correct location matching route centroid", "Camera centers correctly on user location or bbox"],
              "must_not_observe": ["Pin in ocean (swapped lat/lng)", "Camera in wrong hemisphere", "Pin offset from expected position"]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All 4 AC tests pass on real device",
      "verify": "pnpm test components/discovery/route-pin.test.tsx",
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
      "description": "No react-native-maps Marker import in RoutePin",
      "verify": "grep -n \"from 'react-native-maps'\" components/discovery/route-pin.tsx; exit 1 if found",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
