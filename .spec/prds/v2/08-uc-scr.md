---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: SCR
---

# Use Cases: Screens / Templates (SCR)

Screens assemble organisms (and, where appropriate, molecules and atoms) into full user-facing Navigator templates. Every screen renders from a named mock data provider in the sandbox — there is no live Convex or Navigator-runtime wiring in V2. Fixture shapes either mirror `server/convex/` read types (Route, User) or are declared in `11-technical-requirements.md` for Navigator-specific entities.

All six screens share the `LSMapLayer` organism (UC-ORG-02) as their canvas — positioning / z-index / safe-area / overlay slot stacking is solved once there. Screens pass pre-assembled overlays and chrome into the map layer's slots.

| ID         | Title                      | Description |
|------------|----------------------------|-------------|
| UC-SCR-01  | `IdleScreen`               | Map + greeting overlay + chat input with suggestion chips. Navigator dormant. |
| UC-SCR-02  | `PlanningScreen`           | Map with sketching polyline animation + phase indicator + thinking-state chat input. Navigator thinking. |
| UC-SCR-03  | `RouteResultsScreen`       | Map with 3 alternative polylines + Navigator message carrying 3 attached route cards + refine-prompt chat input. |
| UC-SCR-04  | `RouteDetailsScreen`       | Map + `LSRouteSheet` with best badge, instrument readout, weather timeline, Save / Ride this. |
| UC-SCR-05  | `SessionsScreen`           | Scrimmed map + `LSSessionsDrawer`. No top bar (drawer handles its own chrome). |
| UC-SCR-06  | `ErrorScreen`              | Map + `LSInlineErrorCallout` with recovery suggestions + chat input. |

---

## UC-SCR-01 — `IdleScreen`

> **Design reference:** [`concepts/uc-scr-01-idle.html`](concepts/uc-scr-01-idle.html) — complete visual writeout showing rendered DOM examples of the Idle screen with map, greeting overlay (opinion-serif headline with italicized "today"), TopBar glass chrome, and ChatInput with suggestion chips + location badge. Use the visual examples to understand full-screen composition and overlay positioning; do NOT copy the HTML wholesale. Extract screen layout, overlay stacking, and token mappings into native screen implementations.

The dormant-Navigator home screen. Seen when the rider opens the app with no active session. Map-primary; favorites shown; no polyline; Navigator listens via suggestion chips + chat input.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera, showFavorites: true)` — Copper Studio style + favorite annotations (but no polyline).
- `topBar`: `LSTopBar(onMenuTap: { presentSessions() }, onNewTap: { startNewSession() })`.
- `topOverlays`: one entry — the greeting overlay, positioned under the top bar:
  - Label row "FRIDAY · 68°F · CLEAR" in `typography.ui.label.sm` + `color.signal.default`.
  - Headline "Where are we riding **today?**" in `typography.opinion.xl` + `color.content.primary`, with "today" italicized.
- `bottomOverlays`: one entry — `LSChatInput(value: $prompt, placeholder: "Plan a ride from Near Santa Cruz…", suggestions: [...4 suggestion chips...], locationBadge: .init(label: "Near Santa Cruz, CA", mode: .manual), onSend:, onCollapse:, onFilter:, onSuggestionTap:)`.

Mock provider: `IdleMockProvider` produces `{ greeting: Greeting, location: LocationContext, suggestions: [SuggestionChip] }`.

### Acceptance Criteria
- ☐ Developer can open "Screens / Idle" on iOS and see: `LSTopBar` at top, greeting overlay immediately below it (label + opinion-serif headline with italicized "today"), full-screen paper-map with favorite pins, and `LSChatInput` anchored at bottom showing 4 suggestion chips ("Twisty back roads", "Coastal cruise", "Half-day loop", "Mountain passes") + location badge ("Near Santa Cruz, CA", "MANUAL").
- ☐ Developer can open the same on Android identically.
- ☐ Developer can tap a suggestion chip and see `onSuggestionTap` fire with the chip; `ChatMockProvider` updates the input value to the chip's label.
- ☐ Developer can type into the input on either platform and see the trailing icon swap from `sliders` to `send`.
- ☐ Developer can tap the hamburger in `LSTopBar` and see the sandbox stub for "present sessions" fire (console log).
- ☐ Developer can toggle light/dark and see every element — map style, glass chrome, greeting text, chat surface — re-render with correct tokens.
- ☐ Developer can verify the screen contains no data-fetching logic; all data is injected via `IdleMockProvider`, asserted by a platform test.

---

## UC-SCR-02 — `PlanningScreen`

> **Design reference:** [`concepts/uc-scr-02-planning.html`](concepts/uc-scr-02-planning.html) — complete visual writeout showing rendered DOM examples of the Planning screen with sketching polyline animation, PhaseIndicator with active step pulsing, and thinking-state ChatInput with spinner. Use the visual examples to understand the planning-phase visual narrative; do NOT copy the HTML wholesale. Extract animation references, phase step layout, and token mappings into native screen implementations.

The Navigator is thinking. A sketching polyline animation draws continuously on the paper map; the phase indicator shows which step of the planning pipeline is active; the chat input is disabled (`isThinking: true`) with the rider's prompt visible.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera)` with a sketching polyline visual driven by `motion.recipe.sketchPolylineLoop` — implementation note: the sketching visual is owned by the map layer's style (Mapbox Studio) OR, if not feasible in Studio, by a temporary overlay atom rendered above the map bounds at tile-path coordinates. Implementation chooses in Sprint 2 and documents.
- `topBar`: `LSTopBar(onMenuTap:, onNewTap:)`.
- `topOverlays`: one entry — `LSPhaseIndicator(phases: phases, header: "Let me think on that…")` positioned under the top bar.
- `bottomOverlays`: one entry — `LSChatInput(value: filledPrompt, isThinking: true, onSend:, onCollapse:, onFilter:)` with the rider's prompt filled (e.g., "Scenic 2-hour ride to Santa Cruz, avoid highways") and the trailing slot replaced by `LSSpinner`.

