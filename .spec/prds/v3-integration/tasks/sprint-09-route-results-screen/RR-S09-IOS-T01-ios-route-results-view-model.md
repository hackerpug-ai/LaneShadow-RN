# RR-S09-IOS-T01 — iOS MapAppViewModel routeResults extension: live Convex bindings

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-IOS-T01
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03 (route results with real route_plans), UC-CHAT-04 (chat-refine reuses session), Sprint 09 — MapApp Route Results State

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, route-results is a STATE of `MapApp`, never a sibling screen. This task extends the unified `MapAppViewModel` (Sprint 08 cycle 1, commit `bc0a5976b`) so when `MapAppState == .routeResults(sessionId:routePlanId:)` the view-model binds the live `routePlans.getPlanById` subscription, derives the `{best, alt1, alt2}` triple, and exposes the routeResults intent surface (`selectAlt`, `refine`, `dismissMessage`, `recallMessage`).

Sprint 09 supersedes the pre-doctrine `RouteResultsScreen.swift` mock-provider path (`RouteResultsMockProvider`) — the legacy file at `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` was a sandbox-only fixture and is NOT extended here. All live behavior lands on `MapApp` + `MapAppViewModel` + `MapAppState.routeResults`. The pre-existing `MapAppState.routeResults(sessionId: String, routePlanId: String)` placeholder enum case (declared in `ios/LaneShadow/Features/MapApp/MapAppState.swift`) is the integration point.

The view-model binds to `db.routePlans.getPlanById({routePlanId})` via the existing ConvexClient wiring, derives a `{best, alt1, alt2}` triple from `plan.options[]` per the deterministic ordering documented in RR-S09-CVX-T01, exposes the three polylines + cards + selectedRouteId for the composition task (RR-S09-IOS-T02), and exposes the alt-selection, refine, and dismiss/recall intents.

The view-model is the **single bridge** between Convex subscription data and the SwiftUI composition. It MUST NOT contain SwiftUI body code, MUST NOT contain Mapbox configuration, and MUST NOT decode polylines in non-pure helpers; polyline string → coordinates decoding belongs in the existing `Convex/Polyline.swift` (or equivalent helper module). The view-model only exposes the **shape** of the data that the composition consumes.

`MapAppViewModel` (already `@Observable`, owning `IdleViewModel`) is the architectural mirror — a routeResults sub-coordinator (e.g., `RouteResultsCoordinator`) MAY be introduced internally but the public API consumed by `MapApp.swift` lives on `MapAppViewModel` itself so the composition reads `mapAppViewModel.polylines`, `mapAppViewModel.cards`, `mapAppViewModel.selectAlt(_:)`, etc., without knowing about an internal coordinator. The `selectedRouteId` lives **only on the view-model**, never on the Convex server (per the RR-S09-CVX-T01 policy note). The chat-refine intent reuses the same `agent.sendMessage` action wired in Sprint 04 and mutates `MapAppState` back to `.planning(sessionId:)`.

## Critical Constraints

