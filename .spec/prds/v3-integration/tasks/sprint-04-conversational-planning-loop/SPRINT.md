# Sprint 04: Conversational Planning Loop

**Sequence:** 4
**Timeline:** Phase 2 · Week 4
**Status:** In Progress (task expansion 2026-05-01)

## Overview

Sprint 04 wires the conversational planning loop end-to-end — the single biggest integration surface in V3, touching all 6 V2 screens (IdleScreen, PlanningScreen, RouteResultsScreen, RouteDetailsScreen, plus error and recovery states). Building on the auth + Convex foundation from Sprint 03, this sprint binds real `db.planningSessions`, `db.sessionMessages`, `db.routePlans`, and `db.routeEnrichments` data into the native iOS and Android sandbox views, replacing all mock providers with reactive Convex subscriptions. The RideFlow state machine ports the React Native `use-ride-flow.ts` reducer 1:1 onto Swift `@Observable` and Kotlin `StateFlow`, optimistic UI temp-ID reconciliation matches the RN behavior, and the LaneShadowError typed error pathway maps server error codes to user-facing recovery copy. By sprint end, a rider can tap a suggestion chip on IdleScreen, watch the Navigator agent stream a real route plan through the PlanningScreen phase indicator, see three live polylines materialize on RouteResultsScreen, refine via chat, or cancel mid-plan — entirely on real Convex data.

## Human Testing Gate

**Gate:** A rider can plan a real route end-to-end via chat and see three live polylines on RouteResults — tap a suggestion chip on IdleScreen, watch the Navigator agent stream a real route plan through the PlanningScreen phase indicator, see three live polylines (best/alt1/alt2) materialize on RouteResultsScreen with weather data from `route_enrichments`, tap a route card to view full details on RouteDetailsScreen, refine via chat (reusing the same session), or cancel the in-flight plan.

## Human Test Deliverable

