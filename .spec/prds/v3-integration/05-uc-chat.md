---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: CHAT
---

# Use Cases: Conversational Planning Flow (CHAT)

| ID | Title | Description |
|----|-------|-------------|
| UC-CHAT-01 | Idle screen with real Convex-backed entry | IdleScreen wired to real user greeting + suggestion chips + create-session mutation |
| UC-CHAT-02 | Planning screen with real session messages and phase progression | PlanningScreen subscribes to `session_messages` stream; phase indicator reflects status; cancel button works |
| UC-CHAT-03 | Route results with real route_plans and multi-polyline map | RouteResultsScreen renders three real polylines from `route_plans.options[]` attached to NavigatorMessage |
| UC-CHAT-04 | Route details with real route plan and enrichment | RouteDetailsScreen wired to selected option + `route_enrichments` for weather/conditions |
| UC-CHAT-05 | Plan ride sheet (manual planning fallback) [STRETCH] | Manual mode bottom sheet — start/end inputs, scenic bias, avoid toggles, calls `agent.planRide` |
| UC-CHAT-06 | Error screen with recovery | ErrorScreen surfaces typed errors with recovery chips routing back to Idle or retrying |

---

## UC-CHAT-01: Idle screen with real Convex-backed entry

IdleScreen renders for an authenticated user with no active plan. Real greeting from `users.name` overlays a real LSMap centered on current location; chat input creates a new `planning_sessions` row and dispatches the first `agent.sendMessage` action. Suggestion chips are pre-defined per V2 — they remain fixture-driven (the chips themselves aren't user-data; they're product copy).

- **Maps to**: V2 IdleScreen
- **Backend**: subscribe `db.users.getCurrentUser`, mutation `db.planningSessions.createSession`, action `actions.agent.sendMessage.sendMessage`
- **State machine**: IDLE → PLANNING on submit

### Acceptance Criteria

- ☐ User can view IdleScreen with a greeting overlay rendered over a real LSMap centered on their current location
- ☐ User can see their display name from `db.users.getCurrentUser` interpolated into the greeting line ("Good morning, {name}")
- ☐ User can tap any of the four suggestion chips to send a planning message and create a new `planning_sessions` row in Convex
- ☐ User can type a free-form prompt in the LSChatInput and tap send to start planning
- ☐ System transitions the screen to PlanningScreen on successful session creation by dispatching `START_SESSION` to the RideFlow reducer
- ☐ System displays an inline error toast and remains on IdleScreen when `createSession` mutation fails

---

## UC-CHAT-02: Planning screen with real session messages and phase progression

PlanningScreen subscribes to two reactive queries: `db.sessionMessages.list` for the streamed conversation and `db.routePlans.getActiveRoutePlansForSession` for plan status. The LSPhaseIndicator pulses through phases as the agent reports status. Cancel button calls `db.routePlans.cancelPlan` to abort.

- **Maps to**: V2 PlanningScreen
- **Backend**: subscribe `db.sessionMessages.list({sessionId, limit?})`, subscribe `db.routePlans.getActiveRoutePlansForSession({sessionId})`, mutation `db.routePlans.cancelPlan`
- **State machine**: PLANNING → ROUTE_RESULTS on `route_plans.status === "completed"`; PLANNING → ERROR on `status === "failed"`

### Acceptance Criteria

- ☐ User can view streamed session messages in the chat transcript as they arrive from the `db.sessionMessages.list` subscription
- ☐ User can see the LSPhaseIndicator molecule pulse through planning phases (parsing → searching → drafting → enriching → finalizing) driven by message status updates
- ☐ User can tap the cancel affordance on the LSChatInput to abort an in-flight plan, which calls `db.routePlans.cancelPlan` for the active plan ID
- ☐ System displays the user's optimistic message immediately on submit using a temp ID, then reconciles with the server-assigned `_id` when the message arrives via subscription
- ☐ System transitions the screen to RouteResultsScreen when a `route_plans` entry for this session reaches `completed` status with non-empty options
- ☐ System transitions the screen to ErrorScreen when the active `route_plans` entry reaches `failed` status, populating the error context with the typed error code

---

## UC-CHAT-03: Route results with real route_plans and multi-polyline map

RouteResultsScreen renders three route options from a completed `route_plans` entry. Each option's polyline draws on the LSMap with the V2 `routeDrawOn` motion recipe and color-coded by `RouteVariant` (best / alt1 / alt2). The LSNavigatorMessage organism surfaces the agent's response with three attached `LSRouteAttachmentCard` molecules. Tap any card → RouteDetailsScreen for that option.

- **Maps to**: V2 RouteResultsScreen
- **Backend**: subscribe `db.routePlans.getPlanById({routePlanId})` (the completed plan from UC-CHAT-02); cards bound to `plan.options[]`
- **State machine**: ROUTE_RESULTS → ROUTE_DETAILS on `SELECT_OPTION`; ROUTE_RESULTS → PLANNING on refine via chat input (reuses session)

### Acceptance Criteria

