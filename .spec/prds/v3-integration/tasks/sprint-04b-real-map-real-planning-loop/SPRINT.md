# Sprint 04-B: Real Map, Real Planning Loop

**Sequence:** 4-B (remediation sprint inserted after Sprint 04 round-4 closure failure)
**Timeline:** Phase 2 · Week 4-B (overlaps Sprint 05 prep; same human gate as Sprint 04)
**Status:** Planning — task expansion in progress 2026-05-04

## Why this sprint exists

Sprint 04 declared the conversational planning loop "code-complete" through 4 rounds of remediation, but **the running app is still mocks all the way down**:

- **iOS `IdleScreen`** renders `LSPaperMap` — a stylised illustration drawn in SwiftUI. There is no Mapbox tile, no user location, no real map after login.
- **iOS `PlanningScreen`** calls `LSMap(mode: .preview, camera: defaultCamera /* hardcoded San Francisco */, polylines: [], annotations: [])`. Every planning view shows downtown SF with zero polylines.
- **iOS `RouteResultsScreen` / `RouteDetailsScreen`** are constructed from `RouteDetailsMockProvider` / `PlanningMockProvider` static state.
- **Android `IdleScreen`** does load real Mapbox tiles, but the camera is hardcoded to `LatLng(37.8104, -122.4752), zoom 10.8` and ignores the rider entirely. All other Android screens still consume `com.laneshadow.sandbox.mockproviders.*` data.
- **iOS XCUITest** uses `bypassAuthForTesting` instead of real Clerk; the "real Clerk" remediation (RF-38) only swapped the lever, not the lock — the app still runs with synthesised auth on simulator.
- **Convex `actions/agent/planRide.ts`** reaches the Google Routes API, but the route options stored on `db.routePlans` are not consumed by mobile because the templates above ignore them entirely.

Result: the eight human-gate steps from Sprint 04 cannot be performed by a human. The simulator screenshots that "passed" the round-4 review showed a stylised paper map and a static SF skyline — not a route.

Sprint 04-B replaces every mocked surface with real production wiring and ships the eight gate steps end-to-end on a real iPhone and a real Android device.

## Human Testing Gate (unchanged from Sprint 04)

A rider can plan a real route end-to-end via chat and see three live polylines on RouteResults — tap a suggestion chip on IdleScreen, watch the Navigator agent stream a real route plan through the PlanningScreen phase indicator, see three live polylines (best/alt1/alt2) materialise on RouteResultsScreen with weather data from `route_enrichments`, tap a route card to view full details on RouteDetailsScreen, refine via chat (reusing the same session), or cancel the in-flight plan.

### Gate Steps

1. **Sign in with real Clerk credentials** (`CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` from `.env.local`); after the auth flow completes, **`IdleScreen` renders an interactive Mapbox map** centred on the rider's actual current location (CoreLocation on iOS, `FusedLocationProviderClient` on Android), with the LaneShadow custom style (`mapbox://styles/laneshadow/clxwarm01` light or `clxnight02` dark).
2. From `IdleScreen`, tap the suggestion chip "Plan a scenic 2-hour ride" → **a real `db.planningSessions.createSession` mutation runs**, the optimistic message appears immediately with `temp-{ts}` ID and reconciles to the server `_id` within ~500 ms; the screen transitions to `PlanningScreen`.
3. Watch `LSPhaseIndicator` pulse through the five canonical phases (parsing → searching → drafting → enriching → finalizing) driven by **real `db.sessionMessages.list` status updates streaming from Convex**; the live message tail shows the planning agent's actual narration.
4. After ~30 s, `RouteResultsScreen` renders **three real Mapbox polylines** decoded from `db.routePlans.getPlanById(planId).options[*].route.polylineCoordinates` (best / alt1 / alt2 colours), with the camera fitted to the union of the three polyline bounds with `Spacing.lg` padding; three `LSRouteAttachmentCard` molecules appear in the `LSNavigatorMessage` callout, sourced from the same plan document.
5. Tap the BEST route card → the screen transitions to `RouteDetailsScreen`; **the `LSRouteSheet` shows real distance / duration / elevation / scenic score** from `plan.options[best]` and the 6-hour `LSWeatherTimeline` is populated from **real `db.routeEnrichments.list`** for that option.
6. Tap an alt route card on `RouteResultsScreen` → `selectedRouteId` updates, the alt polyline promotes from dashed to solid, the card border re-tints to the alt's colour, **and the camera re-fits to the alt's bounds**.
7. Tap the cancel button mid-planning on `PlanningScreen` → `db.routePlans.cancelPlan` mutation fires, the session is preserved (`db.planningSessions.getSession` still returns it), the UI returns to `IdleScreen`, and the chat input remains pre-filled with the rider's last message.
8. From `RouteResultsScreen`, refine the plan via the chat input ("make it shorter, avoid Hwy 1") → the session ID is reused (no new session created), the agent re-runs, and **refined polylines replace the originals on the live Mapbox map**.
9. Trigger a planning failure (force `agentTimeout` via the failure-injection probe) → the screen transitions to `ErrorScreen` with the typed `LaneShadowError` mapping to user-facing copy and recovery chips; **the `ErrorScreen` background is the same real Mapbox map** showing the rider's last known location with a broken-polyline overlay (no `LSPaperMap`, no fallback illustration).