**Test Steps:**
1. From IdleScreen, tap a suggestion chip ("Plan a scenic 2-hour ride") and confirm the screen transitions to PlanningScreen with the optimistic message immediately visible (temp ID) and reconciled to the server `_id` within ~500ms
2. Watch the LSPhaseIndicator pulse through phases (parsing → searching → drafting → enriching → finalizing) driven by real `db.sessionMessages.list` status updates streaming from Convex
3. After ~30s, see RouteResultsScreen render with three real polylines (best/alt1/alt2 colors) on the LSMap and three `LSRouteAttachmentCard` molecules in the LSNavigatorMessage callout, sourced from `db.routePlans.getPlanById` for the completed plan
4. Tap the BEST route card → confirm the screen transitions to RouteDetailsScreen with the LSRouteSheet showing real distance/duration/elevation/scenic-score in LSInstrumentReadout and the 6-hour LSWeatherTimeline populated from `db.routeEnrichments.list`
5. Tap an alt route card on RouteResultsScreen → confirm `selectedRouteId` updates, the alt polyline promotes from dashed to solid, and the card border re-tints to the alt's color
6. Tap the cancel button mid-planning on PlanningScreen → confirm `db.routePlans.cancelPlan` mutation fires + UI returns to IdleScreen with the session preserved
7. From RouteResultsScreen, refine the plan via the chat input ("make it shorter, avoid Hwy 1") → confirm the session ID is reused (not a new session), the agent re-runs, and refined polylines replace the originals
8. Trigger a planning failure (e.g., agent timeout) → confirm the screen transitions to ErrorScreen with the typed `LaneShadowError` mapping to the right user-facing message and recovery chips populated from the suggestion list

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| CHAT-S04-T01 | iOS `Services/RideFlow.swift` — `@Observable` reducer with pure `reduce(state, event) → state` function; states IDLE / PLANNING / ROUTE_RESULTS / ROUTE_DETAILS / SESSION_HISTORY / ERROR / NAVIGATION_EXPORT; `Services/ChatStore.swift` + `SessionStore.swift` | swift-implementer | 240 min |
| CHAT-S04-T02 | Android `services/RideFlowViewModel.kt` — sealed `RideFlowState` + `RideFlowAction` + pure `reduce()` ported 1:1 from RN `use-ride-flow.ts`; ChatViewModel with StateFlow bindings; `services/AppStateRepository.kt` for camera + last-viewed session via DataStore | kotlin-implementer | 240 min |
| CHAT-S04-T03 | iOS Idle + Planning real-data wiring — IdleScreen subscribes to `db.users.getCurrentUser` + `db.planningSessions.listSessions`; chat input dispatches `db.planningSessions.createSession` + `actions.agent.sendMessage.sendMessage`; PlanningScreen subscribes to `db.sessionMessages.list` + `db.routePlans.getActiveRoutePlansForSession`; phase indicator binds to message status | swift-implementer | 360 min |
| CHAT-S04-T04 | Android Idle + Planning real-data wiring — IdleViewModel + PlanningViewModel collecting Convex Flows; same subscriptions and mutations as iOS, exposed via StateFlow; LSPhaseIndicator receives header string per active phase | kotlin-implementer | 360 min |
| CHAT-S04-T05 | iOS RouteResults real-data wiring — RouteResultsScreen subscribes to `db.routePlans.getPlanById`; renders 3 polylines from `plan.options[]` with variant colors; LSNavigatorMessage receives 3 attached LSRouteAttachmentCards; `onRouteCardTap` callback updates `selectedRouteId` (Gap H1-07 fix); Recall chip after dismiss | swift-implementer | 240 min |
| CHAT-S04-T06 | Android RouteResults real-data wiring — RouteResultsViewModel + alt-selection mutator; Recall chip on dismiss | kotlin-implementer | 240 min |
| CHAT-S04-T07 | iOS RouteDetails real-data wiring — bound to selected route option; subscribe to `db.routeEnrichments.list` for weather; query `db.savedRoutes.getRouteIndexFingerprint` for already-saved state; SaveFavoriteSheet entry-point wiring | swift-implementer | 180 min |
| CHAT-S04-T08 | Android RouteDetails real-data wiring + enrichment + already-saved fingerprint check + SaveFavoriteSheet entry | kotlin-implementer | 180 min |
| CHAT-S04-T09a | iOS optimistic UI temp-ID reconciliation + cancel wiring — append `PendingMessage` with `temp-{timestamp}` ID locally in ChatStore; reconcile on first reactive emission matching `(sessionId, content, role, timestamp)` proximity; cancel button → `cancelPlan` mutation; pending/streaming/complete states | swift-implementer | 240 min |
| CHAT-S04-T09b | Android optimistic UI temp-ID reconciliation in ChatViewModel — `PendingMessage` + `MessageReconciler` + `displayMessages: StateFlow<List<DisplayMessage>>` via combine(pending, confirmed); cancel-plan side effect on `CancelPlanning` action | kotlin-implementer | 240 min |
| CHAT-S04-T10a | iOS LaneShadowError typed enum + ErrorScreen integration — Swift `enum LaneShadowError` mirroring RN `lib/convex-error.ts` 1:1; full taxonomy (sessionNotFound, rateLimitExceeded, planLimitExceeded, agentTimeout, unauthenticated, etc.); UNAUTHENTICATED triggers signOutFlow(); ErrorScreen recovery chip wiring | swift-implementer | 180 min |
| CHAT-S04-T10b | Android LaneShadowError typed sealed class + ErrorRoute + SignOutFlow — Kotlin `sealed class LaneShadowError` mirroring server taxonomy; UNAUTHENTICATED triggers signOut + nav to SignIn via SharedFlow; PLAN_LIMIT_EXCEEDED suppresses retry chip | kotlin-implementer | 180 min |

### Task Files

Generated by /kb-sprint-tasks-plan on 2026-05-01

- [CHAT-S04-T01-ios-rideflow-reducer.md](CHAT-S04-T01-ios-rideflow-reducer.md) (swift-implementer, 240 min)
- [CHAT-S04-T02-android-rideflow-viewmodel.md](CHAT-S04-T02-android-rideflow-viewmodel.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T03-ios-idle-planning-wiring.md](CHAT-S04-T03-ios-idle-planning-wiring.md) (swift-implementer, 360 min)
- [CHAT-S04-T04-android-idle-planning-wiring.md](CHAT-S04-T04-android-idle-planning-wiring.md) (kotlin-implementer, 360 min)
- [CHAT-S04-T05-ios-route-results-wiring.md](CHAT-S04-T05-ios-route-results-wiring.md) (swift-implementer, 240 min)
- [CHAT-S04-T06-android-route-results-wiring.md](CHAT-S04-T06-android-route-results-wiring.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T07-ios-route-details-wiring.md](CHAT-S04-T07-ios-route-details-wiring.md) (swift-implementer, 180 min)
- [CHAT-S04-T08-android-route-details-wiring.md](CHAT-S04-T08-android-route-details-wiring.md) (kotlin-implementer, 180 min)
- [CHAT-S04-T09a-ios-optimistic-ui-cancel.md](CHAT-S04-T09a-ios-optimistic-ui-cancel.md) (swift-implementer, 240 min)
- [CHAT-S04-T09b-android-optimistic-ui-cancel.md](CHAT-S04-T09b-android-optimistic-ui-cancel.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T10a-ios-laneshadow-error.md](CHAT-S04-T10a-ios-laneshadow-error.md) (swift-implementer, 180 min)
- [CHAT-S04-T10b-android-laneshadow-error.md](CHAT-S04-T10b-android-laneshadow-error.md) (kotlin-implementer, 180 min)