**MUST:**
- MUST extend the existing `@Observable` `MapAppViewModel` at `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (do NOT create a sibling `RouteResultsViewModel.swift`)
- MUST bind to `db.routePlans.getPlanById({routePlanId})` via the existing `ConvexClient` subscribe API when `MapAppState == .routeResults(...)`; reuse the existing subscription helper from the planning binding if present (do NOT roll a new subscription manager)
- MUST derive `polylines: [PolylineData]` from `plan.options[]` with per-variant tokens: best → `LaneShadowTheme.colors.route.best` (solid, 3.5px); alt1 → `LaneShadowTheme.colors.route.alt1` (dashed `6 4`, 2.5px); alt2 → `LaneShadowTheme.colors.route.alt2` (dashed `3 4`, 2.5px); use `LaneShadowTheme` tokens for ALL colors and stroke widths (no hex, no numeric literals outside the dash arrays which are SVG attributes per design-system README)
- MUST derive `cards: [RouteAttachmentCardModel]` from `plan.options[]` with `id`, `title`, `via`, `distanceMiles`, `durationMinutes`, `scenicScore`, `weatherBadge: WeatherBadgeModel?` (populated when `route_enrichments.status == "completed"`), `colorToken: LaneShadowTheme.Color` matching the polyline variant
- MUST expose `selectedRouteId: String?` as a published property (Observable-tracked) on `MapAppViewModel`; initialize to `plan.options.first?.id` (the "best" option) on plan completion
- MUST expose `selectAlt(_ id: String)` intent that updates `selectedRouteId`; calling with the current selectedRouteId is a no-op (idempotent)
- MUST expose `refine(_ prompt: String)` intent that calls `agent.sendMessage({ sessionId: self.sessionId, message: prompt })` and **mutates `MapAppState` back to `.planning(sessionId:)`** — DO NOT mint a new sessionId; DO NOT push a NavigationStack destination
- MUST expose `dismissMessage()` / `recallMessage()` intents that flip `isMessageDismissed: Bool`; this is purely client-side, no Convex calls
- MUST expose `isMessageDismissed: Bool` (default false) for the composition to drive `LSNavigatorMessage` vs Recall chip rendering inside `MapApp`'s overlay arrays
- MUST add unit tests in `ios/LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests.swift` covering: subscription binding produces three PolylineData entries with correct tokens; selectAlt updates selectedRouteId; refine calls sendMessage with same sessionId AND mutates state to `.planning(sessionId:)`; dismiss/recall flips the flag; weather badge populates from enrichments; fewer-than-3 options yields a 2- or 1-entry polylines array (V01 Two Candidates); empty options surfaces error state

**NEVER:**
- NEVER create `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` or any sibling view-model — the routeResults state belongs on `MapAppViewModel` per the One View, Many States doctrine
- NEVER extend the legacy `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` or `RouteResultsMockProvider` in the live path; those are pre-doctrine sandbox-only fixtures awaiting MAPAPP-UNIFY cleanup
- NEVER hardcode color hex strings, RGB tuples, numeric stroke widths (except the SVG dash arrays which match the design-system README literal-constant exemption), or polyline decode magic; route ALL of these through `LaneShadowTheme` tokens or the existing `Convex/Polyline.swift` decoder
- NEVER persist `selectedRouteId` to Convex; selection is client-side per RR-S09-CVX-T01 policy
- NEVER call `db.routePlans.cancelPlan` from the routeResults path (cancel belongs to the planning state's binding; results-state doesn't cancel)
- NEVER mint a new `sessionId` on refine; the active `sessionId` is reused per UC-CHAT-04 state machine (`ROUTE_RESULTS → PLANNING on refine via chat input (reuses session)`)
- NEVER push a NavigationStack destination on refine — refine is a `MapAppState` mutation only
- NEVER decode `option.polyline` in the view-model itself; delegate to `Convex/Polyline.swift` or equivalent decoder helper
- NEVER hold a strong reference cycle from the subscription closure back to `self`; use `[weak self]` per the Sprint 08 binding pattern

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` § State-Driven Views (Persistent Host) AND § @Observable view-models — model owns state + intents; SwiftUI views are presentational
- STRICTLY use `LaneShadowTheme.colors.route.{best,alt1,alt2}` tokens (or the existing equivalents in the theme) — do NOT introduce new color tokens in this task; if a route color is missing, file a follow-up task
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 after view-model changes; the view-model code MUST be token-pure
- STRICTLY treat the empty-options edge case (`plan.options == []`) as an error state surfaced via `MapAppState` (e.g., a future `.error` case) NOT a "render 0 polylines" success path; until `.error` lands, surface via the view-model's error property and let the composition render a terminal state inside `.routeResults`

## Specification

**Objective:** Extend the `@Observable` `MapAppViewModel` to bind `db.routePlans.getPlanById` when `MapAppState == .routeResults(...)`, derive a deterministic `{best, alt1, alt2}` triple of polylines + cards with token-driven styling, expose `selectedRouteId` + `selectAlt(id:)` + `refine(prompt:)` + `dismissMessage()` + `recallMessage()` + `isMessageDismissed`, and add unit tests covering all happy-path + edge-case derivations. The view-model MUST keep `MapApp` rendering on the same instance throughout — refine mutates state back to `.planning`, never pushes a navigation destination.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests` exits 0 with all new tests passing. `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exits 0. `swiftlint lint ios/LaneShadow/Features/MapApp/` exits 0. `scripts/tokens/enforce-native-compliance.sh` exits 0. The extended `MapAppViewModel` is consumed by RR-S09-IOS-T02 (composition) which is the next task in the iOS wave.

