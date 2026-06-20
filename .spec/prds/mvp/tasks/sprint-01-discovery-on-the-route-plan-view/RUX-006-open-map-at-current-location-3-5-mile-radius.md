# RUX-006: Open the map centered on the rider's current location at a 3–5 mile radius (zoom ~11, not 14)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** S · **Estimate:** 90 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Two pure-frontend edits inside the `initialCamera` memo (`index.tsx:218-246`): (1) the current-location branch hardcodes `zoom: 14` (~0.35 mi radius) — change to a named `CURRENT_LOCATION_OPEN_ZOOM = 11` (~3–5 mi radius); (2) the saved camera slot is returned BEFORE the live-location branch, so a returning rider opens on a stale default slot, not current location — reorder so live location beats the *default* slot on a cold open (session-slot precedence preserved). No new state, no new effect, no Convex.

> **Remedial — Sprint 1 testing feedback (2026-06-20, item #1):** "the app doesn't open on your current location at the 3-5 mile radius." (Image #1)

## Outcome

On a fresh cold open with location permission granted, the map mounts centered on the rider's current location framed at a 3–5 mile radius (zoom ~11) — not the street-level z14 view and not the continental fallback. A returning rider with no active session opens at current location rather than a stale saved default.

## Specification

`index.tsx:218-246` `initialCamera` memo: the `currentLocation` branch builds `{ center: [lng, lat], zoom: 14 }` (line 231). Web-Mercator math: at ~37°N a ~390pt-wide phone shows ≈0.7 mi diameter at z14 (≈0.35 mi radius); a 3–5 mi *radius* (6–10 mi diameter) ≈ **zoom 11** (z12≈2.8mi, z11≈5.6mi diameter). Add a named constant `CURRENT_LOCATION_OPEN_ZOOM = 11` beside `DEFAULT_MAPBOX_CAMERA` (index.tsx:74) and use it in the current-location branch; fix the misleading "zoom 14 (~3-mi radius)" comment (index.tsx:162-163). Separately, the memo returns `sessionSlot ?? defaultCameraSlot` (lines 220-227) BEFORE the `currentLocation` branch, so a returning rider opens on the persisted default slot. Reorder so: **sessionSlot (explicit resume) → currentLocation (cold open) → defaultCameraSlot (only when no live location) → DEFAULT_MAPBOX_CAMERA (denied/unavailable)**. Do NOT touch the `initialCameraReady` mount gate (line 249), the 8s hard cap (165-169), `useCurrentLocation` (use-current-location.ts), or `DEFAULT_MAPBOX_CAMERA` — those are correct.

## Critical Constraints

- **MUST** open the current-location branch at `CURRENT_LOCATION_OPEN_ZOOM` (~11, a 3–5 mi radius), not `14`; the constant must be named (no magic number) and reused.
- **MUST** prefer a freshly-resolved `currentLocation` over the *default* saved camera slot on a cold open with no active session; **MUST** preserve *session-slot* precedence (an explicit session resume still wins).
- **NEVER** rebuild the location-hold / fallback machinery (`initialCameraReady`, 8s cap, `DEFAULT_MAPBOX_CAMERA`) — only the zoom level and the default-slot ordering change. **NEVER** add a new effect/state or animate the open (keep `animationMode: 'none'`).

## Acceptance Criteria

### AC-1: Map opens on current location at a 3–5 mile radius (real device)
*(PRIMARY)*
- **GIVEN** a fresh install (clearState) with the simulator location set to a known city and location permission granted
- **WHEN** the signed-in home opens
- **THEN** the map is centered on that location showing a 3–5 mile radius (zoom ~11), not a street-level (~0.35 mi) view and not the continental fallback
- **Test tier:** `e2e` · **Service:** dev client + live Convex dev + Simulator location
- **Verify:** `maestro test .maestro/rux-006-open-at-current-location.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD`

### AC-2: initialCamera derives current location at the 3–5 mi zoom (wiring)
*(SUPPLEMENTARY)*
- **GIVEN** `useCurrentLocation` resolves a known `{lat,lng}` and the camera store has NO session slot
- **WHEN** the screen mounts
- **THEN** `MapboxMapView` receives `initialCamera = { center: [lng, lat], zoom: 11 }`
- **Test tier:** `integration` (jsdom; Convex+RN mocked per harness reality — see Notes) · **Service:** @testing-library/react-native with a camera-capture ref on the rnmapbox mock
- **Verify:** `pnpm test "app/(app)/(tabs)/index.open-camera.integration.test.tsx" -t opensAtCurrentLocationThreeToFiveMiRadius`

### AC-3: current location beats a stale default slot on cold open
*(SUPPLEMENTARY)*
- **GIVEN** a saved `defaultCamera` slot AND a freshly resolved `currentLocation`, no active session
- **WHEN** the screen mounts
- **THEN** the current location is used (`initialCamera.center` === resolved location), not the saved default slot
- **Test tier:** `integration` (jsdom; mocked per harness reality) · **Service:** @testing-library/react-native
- **Verify:** `pnpm test "app/(app)/(tabs)/index.open-camera.integration.test.tsx" -t currentLocationBeatsStaleDefaultSlotOnColdOpen`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | On a real device, the home opens framed to a ~5-mile span around the set location (screenshot). | AC-1 | `maestro test .maestro/rux-006-open-at-current-location.yaml` |
| TC-2 | `initialCamera` passed to MapboxMapView has `zoom === 11` and `center` === resolved location. | AC-2 | `pnpm test "app/(app)/(tabs)/index.open-camera.integration.test.tsx" -t opensAtCurrentLocationThreeToFiveMiRadius` |
| TC-3 | With a saved default slot + live location and no session, current location wins. | AC-3 | `pnpm test "app/(app)/(tabs)/index.open-camera.integration.test.tsx" -t currentLocationBeatsStaleDefaultSlotOnColdOpen` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (218-246) — `initialCamera` memo: zoom literal at 231; slot precedence at 220-227 (edit both)
- `app/(app)/(tabs)/index.tsx` (74-77) — `DEFAULT_MAPBOX_CAMERA`; add `CURRENT_LOCATION_OPEN_ZOOM = 11` beside it
- `app/(app)/(tabs)/index.tsx` (162-169, 249) — the 8s hold cap + `initialCameraReady` gate (DO NOT change; read to avoid regressions)
- `hooks/use-current-location.ts` (11-36) — one-shot location resolve (DO NOT change)
- `components/map/mapbox-map-view.tsx` (571-583) — `defaultSettings`/`animationMode:'none'` consumes `initialCamera` (read; handle is correct)
- `__mocks__/rnmapbox-maps.ts` — add an additive camera-capture ref/spy for AC-2/AC-3 (shared infra)
- `.maestro/discovery-full-gate.yaml` — pattern for sign-in via `e2e-test-login-button` + clearState + screenshot (mirror for the new flow)

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx`, `.maestro/rux-006-open-at-current-location.yaml` (NEW), `app/(app)/(tabs)/index.open-camera.integration.test.tsx` (NEW), `__mocks__/rnmapbox-maps.ts` (additive camera-capture only)
**WRITE-PROHIBITED:** `components/map/mapbox-map-view.tsx`, `hooks/use-current-location.ts`, `lib/get-current-location.ts`, `stores/chat-session-store.ts`, `convex/**`

## Design

- No DESIGN spec required — pure camera-parameter + precedence fix; no new UI surface, component, or visual-language change.
- **Pattern:** named open-zoom constant + ordered precedence (session → live location → default slot → continental fallback).
- **Anti-pattern:** the magic `zoom: 14` literal and slot-before-location ordering.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test "app/(app)/(tabs)/index.open-camera.integration.test.tsx"` |
| e2e | `maestro test .maestro/rux-006-open-at-current-location.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-2 test must FAIL on the current zoom:14 literal (and AC-3 on the slot-before-location order) before the change makes them pass` |
| human_gate | `On-device (real iOS, fresh install, sim location = a known city): app opens centered on that city at a 3–5 mile span — not street-level, not whole-country` |

## Coding Standards

- Name the zoom constant (`CURRENT_LOCATION_OPEN_ZOOM`); no magic number; one source of truth reused in the memo.
- Keep the camera-capture mock edit additive — must not break existing suggestions/footer tests that import `__mocks__/rnmapbox-maps.ts`.
- Constrain the precedence change to default-slot-vs-current-location; preserve session-slot resume.

## Dependencies

- Depends on: (none)
- Coordinates with: RUX-002 / RUX-007 / RUX-008 (all touch `index.tsx` — distinct regions; if serializing, land RUX-006 after RUX-002, the larger index.tsx change). One of RUX-006/RUX-008 adds the shared `__mocks__/rnmapbox-maps.ts` camera spy; the other reuses it.

## Notes

**Harness reality (carry into the test plan):** this repo's vitest aliases Convex `_generated/*` to `__mocks__/convex/*` (vitest.config.ts:150-162) and stubs `@rnmapbox/maps` without an imperative handle (vitest.config.ts:195). So the vitest tier is jsdom + mocked Convex — it can assert the derived `initialCamera` prop (AC-2/AC-3) via an additive camera-capture ref on the mock, but it cannot exercise live Convex or real camera framing. The genuine "watched it open for real" tier is the Maestro e2e flow (AC-1) against the dev client + live Convex dev with a simulated device location. Zoom 11 is a calculated estimate; the on-device screenshot is the human check — if the founder wants tighter/looser it is a one-constant tweak.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "fresh_install_known_sim_location": {
      "description": "fresh install (clearState), simulator location set to a known city, location permission granted, signed in via e2e-test-login-button",
      "seed_method": "maestro_device_state",
      "records": [ "Simulator location = known lat/lng", "no saved camera slot (fresh install)" ]
    },
    "resolved_location_no_session_slot": {
      "description": "useCurrentLocation resolves a known {lat,lng}; camera store hydrated with NO session slot and (for AC-3) a stale defaultCamera slot",
      "seed_method": "test_harness_props",
      "records": [ "currentLocation = {lat,lng}", "cameraBySession empty", "defaultCameraSlot = a stale slot (AC-3 only)" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a fresh install with sim location set WHEN the signed-in home opens THEN the map is centered on that location at a 3-5 mile radius (zoom ~11), not street-level and not continental fallback",
      "verify": "maestro test .maestro/rux-006-open-at-current-location.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD",
      "scenario": {
        "start_ref": "fresh_install_known_sim_location", "tier": "visible", "test_tier": "e2e",
        "verification_service": "dev client + live Convex dev + Simulator location",
        "negative_control": { "would_fail_if": [
          "the screenshot shows the z14 single-block framing (current bug)",
          "the screenshot shows the continental US fallback (location never resolved)",
          "chat-input never appears (home did not load)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "fresh_install_known_sim_location",
          "action": { "actor": "user", "steps": [
            "launch dev client with clearState and sim location set",
            "sign in via e2e-test-login-button",
            "wait for chat-input visible",
            "capture screenshot 01-open-radius"
          ] },
          "end_state": {
            "must_observe": [ "chat-input visible (home loaded)", "screenshot shows the set city centered with multi-mile context (recognizable ~5-mi span)" ],
            "must_not_observe": [ "continental/whole-country framing", "street-level single-block framing" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN resolved location and no session slot WHEN the screen mounts THEN MapboxMapView receives initialCamera = {center:[lng,lat], zoom:11}",
      "verify": "pnpm test \"app/(app)/(tabs)/index.open-camera.integration.test.tsx\" -t opensAtCurrentLocationThreeToFiveMiRadius",
      "scenario": {
        "start_ref": "resolved_location_no_session_slot", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native + additive camera-capture ref on the rnmapbox mock (Convex+RN mocked per harness reality)",
        "negative_control": { "would_fail_if": [
          "zoom === 14 (the current literal at index.tsx:232)",
          "center === DEFAULT_MAPBOX_CAMERA while a live location exists"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "resolved_location_no_session_slot",
          "action": { "actor": "system", "steps": [ "mount the screen with a resolved currentLocation and empty session slots", "capture the initialCamera prop passed to MapboxMapView" ] },
          "end_state": {
            "must_observe": [ "initialCamera.zoom === 11", "initialCamera.center === [resolved lng, resolved lat]" ],
            "must_not_observe": [ "initialCamera.zoom === 14", "initialCamera.center === DEFAULT_MAPBOX_CAMERA center" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a saved default slot + live location, no session WHEN the screen mounts THEN current location is used, not the stale default slot",
      "verify": "pnpm test \"app/(app)/(tabs)/index.open-camera.integration.test.tsx\" -t currentLocationBeatsStaleDefaultSlotOnColdOpen",
      "scenario": {
        "start_ref": "resolved_location_no_session_slot", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native (mocked per harness reality)",
        "negative_control": { "would_fail_if": [
          "initialCamera.center === the saved default slot (current memo order returns the slot first, index.tsx:220-227)",
          "session-slot precedence is broken (an explicit session resume no longer wins)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "resolved_location_no_session_slot",
          "action": { "actor": "system", "steps": [ "mount with a stale defaultCameraSlot + resolved currentLocation + no active session", "read initialCamera.center" ] },
          "end_state": {
            "must_observe": [ "initialCamera.center === resolved location" ],
            "must_not_observe": [ "initialCamera.center === saved default slot center" ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Real-device open frames a ~5-mile span around the set location.", "maps_to_ac": "AC-1", "verify": "maestro test .maestro/rux-006-open-at-current-location.yaml" },
    { "id": "TC-2", "type": "test_criterion", "description": "initialCamera zoom===11 and center===resolved location.", "maps_to_ac": "AC-2", "verify": "pnpm test \"app/(app)/(tabs)/index.open-camera.integration.test.tsx\" -t opensAtCurrentLocationThreeToFiveMiRadius" },
    { "id": "TC-3", "type": "test_criterion", "description": "Current location beats a stale default slot on cold open.", "maps_to_ac": "AC-3", "verify": "pnpm test \"app/(app)/(tabs)/index.open-camera.integration.test.tsx\" -t currentLocationBeatsStaleDefaultSlotOnColdOpen" }
  ]
}
-->