**Note:** Original SPRINT.md table tasks T09 and T10 were split into platform-specific files (T09a/T09b, T10a/T10b) per RULES.md "Platform ownership rule for sprint execution" — iOS uses `swift-*` agents; Android uses `kotlin-*` agents. The split preserves agent ownership clarity and matches Sprint 03's task structure.

## Remediation Tasks

Generated by `/kb-sprint-tasks-plan` on 2026-05-03 in response to red-hat review `.spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md` — sprint declared NOT code-complete with 3 CRITICAL findings, 5 HIGH findings, and zero E2E coverage of the 8 human gate steps.

**E2E baseline (NON-NEGOTIABLE):** Each of the 8 SPRINT.md human-test steps must be backed by an automated native E2E test before sprint-04 can close. R08 (iOS XCUITest) + R12 (Android Compose UI Test) are the gate.

| ID | Title | Agent | Estimate | Depends on | Blocks |
|----|-------|-------|----------|------------|--------|
| CHAT-S04-R01 | Convex `db.routeEnrichments.list` reactive query (F-07) | convex-implementer | 90 min | — | R05, R08, R12 |
| CHAT-S04-R02 | Convex `db.savedRoutes.getRouteIndexFingerprint` query + composite index (F-08) | convex-implementer | 90 min | — | R08, R12 |
| CHAT-S04-R03 | Auth taxonomy (UNAUTHENTICATED/FORBIDDEN structured ConvexError) + IDOR fix on `getActiveRoutePlansForSession` + `auth-error-taxonomy.json` fixture (F-04 + F-09) | convex-implementer | 120 min | — | R12, R13, R14 |
| CHAT-S04-R04 | Remove `fetchWeather` LLM tool stub + fix `updateSessionTitle` ownership bug (F-11 + F-12) | convex-implementer | 90 min | — | — |
| CHAT-S04-R05 | iOS `RouteDetailsScreen` viewState live wiring (real polylines, isBest, timeRange) (F-17) | swift-implementer | 180 min | R01 | R08 |
| CHAT-S04-R06 | iOS phase name alignment to canonical taxonomy `parsing/searching/drafting/enriching/finalizing` (F-06) | swift-implementer | 60 min | — | R08 |
| CHAT-S04-R07 | iOS sandbox story ID format normalization to `templates.{component-kebab}-screen.{variant}` (F-16) | swift-implementer | 60 min | — | R10 |
| CHAT-S04-R08 | iOS XCUITest E2E suite — **8 ACs mapping 1:1 to SPRINT.md gate steps** (Simulator + physical iPhone, xcresult + screenshot evidence) | swift-implementer | 360 min | R01, R02, R05, R06 | — |
| CHAT-S04-R09 | Android `RouteResultsScreen` route card tap forwarding + recall chip + alt polyline promotion (F-18) | kotlin-implementer | 180 min | — | R12 |
| CHAT-S04-R10 | Android `AppStories` registration for ~36 sprint-04 template stories with canonical IDs (F-15) | kotlin-implementer | 90 min | R07 | R12 |
| CHAT-S04-R11 | Android phase name alignment to canonical taxonomy (F-06) | kotlin-implementer | 60 min | — | R12 |
| CHAT-S04-R12 | Android instrumented Compose E2E suite — **8 ACs mapping 1:1 to SPRINT.md gate steps** + MANUAL real-device annotation per RULES.md | kotlin-implementer | 360 min | R01, R02, R03, R09, R10, R11 | — |
| CHAT-S04-R13 | iOS `LaneShadowErrorMapping` consumes `auth-error-taxonomy.json` fixture (closes F-04 sign-out flow on iOS) | swift-implementer | 30 min | R03 | — |
| CHAT-S04-R14 | Android `LaneShadowErrorMapper` consumes `auth-error-taxonomy.json` fixture (closes F-04 sign-out flow on Android) | kotlin-implementer | 30 min | R03 | — |