Mock provider: `PlanningMockProvider` produces `{ prompt: String, phases: [PlanningPhase] }` with one phase marked `active` (chosen per story variant).

### Acceptance Criteria
- ☐ Developer can open "Screens / Planning" on iOS and see: top bar, `LSPhaseIndicator` with 5 labeled steps and one active (pulsing ring via `motion.recipe.phaseDotPulse`), map with sketching polyline animation, chat input at bottom with filled prompt text and `LSSpinner` in the trailing slot.
- ☐ Developer can open the same on Android identically.
- ☐ Developer can use the story's `argTypes` to change the active phase and see the `LSPhaseIndicator` re-render with the newly-active step pulsing and prior steps marked `done`.
- ☐ Developer can verify the sketching polyline animation loops continuously and references `motion.recipe.sketchPolylineLoop` (not a hardcoded duration/easing) — checked by inspecting the animation declaration in platform tests.
- ☐ Developer can verify the chat input is non-interactive: typing is disabled; send is replaced by `LSSpinner`.
- ☐ Developer can toggle light/dark and see every element re-render correctly.
- ☐ Developer can verify the screen contains no data-fetching logic; all data arrives via `PlanningMockProvider`.

---

## UC-SCR-03 — `RouteResultsScreen`

> **Design reference:** [`concepts/uc-scr-03-route-results.html`](concepts/uc-scr-03-route-results.html) — complete visual writeout showing rendered DOM examples of the RouteResults screen with three concurrent polylines (best/alt1/alt2), NavigatorMessage with attached route cards, and refine-prompt ChatInput. Use the visual examples to understand multi-polyline rendering and message-with-attachments composition; do NOT copy the HTML wholesale. Extract polyline variant colors, card stacking, and token mappings into native screen implementations.