## Acceptance Criteria

### AC-1 — Subscription binding produces three PolylineData entries with correct tokens

**GIVEN** `MapAppState == .routeResults(sessionId:, routePlanId:)` with a completed `route_plans` row containing 3 options
**WHEN** `MapAppViewModel.observeRouteResults(routePlanId:)` (or equivalent state-entry hook) is called and the subscription delivers the plan
**THEN** `mapAppViewModel.polylines.count == 3`; `polylines[0].colorToken == .route.best` (best, solid, 3.5px); `polylines[1].colorToken == .route.alt1` (alt1, dashed `6 4`, 2.5px); `polylines[2].colorToken == .route.alt2` (alt2, dashed `3 4`, 2.5px); each `PolylineData.coordinates` is a non-empty `[CLLocationCoordinate2D]` array decoded from `option.polyline`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_subscription_producesThreePolylinesWithTokens`

### AC-2 — selectAlt(id:) updates selectedRouteId; idempotent on same id

**GIVEN** `mapAppViewModel.selectedRouteId == "best-id"` (initial state after plan completion)
**WHEN** `mapAppViewModel.selectAlt("alt1-id")` is called, followed by `mapAppViewModel.selectAlt("alt1-id")` a second time
**THEN** after the first call, `selectedRouteId == "alt1-id"`; after the second call, `selectedRouteId == "alt1-id"` (no spurious change events fired); calling with an unknown id is treated as no-op + logged warning
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_selectAlt_updatesAndIsIdempotent`

### AC-3 — refine(prompt:) calls sendMessage with same sessionId AND mutates MapAppState to .planning

**GIVEN** `mapAppViewModel.state == .routeResults(sessionId: "sess-xyz", routePlanId: "plan-123")` and a stub `agent.sendMessage` action observer
**WHEN** `mapAppViewModel.refine("make it shorter")` is called
**THEN** the stub records exactly one call with arguments `{ sessionId: "sess-xyz", message: "make it shorter" }` AND `mapAppViewModel.state` mutates to `.planning(sessionId: "sess-xyz")` — DO NOT mint a new sessionId; NO NavigationStack push event is emitted
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_refine_callsSendMessageWithSameSessionAndMutatesStateToPlanning`

### AC-4 — dismissMessage / recallMessage flip isMessageDismissed; no Convex call

**GIVEN** `mapAppViewModel.isMessageDismissed == false` (initial state)
**WHEN** `mapAppViewModel.dismissMessage()` is called, followed by `mapAppViewModel.recallMessage()`
**THEN** after dismiss, `isMessageDismissed == true`; after recall, `isMessageDismissed == false`; ZERO Convex mutations are recorded by the stub Convex client during the sequence
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_dismissAndRecall_flipsFlagWithNoConvexCall`

### AC-5 — Weather badge populates from route_enrichments when status is "completed"

**GIVEN** `MapAppState == .routeResults` with a 3-option plan AND a `route_enrichments` subscription returning `{ "best-id": { weather: "clear", time: "morning", status: "completed" }, "alt1-id": { weather: "rain", time: "afternoon", status: "completed" }, "alt2-id": { status: "pending" } }`
**WHEN** the view-model derives `cards: [RouteAttachmentCardModel]`
**THEN** `cards[0].weatherBadge == .clear` (best, completed); `cards[1].weatherBadge == .rain` (alt1, completed); `cards[2].weatherBadge == nil` (alt2, pending — badge hidden until enrichment completes)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_weatherBadge_populatesFromEnrichmentsCompleted`

### AC-6 — Fewer-than-3 options yields a 2- or 1-entry polylines array (V01 Two Candidates)

**GIVEN** `MapAppState == .routeResults` with exactly 2 options in the plan
**WHEN** the subscription delivers
**THEN** `mapAppViewModel.polylines.count == 2`; `polylines[0]` is the best option; `polylines[1]` is alt1; `mapAppViewModel.cards.count == 2` (matching); accessing a third element via `polylines[2]` is NOT possible (array bounds enforced)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_twoCandidates_yieldsTwoEntries`

### AC-7 — Empty-options surfaces error state, not silent success

