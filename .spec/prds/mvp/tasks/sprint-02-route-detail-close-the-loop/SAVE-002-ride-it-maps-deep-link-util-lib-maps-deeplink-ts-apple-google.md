# SAVE-002: Ride-It maps deep-link util lib/maps-deeplink.ts (Apple Maps iOS / Google Maps Android via expo-linking; web fallback)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** S · **Estimate:** 90 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

`openRouteInMaps({lat,lng,name})` hands a route centroid+name to the platform native maps app (Apple Maps on iOS, Google Maps on Android) with a web fallback when the native scheme is unavailable, and a graceful no-op on null centroid — no new dependency.

## Specification

NEW `lib/maps-deeplink.ts` exporting `openRouteInMaps({lat,lng,name})`. iOS → Apple Maps URL (`http://maps.apple.com/?ll={lat},{lng}&q={encodedName}` or `maps://`). Android → Google Maps (`google.navigation:q={lat},{lng}` or `geo:{lat},{lng}?q=label`). Select via `Platform.OS`. Use `expo-linking` `Linking.canOpenURL` → if false, fall back to a web maps URL (`https://maps.google.com/?q={lat},{lng}`). NO new dependency (expo-linking ~8.0.11 already installed).

## Critical Constraints

- MUST use the real expo-linking `Linking` on the simulator in the PRIMARY e2e — never mock it.
- MUST select scheme by `Platform.OS`; MUST fall back to maps.google.com when `canOpenURL` is false.
- MUST be a graceful no-op (no crash) on null centroid.
- NEVER add a new dependency. NEVER mock expo-linking in the PRIMARY.
- iOS form `http(s)://maps.apple.com/?ll=...`; Android `google.navigation:q=...` or `geo:...`; web `https://maps.google.com/?q=...`.

## Acceptance Criteria