### What "real" means here (NON-NEGOTIABLE)

| Surface | "Real" definition |
|---|---|
| Map tiles | Mapbox Maps SDK rendering Mapbox-hosted tiles for `mapbox://styles/laneshadow/clxwarm01` / `clxnight02`. Not `LSPaperMap`, not a `Canvas { drawPath }` stub, not a CoreGraphics illustration. |
| User location | CoreLocation `CLLocationManager` (iOS) / `FusedLocationProviderClient` (Android) returns a real fix; map camera centres on it. |
| Auth | Clerk web/native sign-in with `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` from `.env.local`. No `bypassAuthForTesting`, no `EXTRA_BYPASS_AUTH` intent extra, no synthesised JWT. |
| Backend mutations | Live Convex production deployment (`pnpm server:dev`); every gate step exercises a real mutation/query/action. |
| Route generation | `actions/agent/planRide.ts` calls the Google Routes API and persists three `routeOptions` with decoded `polylineCoordinates: LatLng[]` on `db.routePlans`. |
| Weather enrichment | `actions/agent/agents/enrichmentAgent.ts` writes to `db.routeEnrichments` for each option; `RouteDetailsScreen` reads it via reactive subscription. |
| Polylines on map | Mobile decodes `routeOptions[*].route.polylineCoordinates` and feeds them into `LSMap(polylines: [...])` — the same Mapbox `PolylineAnnotationManager` exercise the existing iOS code uses for sandbox stories. |
| Cosmetic quality | Every screen renders to the design system spec (`styles/RULES.md`, design tokens, `pnpm design:review` once Sprint 05 ships). No `Color.blue.opacity(...)` literals, no clipped overlays, no mismatched paddings, no mock greeting card on top of a paper map. |

## Cosmetic mandate

**The rider must look at the running app and not see a "hot mess."** Specifically:

- Real Mapbox map fills the screen behind every map-bearing template (`IdleScreen`, `PlanningScreen`, `RouteResultsScreen`, `RouteDetailsScreen`, `ErrorScreen`).
- The greeting overlay, advisory card, chat input, phase indicator, and route attachment cards composite over the real map without clipping, colour bleed, or accidental opacity-stack glitches.
- Polylines render with the variant colour tokens at the correct stroke width and dash pattern; the selected polyline is `lineWidth: lg / dasharray: nil`, alts are `lineWidth: md / dasharray: [2, 1]`.
- Camera transitions ease (no jump) between the IdleScreen "user location" camera, the PlanningScreen progress camera, and the RouteResultsScreen "fit-to-options" camera.
- Light and dark mode render the correct LaneShadow Mapbox style URI.
- No `LSPaperMap` import remains in the production target on either platform (allowed only inside sandbox-only stories under `Sandbox/Stories/...`).

### Design-HTML fidelity (added 2026-05-04 after live screenshot review)

Every map-bearing template must match its canonical design HTML 1:1 in composition, typography modules, and token usage. The HTML files are the authoritative spec:

| Template | Canonical design | Notable variants the production code must reproduce from real signals |
|---|---|---|
| IdleScreen | `.spec/design/system/views/idle-screen/idle-screen.html` + `README.md` | S01 default · S02 typing/send · S03 dark · S04 filter sheet · V01 no-location · V02 first-ride · V03 weather-advisory |
| PlanningScreen | `.spec/design/system/views/planning-screen/planning-screen.html` | parsing → searching → drafting → enriching → finalizing phases driven by real `db.sessionMessages.list` status |
| RouteResultsScreen | `.spec/design/system/views/route-results-screen/route-results-screen.html` | best/alt1/alt2 attachment cards primed-state, alt-tap re-tints + polyline promotion |
| RouteDetailsScreen | `.spec/design/system/views/route-details-screen/route-details-screen.html` | route sheet expanded · weather timeline 6h · already-saved fingerprint state |
| ErrorScreen | `.spec/design/system/views/error-screen/error-screen.html` | typed `LaneShadowError` mapped to user-facing copy + recovery chips · NOT a paper map background |