**GIVEN** `MapAppState == .routeResults` resolving to a plan with `options: []` (edge case — should never happen per agent contract but defensively handled)
**WHEN** the subscription delivers
**THEN** `mapAppViewModel.routeResultsErrorState` is set to `.noOptions("Plan returned zero options")` (or equivalent); `polylines.count == 0`; the composition is notified to render a terminal error overlay inside the `.routeResults` state (not a navigation push to a sibling ErrorScreen)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_emptyOptions_surfacesErrorState`

### AC-8 — Token purity in view-model file

**GIVEN** the modified `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (and any new types under `ios/LaneShadow/Features/MapApp/RouteResults/`)
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with zero `Color(red:...)` calls, zero hex strings (e.g., `#D9742A`), zero numeric font sizes, zero hardcoded CGFloat color values outside the documented dash-array exemption
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -rE 'Color\(red:|#[0-9A-Fa-f]{6}|\.font\(\.system\(size:' ios/LaneShadow/Features/MapApp/ | wc -l` returns 0

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Subscription delivers 3 options → polylines.count == 3 with correct tokens for best/alt1/alt2 | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_subscription_producesThreePolylinesWithTokens` | happy_path |
| TC-2 | selectAlt updates selectedRouteId; second call with same id is no-op | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_selectAlt_updatesAndIsIdempotent` | happy_path |
| TC-3 | refine calls sendMessage with same sessionId; mutates MapAppState to .planning | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_refine_callsSendMessageWithSameSessionAndMutatesStateToPlanning` | happy_path |
| TC-4 | dismiss + recall flip flag, zero Convex calls recorded | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_dismissAndRecall_flipsFlagWithNoConvexCall` | happy_path |
| TC-5 | weatherBadge populated from completed enrichments; nil for pending | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_weatherBadge_populatesFromEnrichmentsCompleted` | edge |
| TC-6 | Two-option plan → polylines.count == 2, cards.count == 2 | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_twoCandidates_yieldsTwoEntries` | edge |
| TC-7 | Empty options → errorState set, polylines empty, no silent success | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_emptyOptions_surfacesErrorState` | error |
| TC-8 | View-model file passes token compliance script with zero violations | AC-8 | `scripts/tokens/enforce-native-compliance.sh && grep -rE 'Color\(red:\|#[0-9A-Fa-f]{6}\|\.font\(\.system\(size:' ios/LaneShadow/Features/MapApp/ \| wc -l` returns 0 | edge |
| TC-9 | Build + lint clean across modified files | AC-1, AC-8 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/MapApp/` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` | all | [PRIMARY ARCHITECTURE] Existing `@Observable` view-model — extend with routeResults binding; reuse subscription + intent patterns from idle/planning bindings |
| `ios/LaneShadow/Features/MapApp/MapAppState.swift` | all | [PRIMARY ARCHITECTURE] Discriminated union — `.routeResults(sessionId:routePlanId:)` placeholder case is the integration point |
| `ios/LaneShadow/Views/Templates/MapApp.swift` | all | Persistent host — understand how state-derived overlays consume view-model published properties; do NOT modify in this task |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | all | Sprint 08 ViewModel architectural reference — `@Observable`, subscription binding via ConvexClient, intent methods, weak-self closure pattern, error state handling (note: the planning binding may already live inside `MapAppViewModel`; confirm at task start) |
| `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` | 1-259 | [LEGACY — read for shape only] Pre-doctrine sandbox-only template; understand `RouteResultsScreenState` shape to mirror the published surface on `MapAppViewModel`; do NOT extend this file |
| `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` | all | Mock fixture shape — `routeOptions`, polyline format, card model; the new view-model must produce data of the same shape so sandbox stories can re-use it via `MapAppState` injection |
| `ios/LaneShadow/Convex/Polyline.swift` (or equivalent decoder) | all | Polyline string → `[CLLocationCoordinate2D]` decoder; reuse, do NOT re-implement |
| `ios/LaneShadow/Convex/ConvexClient.swift` (or wrapper) | all | `subscribe(query:args:)` API surface |
| `server/convex/db/routePlans.ts` | 191-253 (getPlanByIdHandler) | Return shape — what fields the subscription delivers (note: RR-S09-CVX-T01 documents the `{best, alt1, alt2}` ordering invariant) |
| `.spec/prds/v3-integration/architecture/ios-architecture.md` | §5.3 RouteResultsScreen | Historical iOS architecture spec — read for state.routes / polyline mapping; the canonical home for that logic is now `MapAppViewModel` per the doctrine |
| `.spec/prds/v3-integration/05-uc-chat.md` | UC-CHAT-03 + UC-CHAT-04 | AC list — refine reuses sessionId, weather badge from enrichments |
| `RULES.md` | "Design Rules › One View, Many States", "Convex Backend", "Cross-Platform Component Parity", "Verification Standards by Platform" | Project-wide rules INCLUDING the doctrine this task implements |
| `brain/docs/mobile-architecture/ios-principles.md` | "@Observable view-models" + "State-Driven Views (Persistent Host)" | View-model + persistent-host patterns |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (MODIFY — extend with routeResults binding + intents)
- `ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsCoordinator.swift` (NEW — optional internal sub-coordinator owned by `MapAppViewModel`; the public API still lives on `MapAppViewModel`)
- `ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsTypes.swift` (NEW — `PolylineData`, `RouteAttachmentCardModel`, `WeatherBadgeModel`, `RouteResultsError` types if they don't already exist)
- `ios/LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests.swift` (NEW)
- `ios/project.yml` (MODIFY only if file additions require regeneration via `scripts/ios/generate-project.sh`)

**Write-Prohibited:**
- `ios/LaneShadow/Features/MapApp/MapAppState.swift` — owned by MAPAPP-UNIFY; the `.routeResults(sessionId:routePlanId:)` case is already declared and is the integration point; if the case shape needs evolution (e.g., adding associated values), file a follow-up rather than modifying here
- `ios/LaneShadow/Views/Templates/MapApp.swift` — owned by RR-S09-IOS-T02 (composition); this task only extends the ViewModel
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` — pre-doctrine sandbox-only fixture; do NOT extend; MAPAPP-UNIFY will remove
- `ios/LaneShadow/Features/RouteResults/` — do NOT create this directory; routeResults code lives under `ios/LaneShadow/Features/MapApp/RouteResults/`
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` — do NOT modify; sandbox fixtures stay mock; the live path goes through `MapAppViewModel`
- `ios/LaneShadow/Convex/Polyline.swift` — existing decoder, do NOT modify
- `ios/LaneShadow/Convex/ConvexClient.swift` — existing client, do NOT modify
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — Sprint 08 ownership (note: the planning binding may already be folded into `MapAppViewModel` post-MAPAPP-UNIFY; confirm at task start)
- `server/**`, `android/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated; regenerate via `scripts/ios/generate-project.sh`, never hand-edit

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (visual contract — polyline strokes, card composition)
- `.spec/design/system/views/route-results-screen/README.md` (variant matrix)
- `.spec/design/system/views/route-results-screen/default--best-pre-selected/default--best-pre-selected.light.png` (S01 reference)
- `.spec/prds/v3-integration/architecture/ios-architecture.md` §5.3 RouteResultsScreen (read as historical context — canonical home is now `MapAppViewModel`)
- `.spec/prds/v3-integration/05-uc-chat.md` UC-CHAT-03 + UC-CHAT-04
- `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` + `MapAppState.swift` as the architectural foundation

**Interaction Notes:** No direct user interactions in this task — the view-model exposes intent methods that the composition task (RR-S09-IOS-T02) wires to user gestures inside `MapApp`'s state-derived overlays. The view-model is responsible for: (a) translating Convex subscription data into a polyline/card model with token-driven styling, (b) preserving the `{best, alt1, alt2}` ordering from RR-S09-CVX-T01, (c) exposing the four intent methods (`selectAlt`, `refine`, `dismissMessage`, `recallMessage`) that the composition calls, (d) mutating `MapAppState` (not pushing navigation) on refine.

**Pattern:** `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (Sprint 08 cycle 1) — same `@Observable` macro, same subscription binding pattern via ConvexClient, same intent-method shape. Mirror the `[weak self]` closure pattern to avoid retain cycles. The internal organization (one large `MapAppViewModel` vs. delegated sub-coordinators) is at implementer discretion as long as the public API remains unified on `MapAppViewModel`.

**Pattern Source:** `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (Sprint 08 cycle 1, commit `bc0a5976b`)

**Anti-Pattern:** Creating a sibling `RouteResultsViewModel.swift`; decoding polylines inside the view-model (use `Convex/Polyline.swift`); persisting `selectedRouteId` to Convex (it's client-side); minting a new `sessionId` on refine (reuse the active one); pushing a NavigationStack destination on refine (mutate `MapAppState` instead); strong-reference cycles via the subscription closure (use `[weak self]`); hardcoding color hex (use theme tokens); rendering 0-option plans as silent success (surface as error state inside `.routeResults`).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_subscription_producesThreePolylinesWithTokens` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_selectAlt_updatesAndIsIdempotent` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_refine_callsSendMessageWithSameSessionAndMutatesStateToPlanning` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_dismissAndRecall_flipsFlagWithNoConvexCall` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_weatherBadge_populatesFromEnrichmentsCompleted` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_twoCandidates_yieldsTwoEntries` |
| AC-7 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_emptyOptions_surfacesErrorState` |
| AC-8 | `scripts/tokens/enforce-native-compliance.sh` (exit 0); `grep -rE 'Color\(red:\|#[0-9A-Fa-f]{6}' ios/LaneShadow/Features/MapApp/ \| wc -l` returns 0 |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/MapApp/` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** iOS view-model extension + unit tests under `ios/LaneShadow/Features/MapApp/` and `ios/LaneShadowTests/Features/MapApp/`. Matches `swift-implementer` mandate — `@Observable`, SwiftData (not used here but adjacent), XCTest, XcodeBuildMCP. The view-model is the bridge between Convex subscription data and the SwiftUI composition; no SwiftUI body code lives here. Reviewer is `swift-reviewer` per RULES.md.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Observable`, dependency injection, intent methods, State-Driven Views)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-model unit tests via Combine subjects / stub clients)
- `brain/docs/mobile-architecture/performance-optimization.md` (avoid unnecessary publishing; only mutate when state changes)
- `RULES.md` § Design Rules › One View, Many States, §"Convex Backend", §"Verification Standards by Platform", §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-CVX-T01 (consumes the documented `{best, alt1, alt2}` ordering invariant + chat-refine sessionId reuse contract)
- MAPAPP-UNIFY (#1361) Sprint 08 cycle 1 (provides the `MapAppViewModel` + `MapAppState` foundation; commit `bc0a5976b`)

**Blocks:**
- RR-S09-IOS-T02 (composition consumes the extended `MapAppViewModel`)
- RR-S09-IOS-T03 (polyline rendering binds to `mapAppViewModel.polylines`)
- RR-S09-IOS-T04 (chat-refine + dismiss/recall wires the view-model intents)
- RR-S09-IOS-T05 (capture tests use the live view-model with stub Convex data via `MapAppState` injection)
- RR-S09-E2E-IOS-T01 (E2E asserts view-model intent flows end-to-end + `MapApp` host identity preservation)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Subscription delivers 3 options when MapAppState == .routeResults; mapAppViewModel.polylines.count == 3 with best/alt1/alt2 token assignment correct","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"selectAlt updates selectedRouteId; second call with same id is idempotent no-op","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"refine calls sendMessage with same sessionId AND mutates MapAppState to .planning(sessionId:); no NavigationStack push","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_refine_callsSendMessageWithSameSessionAndMutatesStateToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"dismissMessage + recallMessage flip isMessageDismissed with zero Convex mutations","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Weather badge populates from route_enrichments where status == completed; nil for pending","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_weatherBadge_populatesFromEnrichmentsCompleted","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Two-option plan yields polylines.count == 2 (V01 Two Candidates variant)","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Empty options ([]) surfaces routeResultsErrorState; polylines.count == 0; composition renders terminal error overlay inside .routeResults (not navigation push)","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"View-model directory is token-pure; no hex/RGB/numeric font/hardcoded color literals","verify":"scripts/tokens/enforce-native-compliance.sh && grep -rE pattern ios/LaneShadow/Features/MapApp/ | wc -l == 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Three-option plan test produces three polylines with correct tokens","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"selectAlt idempotency test","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"refine sends with same sessionId + mutates MapAppState to .planning","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_refine_callsSendMessageWithSameSessionAndMutatesStateToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"dismiss + recall flag flip with no Convex calls","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Weather badge derivation from completed enrichments","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_weatherBadge_populatesFromEnrichmentsCompleted","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-option edge case produces 2 polylines","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Empty options error state surfaced","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/MapApp/MapAppViewModelRouteResultsTests/test_emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Token compliance + grep returns zero violations across MapApp feature dir","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/MapApp/","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