### AC-1: iOS opens Apple Maps with centroid+name
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-SAVE-02/ios`
- **GIVEN** the app on a real iOS simulator, centroid {40.6,-111.6}, name 'Wasatch Ridge Loop'
- **WHEN** Ride-It invokes `openRouteInMaps`
- **THEN** Linking.openURL call count == 1; opened URL contains 'maps.apple.com'; contains 'll=40.6,-111.6'; contains 'q=Wasatch%20Ridge%20Loop'
- **Test tier:** `e2e` · **Service:** real iOS simulator + live Convex dev
- **Verify:** `pnpm test lib/maps-deeplink.e2e.test.ts`
- **Scenario** (start `ios_sim`): must observe openURL count == 1, host 'maps.apple.com', ll + q params; must NOT observe maps.google.com as PRIMARY / crash; would fail if expo-linking mocked / Linking disconnected / empty centroid.

### AC-2: Android opens Google Maps
- **flow_ref:** `.spec/scenarios/UC-SAVE-02/android`
- **GIVEN** the app on a real Android emulator, same centroid+name
- **WHEN** Ride-It invokes `openRouteInMaps`
- **THEN** Linking.openURL call count == 1; opened URL matches 'google.navigation:q=40.6,-111.6' OR 'geo:40.6,-111.6'
- **Test tier:** `e2e` · **Service:** real Android emulator + live Convex dev
- **Verify:** `pnpm test lib/maps-deeplink.e2e.test.ts`
- **Scenario** (start `android_emu`): must observe openURL count == 1, Google Maps scheme; must NOT observe maps.apple.com; would fail if expo-linking mocked / Apple Maps URL on Android.

### AC-3: native scheme unavailable → web fallback
- **flow_ref:** `.spec/scenarios/UC-SAVE-02/fallback`
- **GIVEN** `Linking.canOpenURL` returns false for the native scheme
- **WHEN** `openRouteInMaps` is invoked
- **THEN** opened URL host == 'maps.google.com'; URL contains 'q=40.6,-111.6'
- **Test tier:** `e2e` · **Service:** real iOS/Android simulator + live Convex dev
- **Verify:** `pnpm test lib/maps-deeplink.e2e.test.ts`
- **Scenario** (start `native_unavailable`): must observe host 'maps.google.com', centroid in query; must NOT observe native-only scheme / crash; would fail if no fallback branch / canOpenURL mocked always true.

### AC-4: null centroid → graceful no-op
- **flow_ref:** `.spec/scenarios/UC-SAVE-02/error`
- **GIVEN** `openRouteInMaps({lat:null,lng:null,name:'X'})`
- **WHEN** invoked
- **THEN** Linking.openURL call count == 0; openRouteInMaps return value == null (no crash)
- **Test tier:** `e2e` · **Service:** real iOS/Android simulator + live Convex dev
- **Verify:** `pnpm test lib/maps-deeplink.e2e.test.ts`
- **Scenario** (start `null_centroid_input`): must observe openURL count == 0, return null; must NOT observe crash / malformed URL; would fail if uncaught null deref.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | E2e iOS: openRouteInMaps builds Apple Maps URL (maps.apple.com, ll, q) + openURL. | AC-1 | `pnpm test lib/maps-deeplink.e2e.test.ts` |
| TC-2 | E2e Android: builds Google Maps URL + openURL. | AC-2 | same |
| TC-3 | E2e fallback: canOpenURL false → maps.google.com. | AC-3 | same |
| TC-4 | E2e error: null centroid → no openURL, no crash. | AC-4 | same |

## Reading List

- `package.json` — confirm expo-linking ~8.0.11 installed (no new dep)
- `.spec/prds/mvp/07-uc-save.md`#uc-save-02 · `.spec/scenarios/UC-SAVE-02/`

## Guardrails

- WRITE-ALLOWED: `lib/maps-deeplink.ts (NEW)` · `lib/maps-deeplink.e2e.test.ts (NEW)`
- WRITE-PROHIBITED: `convex/**` · `app/**` (callers wired by DESIGN-004)

## Design

- ref: `.spec/prds/mvp/07-uc-save.md`#uc-save-02 · `.spec/scenarios/UC-SAVE-02/`
- pattern: pure util + Linking integration, Platform-conditional with web fallback.
- pattern_source: expo-linking docs, RN Platform.OS.
- anti_pattern: adding a maps SDK dependency; mocking Linking in the PRIMARY.
- interaction notes: Platform.OS selects scheme; web fallback via Linking.canOpenURL. *(No dedicated frontend-designer enrichment — util has no visual surface; DESIGN-004 owns the button affordance that calls it.)*

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| E2E | `pnpm test lib/maps-deeplink.e2e.test.ts` |
| Biome | `pnpm exec biome check lib/maps-deeplink.ts` |

## Coding Standards

- Pure typed function; RED→GREEN→REFACTOR per AC.

## Dependencies

- Depends on: (none)
- Blocks: DESIGN-004

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "SAVE-002",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "ios_sim": { "description": "app on real iOS simulator against live Convex, centroid {40.6,-111.6} name 'Wasatch Ridge Loop'", "seed_method": "ui_flow", "records": ["iOS simulator expo-linking available centroid 40.6,-111.6"] },
    "android_emu": { "description": "app on real Android emulator against live Convex", "seed_method": "ui_flow", "records": ["Android emulator expo-linking available"] },
    "native_unavailable": { "description": "native maps scheme unavailable (Linking.canOpenURL false)", "seed_method": "ui_flow", "records": ["canOpenURL false for native maps scheme"] },
    "null_centroid_input": { "description": "openRouteInMaps called with null centroid", "seed_method": "ui_flow", "records": ["{lat:null,lng:null,name:'X'}"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN iOS + centroid+name WHEN openRouteInMaps is called THEN an Apple Maps URL with ll+q is built and Linking.openURL is invoked.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN Android + centroid+name WHEN openRouteInMaps is called THEN a Google Maps URL is built and Linking.openURL is invoked.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN canOpenURL is false WHEN openRouteInMaps is called THEN it falls back to a maps.google.com web URL.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a null centroid WHEN openRouteInMaps is called THEN it is a graceful no-op (no openURL, no crash).", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "iOS Apple Maps URL + openURL.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Android Google Maps URL + openURL.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Web fallback when canOpenURL false.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Null centroid graceful no-op.", "verify": "pnpm test lib/maps-deeplink.e2e.test.ts", "maps_to_ac": "AC-4" }
  ]
}
-->