### Remediation Task Files

- [CHAT-S04-R01-convex-route-enrichments-list.md](CHAT-S04-R01-convex-route-enrichments-list.md) (convex-implementer, 90 min)
- [CHAT-S04-R02-convex-saved-routes-fingerprint.md](CHAT-S04-R02-convex-saved-routes-fingerprint.md) (convex-implementer, 90 min)
- [CHAT-S04-R03-convex-auth-taxonomy-and-idor.md](CHAT-S04-R03-convex-auth-taxonomy-and-idor.md) (convex-implementer, 120 min)
- [CHAT-S04-R04-convex-tool-and-mutation-fixes.md](CHAT-S04-R04-convex-tool-and-mutation-fixes.md) (convex-implementer, 90 min)
- [CHAT-S04-R05-ios-route-details-live-wiring.md](CHAT-S04-R05-ios-route-details-live-wiring.md) (swift-implementer, 180 min)
- [CHAT-S04-R06-ios-phase-name-alignment.md](CHAT-S04-R06-ios-phase-name-alignment.md) (swift-implementer, 60 min)
- [CHAT-S04-R07-ios-story-id-normalization.md](CHAT-S04-R07-ios-story-id-normalization.md) (swift-implementer, 60 min)
- [CHAT-S04-R08-ios-e2e-xcuitest-baseline.md](CHAT-S04-R08-ios-e2e-xcuitest-baseline.md) (swift-implementer, 360 min)
- [CHAT-S04-R09-android-route-results-tap-recall.md](CHAT-S04-R09-android-route-results-tap-recall.md) (kotlin-implementer, 180 min)
- [CHAT-S04-R10-android-app-stories-sprint04.md](CHAT-S04-R10-android-app-stories-sprint04.md) (kotlin-implementer, 90 min)
- [CHAT-S04-R11-android-phase-name-alignment.md](CHAT-S04-R11-android-phase-name-alignment.md) (kotlin-implementer, 60 min)
- [CHAT-S04-R12-android-e2e-instrumented-baseline.md](CHAT-S04-R12-android-e2e-instrumented-baseline.md) (kotlin-implementer, 360 min)
- [CHAT-S04-R13-ios-mapper-align-auth-taxonomy.md](CHAT-S04-R13-ios-mapper-align-auth-taxonomy.md) (swift-implementer, 30 min)
- [CHAT-S04-R14-android-mapper-align-auth-taxonomy.md](CHAT-S04-R14-android-mapper-align-auth-taxonomy.md) (kotlin-implementer, 30 min)

**Suggested wave plan for `/kb-run-sprint --limit 2`:**
- Wave 0 (parallel-2): R01, R02 (independent Convex endpoints) → R03 → R04
- Wave 1 (parallel-2): R06, R07 (iOS standalone) ‖ R09, R11 (Android standalone)
- Wave 2 (parallel-2): R05 (depends R01) ‖ R10 (depends R07) ‖ R13 (depends R03) ‖ R14 (depends R03)
- Wave 3 (sequential): R08 (iOS E2E gate) → R12 (Android E2E gate)

**Sprint-04 closure gate:** All 14 remediation tasks merged + R08 (iOS) + R12 (Android) E2E suites green on real Convex backend → re-run `/review-red-hat` to confirm CRITICAL findings closed → human walks the 8-step gate on real iPhone with R08 evidence artifacts attached.

## Source Coverage

- UC-CHAT-01 (Plan a ride via suggestion chip — happy path)
- UC-CHAT-02 (Plan via free-text chat input)
- UC-CHAT-03 (Refine an existing plan in same session)
- UC-CHAT-04 (Cancel an in-flight plan)
- UC-CHAT-06 (Error mapping side — typed LaneShadowError)
- `architecture/ios-architecture.md` § 3-5 (RideFlow, ChatStore, SessionStore, real-data wiring)
- `architecture/android-architecture.md` § State + Convex wrapper
- `11-technical-requirements.md` § State Machine + Reactivity Patterns + Error Handling

## Blocks

- Blocks: Sprint 05 (Saved Routes, Sessions & Settings)
- Dependent on: Sprint 03 (Auth & Convex Foundation)