- ☐ User can view three route option cards attached to an LSNavigatorMessage when a plan completes successfully
- ☐ User can see three colored polylines (best, alt1, alt2) rendered on the LSMap using the V2 `routeDrawOn` motion recipe
- ☐ User can tap any LSRouteAttachmentCard to transition to RouteDetailsScreen for that specific route option
- ☐ User can refine the plan via the LSChatInput at the bottom, which reuses the existing `sessionId` and dispatches a follow-up `agent.sendMessage` action
- ☐ System displays the LSWeatherBadge molecule on each route card sourced from `route_enrichments` data when enrichment status is "completed"

---

## UC-CHAT-04: Route details with real route plan and enrichment

RouteDetailsScreen renders a single selected route option with the full LSRouteSheet organism (LSBestBadge + title + 4-column LSInstrumentReadout for distance/duration/elevation/scenic-score + 6-hour LSWeatherTimeline + sticky action row with Save and "Ride this" buttons). Save button opens the SaveFavoriteSheet (UC-ROUTE-01).

- **Maps to**: V2 RouteDetailsScreen
- **Backend**: subscribe `db.routePlans.getPlanById` (live), subscribe `db.routeEnrichments.list({routePlanId})` for weather/conditions, query `db.savedRoutes.getRouteIndexFingerprint` for "already saved" state
- **State machine**: ROUTE_DETAILS → ROUTE_RESULTS on back; ROUTE_DETAILS → NAVIGATION_EXPORT on "Ride this" (deferred — button is no-op for V3)

### Acceptance Criteria

- ☐ User can view the selected route's distance, duration, elevation gain, and scenic score in the LSRouteSheet's LSInstrumentReadout
- ☐ User can see the 6-hour LSWeatherTimeline pulled from `route_enrichments` for the route
- ☐ User can tap "Save" on the route sheet's action row to open the SaveFavoriteSheet (UC-ROUTE-01 entry point)
- ☐ User can tap "Ride this" to acknowledge selection (no-op in V3 — the navigation-export flow is deferred to a follow-on initiative)
- ☐ System displays the save button in an "Already saved" state when the current route's `routeIndex` fingerprint matches an existing `saved_routes` row for the user

---

## UC-CHAT-05: Plan ride sheet (manual planning fallback) [STRETCH]

Manual mode for riders who prefer point-and-click route planning over conversational. Bottom sheet with start/end location inputs (Mapbox Search API place autocomplete), scenic bias slider, avoid-highways and avoid-tolls toggles, departure time picker, and Plan button that calls `agent.planRide` action directly. RN has this as `components/sheets/plan-ride-sheet.tsx`.

**Stretch designation**: This UC is in scope as a stretch goal. If week-4 scope is tight, defer to v3.1.

- **Maps to**: NEW UI — PlanRideSheet (bottom sheet using V2 LSBottomSheet organism)
- **Backend**: action `actions.agent.planRide.planRide`, query Mapbox Search API for autocomplete (existing `lib/mapbox/`)
- **State machine**: IDLE → PLANNING on submit

### Acceptance Criteria

- ☐ User can open the plan-ride sheet from a "Manual mode" affordance on the IdleScreen LSChatInput
- ☐ User can enter start and end locations using place autocomplete sourced from the Mapbox Search API
- ☐ User can adjust the scenic bias slider, toggle avoid-highways and avoid-tolls switches, and pick a departure time using a native picker
- ☐ User can tap "Plan" to call the `agent.planRide` action with the form inputs and transition to PlanningScreen
- ☐ System closes the sheet and transitions to PlanningScreen via the RideFlow reducer when `planRide` returns success

---

## UC-CHAT-06: Error screen with recovery

ErrorScreen surfaces planning errors with the V2 LSInlineErrorCallout organism (warn-stripe + compass chip + opinion-serif body + recovery chip footer + recovery LSChatInput). Errors are typed (`SESSION_NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `PLAN_LIMIT_EXCEEDED`, `PLAN_ALREADY_ACTIVE`, `AGENT_TIMEOUT`, `NETWORK_TIMEOUT`, `UNAUTHENTICATED`, etc.) and mapped to user-friendly copy via `LaneShadowError` (Swift) / `LaneShadowError` sealed class (Kotlin).

- **Maps to**: V2 ErrorScreen
- **Backend**: error context populated from `route_plans.status === "failed"` subscription event (UC-CHAT-02 → ERROR transition) or from any other typed Convex error
- **State machine**: ERROR → IDLE on RESET; ERROR → PLANNING on RETRY (re-dispatches the failed action)

### Acceptance Criteria

- ☐ User can view the LSInlineErrorCallout describing what failed in the opinion-serif voice (auth, rate-limit, validation, network, timeout)
- ☐ User can tap "Try again" recovery chip to retry the failed action with the same input
- ☐ User can tap "Start over" recovery chip to dispatch RESET on the RideFlow reducer and return to IdleScreen
- ☐ System logs the typed error to the Convex `performance` table for monitoring
- ☐ System redirects to SignInScreen instead of rendering ErrorScreen when the typed error is `UNAUTHENTICATED` (auth recovery flow per UC-AUTH-04)
- ☐ System displays a rate-limit-specific recovery message ("You've used all 5 monthly plans") with no retry chip when the error code is `PLAN_LIMIT_EXCEEDED`
