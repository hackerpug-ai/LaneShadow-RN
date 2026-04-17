# Sprint 5: Turn-by-Turn Navigation

**Sequence:** 5
**Status:** Planned

## Overview

Wire Sprint-2 map and overlay components (plus the navigation-specific components delivered via the Sprint 2 delta) into native Mapbox Navigation SDK event streams, ride-flow state transitions, and local session persistence. This sprint does **not** build new presentational components — it consumes them and drives them with real GPS, voice, deviation, and lifecycle data.

## Human Testing Gate

**Gate:** A rider can select a route, start navigation, and the underlying session state (GPS lock, voice guidance, deviation detection, pause/resume, end) transitions correctly and persists across backgrounding — verified via state inspection and event logs, not UI rendering.

## Human Test Deliverable

Both native apps emit valid navigation session state transitions from real Mapbox SDK event streams, with local session persistence, voice-guidance mute state, and deviation/reroute state handled per PRD. UI rendering is covered by Sprint 2 component tests; this sprint verifies the data wiring behind those components.

## Human Test Steps

1. Start navigation on Android and confirm the GPS-acquisition state machine reaches `ready` before transitioning to `navigating` (inspect session state + event log).
2. Start navigation on iOS and confirm the same GPS-acquisition state transition occurs, with background location mode active.
3. Follow an active route and confirm Mapbox maneuver events, distance countdown values, and telemetry (speed, ETA, distance remaining) flow into the session store on both platforms.
4. Toggle mute and confirm the voice-guidance engine suspends/resumes audio output while visual maneuver data continues to update in the session store.
5. Force a route deviation and confirm the session transitions through `deviating → rerouting → navigating` (or `rerouting-failed`) per PRD.
6. Pause, resume, and end navigation and confirm ride-flow state transitions match `17-state-convex-architecture.md`; confirm crash-safe restoration rehydrates the last known session on relaunch.

## Source Coverage

- `09-uc-navigation.md`
- `15-uc-ride-flow.md`
- `17-state-convex-architecture.md`

## Dependencies

- Sprint 2: Design System — specifically `UI-MapViewWrapper`, `UI-MapControls`, `UI-OverlayPill`, `UI-RoutePolyline`, `UI-MapHeaderOverlay`, `UI-StatRow`, `UI-Progress`, `UI-Button`, `UI-Banner`, `UI-SubpageLayout`, `UI-RouteThumbnail` (existing 08a atoms/molecules/organisms), **plus the Sprint 2 delta components** listed under each task's `Components Consumed` section
- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison

## Blocks

- Sprint 6: Ride Recording and Saved Rides
- Sprint 8: Voice Assistant
- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| NAV-001 | Define shared navigation session models, guards, and local persistence | worker | 0.5 day |
| NAV-002 | Wire Android Mapbox Navigation SDK event stream + foreground service into session store | kotlin-implementer | 1.5 days |
| NAV-003 | Wire iOS Mapbox Navigation SDK event stream + background location mode into session store | swift-implementer | 1.5 days |
| NAV-004 | Wire Sprint-2 maneuver, metrics, and mute UI components into the navigation session event stream | frontend-designer | 0.5 day |
| NAV-005 | Wire deviation detection + reroute handling into the session state machine and recovery UI | worker | 0.5 day |
| NAV-006 | Wire pause, resume, and end-navigation state transitions into ride-flow store and overlays | kotlin-implementer | 0.5 day |
| NAV-007 | Wire navigation error handling and crash-safe session restoration into error dialogs and OS notifications | swift-implementer | 0.5 day |

---

### NAV-001: Define shared navigation session models, guards, and local persistence

Define the TypeScript/Kotlin/Swift session schema, state-machine guards, and local persistence layer (AsyncStorage / DataStore / UserDefaults) that NAV-002..007 all consume. No UI work.

**Components Consumed:** None (pure data/state layer)

**Source:** `09-uc-navigation.md` (all UC-NAV-0x state fields), `17-state-convex-architecture.md`

---

### NAV-002: Wire Android Mapbox Navigation SDK event stream + foreground service into session store

Integrate the Android Mapbox Navigation SDK, register a foreground service for background location, and pipe SDK events (maneuver updates, progress, off-route, arrival) into the shared session store defined in NAV-001. No UI-building; existing Sprint-2 components consume the store.