Specific rebuild requirements from the live IdleScreen screenshot review:

- **TopBar must compose the hamburger square chip leading AND a "+ NEW" label-pill trailing** (`org-topbar` with `--square` and `--with-label` modifier chips). Current iOS template renders only the hamburger and overlaps adjacent content.
- **Greeting overlay is a single label-row + opinion-xl headline.** No "Good morning, {name}" line — that line is not in the design HTML. Headline reads "Where are we riding *today?*" / "*tonight?*" with copper italic emphasis on the time-scoped word, derived from `Greeting.scope` resolved against the rider's local time of day.
- **Bottom overlay is a 3-row stack:** `mol-location-context-bar` (location pill + MANUAL/AUTO mode chip) → `mol-chat-input__sugg-row` (horizontally scrollable suggestion chips, primed-chip variant tints copper when selected) → `mol-chat-input__bar` (54 pt height, leading ghost button, body-lg field text, trailing filter-or-send swap).
- **Typing → send transform.** When the rider types or primes a suggestion, the trailing `mol-chat-input__filter-btn` swaps to a copper-filled send button (`atoms.button.chat-send`). The current iOS template never does this swap.
- **Token-strict styling.** Zero `Color.blue.opacity(...)` literals (RF-31 still open from round-4), zero hardcoded hex / dp / pt values for spacing or radius — every value resolves through the design tokens. Sandbox stories may use literals; production templates may not.

### Google Places autocomplete (chat input typeahead)

The React Native predecessor (`react-native/hooks/use-place-autocomplete.ts` + `components/location-input.tsx`) drove the chat input with Google Places autocomplete: 300 ms debounce → up to 3 predictions inline below the focused input → `place_id` lookup on selection → resolved `{ lat, lon, formattedAddress }` populates the destination on submit. The current native chat inputs have NO typeahead. Sprint 04-B restores it on both platforms:

- **API surface preferred via Convex proxy** (Sprint 04-B Convex task): `actions/places/autocomplete` and `actions/places/details` keep the Google Places API key server-side and apply unified rate-limiting / billing visibility. Mobile clients call the Convex actions, never Google directly.
- **iOS implementation:** Swift `@Observable` typeahead controller wrapping the Convex actions; inline dropdown above `LSChatInput` with up to 3 predictions or 3 skeleton rows during the 300 ms debounce window; selection populates the field and stores the resolved coordinates for the next planning submit. Bottom corner-radius of the input collapses while predictions visible.
- **Android implementation:** Kotlin Flow / `StateFlow` repository wrapping the Convex actions; Compose-friendly inline dropdown over the same `LSChatInput`; same UX contract as iOS.
- **Fallback / no-network:** Predictions list collapses cleanly; submit still works using the raw text the rider typed; resolved coords default to `null` and the planning agent handles unresolved destinations as before.

## Scope (what this sprint owns)

### Convex (4 tasks)
- Decoded polyline coordinates persisted on `db.routePlans.options[*].route.polylineCoordinates` in `LatLng[]` form (Google polyline5 decode happens server-side, not on mobile).
- Three options always returned (`best`, `alt1`, `alt2`); fixture data forbidden — Google Routes alternatives must be real.
- Reactive subscription queries (`getPlanById`, `getActiveRoutePlansForSession`, `routeEnrichments.list`) return explicit object validators (no remaining `v.any()`).
- E2E probe surface (`internalQuery e2eProbe.getPlanShape`) for instrumented tests to verify polyline shape exists end-to-end before asserting in mobile.

### iOS (8 tasks)
- Replace `LSPaperMap` with `LSMap` on `IdleScreen` and `ErrorScreen`; wire CoreLocation user location into the camera.
- Remove all `IdleMockProvider` / `PlanningMockProvider` / `RouteDetailsMockProvider` / `ErrorMockProvider` references from production templates (sandbox stories may keep the providers).
- Decode polylines in `PlanningScreen`, `RouteResultsScreen`, `RouteDetailsScreen` from real `db.routePlans` data; remove hardcoded SF cameras; implement camera-fit on real polyline bounds.
- Replace `bypassAuthForTesting` with real Clerk in `Sprint04bGateE2ETests.swift`; capture device screenshots for each of the nine gate steps; assert visible polyline count via `XCUIElement.value` and Mapbox annotation snapshots.
- Cosmetic polish to design spec; verify with `pnpm design:review` (once Sprint 05 lands the pipeline) and manual visual review against `.spec/prds/v3-integration/architecture/ios-architecture.md`.