Navigator has responded with three alternatives. The map shows three concurrent polylines (best / alt1 / alt2) drawn on via `motion.recipe.routeDrawOn`; the Navigator message overlay holds the response body and three compact attached route cards; the chat input is available for refinement.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera, cameraFit: .polylines(padding: .spacing4), polylines: [bestPolyline, alt1Polyline, alt2Polyline], annotations: [startAnno, endAnnotations...])` — three polylines drawn on via `motion.recipe.routeDrawOn` on initial load.
- `topBar`: `LSTopBar(onMenuTap:, onNewTap:)`.
- `topOverlays`: one entry — `LSNavigatorMessage(body: responseBody, attachments: [best, alt1, alt2], pinned: true, onPin:, onDismiss:)`.
- `bottomOverlays`: one entry — `LSChatInput(value: $refinement, placeholder: "Refine — 'make it shorter' / 'avoid Hwy 1'", onSend:, onCollapse:, onFilter:)`.

Mock provider: `RouteResultsMockProvider` produces `{ message: NavigatorMessage, routes: [RouteAttachment] }` — three routes with distinct variants.

### Acceptance Criteria
- ☐ Developer can open "Screens / RouteResults" on iOS and see: top bar, `LSNavigatorMessage` pinned with "THE NAVIGATOR" label, body text in opinion-serif, three compact `LSRouteAttachmentCard`s stacked (the first marked `selected`, stripe in `color.route.best`, best badge on first card), map below with three polylines rendered in `color.route.best / alt1 / alt2`, chat input with refine-prompt placeholder.
- ☐ Developer can open the same on Android identically.
- ☐ Developer can verify the three polylines render with the per-variant colors from `color.route.*` and that the camera auto-frames the union bounds with `spacing.4` padding via `cameraFit: .polylines`.
- ☐ Developer can verify the `motion.recipe.routeDrawOn` animation fires on initial load with 120ms stagger between paths.
- ☐ Developer can tap the pin icon and see `onPin` fire; tapping the close icon fires `onDismiss`; since the message is pre-pinned, auto-dismiss does not fire.
- ☐ Developer can toggle light/dark and see the map style re-resolve to the dark Studio style; glass chrome, message surface, route stripes all re-resolve.
- ☐ Developer can verify the screen contains no data-fetching logic; all data arrives via `RouteResultsMockProvider`.

---

## UC-SCR-04 — `RouteDetailsScreen`

> **Design reference:** [`concepts/uc-scr-04-route-details.html`](concepts/uc-scr-04-route-details.html) — complete visual writeout showing rendered DOM examples of the RouteDetails screen with single best-variant polyline, RouteSheet bottom sheet with best badge, instrument readout, weather timeline, and Save/Ride this action row. Use the visual examples to understand the details-screen sheet composition; do NOT copy the HTML wholesale. Extract sheet detent behavior, metric grid, and token mappings into native screen implementations.

The rider picked a route. The map shows just that route (best variant); the bottom sheet shows full metrics and weather; the action row lets them save or ride.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera, cameraFit: .polyline(padding: .spacing4), polylines: [bestPolyline], annotations: [startAnno, endAnno])`.
- `topBar`: `LSTopBar(onMenuTap:, onNewTap:)`.
- `bottomSheet`: `LSRouteSheet(route: routeDetails, weatherTimeline: sixHourTimeline, onSave:, onRide:, onDismiss:)`.

Mock provider: `RouteDetailsMockProvider` produces `{ route: RouteDetails, weatherTimeline: [WeatherTimelineEntry] }`.

### Acceptance Criteria
- ☐ Developer can open "Screens / RouteDetails" on iOS and see: top bar, map with a single best-variant polyline centered with `spacing.4` padding, a pre-presented `LSRouteSheet` at `.large` detent showing `LSBestBadge`, opinion-serif title ("The Skyline Spine"), via subtitle, 4-column instrument readout (DIST/TIME/CLIMB/SCENIC), 6-hour weather timeline header + cells, sticky action row with outline `Save` and primary `Ride this`.
- ☐ Developer can open the same on Android identically.
- ☐ Developer can tap `Save` or `Ride this` and see the respective callback fire (sandbox stub logs to console).
- ☐ Developer can drag the sheet down and see the detent change; dragging past dismiss threshold fires `onDismiss` (sandbox stub re-presents).
- ☐ Developer can verify the weather timeline renders cells with per-condition tint backgrounds and that the story has at least one mixed-weather variant (clear / rain / wind).
- ☐ Developer can toggle light/dark and see every element re-render correctly.
- ☐ Developer can verify the screen contains no data-fetching logic; all data arrives via `RouteDetailsMockProvider`.

---

## UC-SCR-05 — `SessionsScreen`