**Components Consumed:**
- `MapViewWrapper` (Sprint 2, 08a organism) — base map canvas
- `MapControls` (Sprint 2, 08a molecule) — zoom/recenter
- `RoutePolyline` (Sprint 2, 08a) — active route rendering
- `NavigationStartScreen` (pending Sprint 2 delta) — start-of-nav scaffolding screen
- `GpsAcquisitionOverlay` (pending Sprint 2 delta) — GPS lock modal

**Source:** UC-NAV-01, UC-NAV-07

---

### NAV-003: Wire iOS Mapbox Navigation SDK event stream + background location mode into session store

iOS counterpart to NAV-002. Configure background location mode, register for Mapbox Navigation SDK callbacks, and pipe events into the shared session store.

**Components Consumed:**
- `MapViewWrapper` (Sprint 2, 08a organism)
- `MapControls` (Sprint 2, 08a molecule)
- `RoutePolyline` (Sprint 2, 08a)
- `NavigationStartScreen` (pending Sprint 2 delta)
- `GpsAcquisitionOverlay` (pending Sprint 2 delta)

**Source:** UC-NAV-01, UC-NAV-07

---

### NAV-004: Wire Sprint-2 maneuver, metrics, and mute UI components into the navigation session event stream

Wire Sprint-2 `MapViewWrapper` + `MapControls` + `OverlayPill` + (pending delta) `TurnInstructionCard` + `Speedometer` + `NavigationMetricsBar` into the Mapbox Navigation SDK event stream from UC-NAV-02 / UC-NAV-04. Binds maneuver data, distance countdown, speed, ETA, and mute-toggle state from the session store into the existing presentational components — **no new component construction**.

**Components Consumed:**
- `MapViewWrapper` (Sprint 2, 08a organism)
- `MapControls` (Sprint 2, 08a molecule)
- `OverlayPill` (Sprint 2, 08a molecule) — distance countdown / street-name pill
- `MapHeaderOverlay` (Sprint 2, 08a)
- `TurnInstructionCard` (pending Sprint 2 delta) — maneuver card with lane guidance
- `Speedometer` (pending Sprint 2 delta) — radial speed gauge with speed-limit color state
- `NavigationMetricsBar` (pending Sprint 2 delta) — bottom bar composing Speedometer + StatRow + ETA

**Source:** UC-NAV-02, UC-NAV-04

---

### NAV-005: Wire deviation detection + reroute handling into the session state machine and recovery UI

Hook the SDK's off-route callbacks into the `deviating → rerouting → navigating | rerouting-failed` state transitions from NAV-001. Drive the pending-delta failure dialog off `rerouting-failed` state.

**Components Consumed:**
- `OverlayPill` (Sprint 2, 08a) — deviation status pill
- `MapViewWrapper` (Sprint 2, 08a)
- `ReroutingFailureDialog` (pending Sprint 2 delta) — two-action failure modal

**Source:** UC-NAV-03

---

### NAV-006: Wire pause, resume, and end-navigation state transitions into ride-flow store and overlays

Implement the pause/resume/end transitions in the ride-flow state machine and bind the paused-state overlay pill + completion screen to those states. Kotlin-implementer owns the cross-platform state wiring; iOS consumes the same shared session module from NAV-001.

**Components Consumed:**
- `OverlayPill` (Sprint 2, 08a) — pause-state pill
- `MapViewWrapper` (Sprint 2, 08a)
- `SubpageLayout` (Sprint 2, 08a)
- `RouteThumbnail` (Sprint 2, 08a)
- `StatRow` (Sprint 2, 08a)
- `RideCompletionScreen` (pending Sprint 2 delta) — post-ride summary screen

**Source:** UC-NAV-05, UC-NAV-06, `15-uc-ride-flow.md`

---

### NAV-007: Wire navigation error handling and crash-safe session restoration into error dialogs and OS notifications

Hook SDK/system errors (GPS unavailable, low battery, audio focus loss) into a parameterized error-dialog binding, and implement crash-safe restoration that rehydrates the persisted session on relaunch. Wire the OS-notification template for background navigation.

**Components Consumed:**
- `NavigationErrorDialog` (pending Sprint 2 delta) — parameterized two-action nav error dialog
- `NavigationNotification` (pending Sprint 2 delta) — OS notification content template
- `MapViewWrapper` (Sprint 2, 08a) — restored map state on foreground return
- `Banner` (Sprint 2, 08a) — transient error surface for non-blocking conditions

**Source:** UC-NAV-07, UC-NAV-08