### Android (8 tasks)
- Mirror iOS scope: real CoreLocation-equivalent (`FusedLocationProviderClient`) into IdleScreen camera; remove hardcoded SF Bay camera; remove all `com.laneshadow.sandbox.mockproviders.*` references from production templates.
- Decode polylines and feed into the existing real Mapbox `LSMap` composable; implement camera-fit on real bounds.
- Replace `EXTRA_BYPASS_AUTH` with real Clerk in `Sprint04bGateE2ETest.kt` using `createAndroidComposeRule<MainActivity>()`; merge the two competing E2E suites left over from RF-39.
- Cosmetic polish to design spec.

### Out of scope for Sprint 04-B
- Saved routes, sessions screen, settings (Sprint 06).
- Design-review pipeline implementation (Sprint 05); Sprint 04-B may consume `pnpm design:review` once it ships, but does not deliver it.
- Offline tile caching (Sprint 07).
- Navigation/turn-by-turn (post-V3).
- Re-architecting the Navigator agent — only the data shape persisted on `db.routePlans` is in scope.

## Dependencies and ordering

```
                   ┌──────────────────────────────┐
                   │ S04B-CONVEX-T01 (polyline    │
                   │  decode + persist + valid.)  │
                   └──────────────┬───────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │ S04B-IOS-T01     │ │ S04B-AND-T01     │ │ S04B-CONVEX-T02..04│
   │  IdleScreen real │ │  IdleScreen real │ │  validators / probe│
   │  LSMap + loc     │ │  camera + loc    │ │                    │
   └─────────┬────────┘ └─────────┬────────┘ └────────────────────┘
             │                    │
             ▼                    ▼
   ┌──────────────────┐ ┌──────────────────┐
   │ S04B-IOS-T02..06 │ │ S04B-AND-T02..06 │
   │ Planning/Results │ │ Planning/Results │
   │ /Details/Error   │ │ /Details/Error   │
   │ + cosmetic polish│ │ + cosmetic polish│
   └─────────┬────────┘ └─────────┬────────┘
             ▼                    ▼
   ┌──────────────────┐ ┌──────────────────┐
   │ S04B-IOS-T07/T08 │ │ S04B-AND-T07/T08 │
   │ real Clerk E2E + │ │ real Clerk E2E + │
   │ visual evidence  │ │ visual evidence  │
   └──────────────────┘ └──────────────────┘
```

Convex task T01 (polyline persistence) blocks all platform polyline tasks. CoreLocation/Fused-location tasks (`IOS-T01`, `AND-T01`) can run in parallel with `CONVEX-T01`.

## Tasks

_Generated by domain planners on 2026-05-04. Detailed per-task files follow this table._

| ID | Title | Agent | Estimate | Depends |
|----|-------|-------|----------|---------|
| _Filled in by planner sweep_ | _see per-task files_ | _per RULES.md_ | _per planner_ | _per planner_ |

## Closure gate

1. All planned task files green per their AC + reviewer sign-off.
2. iOS `Sprint04bGateE2ETests` and Android `Sprint04bGateE2ETest` both green on real Clerk auth + real Convex deployment + real Google Routes; XCResult / Compose-test screenshots attached for each of the 9 gate steps.
3. `pnpm design:review` (once Sprint 05 ships the pipeline) returns no high-severity issues for the five map-bearing templates; until then, manual visual review against `.spec/prds/v3-integration/architecture/{ios,android}-architecture.md`.
4. Human walks the 9-step gate on a real iPhone and a real Android device, each producing screenshots committed to `.spec/reviews/sprint-04b-human-gate/`.
5. Re-run `/review-red-hat` on this sprint folder; verdict must be `READY` with zero CRITICAL or HIGH findings open.

## Source coverage

- UC-CHAT-01..04, UC-CHAT-06 (planning loop happy path, refinement, cancel, error mapping)
- UC-MAP-01 (real Mapbox rendering on every map-bearing template)
- UC-MAP-02 (camera-fit-to-polylines for results)
- UC-MAP-04 (user-location camera centering on idle)
- `architecture/ios-architecture.md` § 3-5
- `architecture/android-architecture.md` § State + Convex wrapper + Mapbox host
- `11-technical-requirements.md` § State Machine + Reactivity Patterns + Error Handling

## Blocks / Blocked by

- **Blocked by:** Sprint 03 (Auth & Convex Foundation) — closed.
- **Blocks:** Sprint 06 (Saved Routes, Sessions & Settings) — depends on real plan/options data being persistent and surfaced in mobile.