> **Design reference:** [`concepts/uc-scr-05-sessions.html`](concepts/uc-scr-05-sessions.html) — complete visual writeout showing rendered DOM examples of the Sessions screen with scrimmed map, left-anchored SessionsDrawer with grouped session rows and active-session stripe. Use the visual examples to understand the drawer-over-map composition and scrim behavior; do NOT copy the HTML wholesale. Extract drawer slide-in animation, session row styling, and token mappings into native screen implementations.

Conversation history. The map is dimmed; the left drawer shows this week's sessions with the active one stripe-highlighted.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera)` — non-interactive backdrop.
- `scrim`: `.init(opacity: 0.35)`.
- `leadingDrawer`: `.init(content: LSSessionsDrawer(sessions, activeSessionId, onSelect:, onNew:, onDismiss:), onDismiss: { /* dismiss drawer */ })`.
- No `topBar` (drawer's own header replaces it).

Mock provider: `SessionsMockProvider` produces `{ sessions: [Session], activeSessionId: Session.Id? }`.

### Acceptance Criteria
- ☐ Developer can open "Screens / Sessions" on iOS and see: dimmed map behind `LSScrim` at 0.35, `LSSessionsDrawer` sliding in from the left via `motion.recipe.sidebarSlideIn`, "Rides" header + "NEW" button + "THIS WEEK" section label + 5 session rows (with "Santa Cruz loop" marked active via signal stripe).
- ☐ Developer can open the same on Android identically.
- ☐ Developer can tap a non-active session row and see `onSelect(session.id)` fire once.
- ☐ Developer can tap the "NEW" button and see `onNew` fire once.
- ☐ Developer can tap the scrim (outside the drawer) and see `onDismiss` fire — drawer animates out via the reverse of `motion.recipe.sidebarSlideIn`.
- ☐ Developer can scroll the session list and see the drawer header + "NEW" button + "THIS WEEK" label remain sticky.
- ☐ Developer can toggle light/dark and see the scrim, drawer chrome, active stripe, row backgrounds all re-resolve correctly.
- ☐ Developer can verify the screen contains no data-fetching logic; all data arrives via `SessionsMockProvider`.

---

## UC-SCR-06 — `ErrorScreen`

> **Design reference:** [`concepts/uc-scr-06-error.html`](concepts/uc-scr-06-error.html) — complete visual writeout showing rendered DOM examples of the Error screen with InlineErrorCallout (warning-stripe, Navigator body, detail text, suggestion chips) and recovery ChatInput. Use the visual examples to understand error-state composition and recovery flow; do NOT copy the HTML wholesale. Extract callout styling, suggestion chip layout, and token mappings into native screen implementations.

Navigator couldn't fulfill the request. Inline recovery callout with suggestions + chat input for the rider to try again.

Composition (via `LSMapLayer`):
- `map`: `LSMap(mode: .preview, camera: regionCamera)`.
- `topBar`: `LSTopBar(onMenuTap:, onNewTap:)`.
- `topOverlays`: one entry — `LSInlineErrorCallout(body: errorBody, detail: errorDetail, suggestions: [SuggestionChip("Try inland"), SuggestionChip("End at Big Sur")], onSuggestionTap:)` positioned under the top bar.
- `bottomOverlays`: one entry — `LSChatInput(value: $newPrompt, placeholder: "Try again, or let me know what to change…", onSend:, onCollapse:, onFilter:)`.

Mock provider: `ErrorMockProvider` produces `{ error: NavigatorError, suggestions: [SuggestionChip] }`.

### Acceptance Criteria
- ☐ Developer can open "Screens / Error" on iOS and see: top bar, `LSInlineErrorCallout` with warn-stripe + compass chip + "THE NAVIGATOR" label + opinion-serif body ("Couldn't stitch that one together — the segment through Lucia looked broken.") + muted detail text + "Try inland" + "End at Big Sur" suggestion chips, map below, chat input with recovery placeholder.
- ☐ Developer can open the same on Android identically.
- ☐ Developer can tap a suggestion chip and see `onSuggestionTap(chip)` fire exactly once with the tapped chip.
- ☐ Developer can type into the chat input and see the send/filter trailing swap as on other screens.
- ☐ Developer can toggle light/dark and see the callout's warn stripe + glass chrome + suggestion chips all re-resolve.
- ☐ Developer can verify the screen contains no data-fetching logic; all data arrives via `ErrorMockProvider`.
