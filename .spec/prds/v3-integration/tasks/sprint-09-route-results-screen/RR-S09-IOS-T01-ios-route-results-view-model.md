# RR-S09-IOS-T01 — iOS RouteResultsViewModel: live Convex bindings

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-IOS-T01
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03 (route results with real route_plans), UC-CHAT-04 (chat-refine reuses session), Sprint 09 — Map View Route Results State

## Background

Sprint 09 replaces the iOS `RouteResultsScreen.swift` mock-provider path (`RouteResultsMockProvider`) with a real Convex-backed `RouteResultsViewModel`. The view-model binds to `db.routePlans.getPlanById({routePlanId})` via the existing ConvexClient wiring, derives a `{best, alt1, alt2}` triple from `plan.options[]` per the deterministic ordering documented in RR-S09-CVX-T01, exposes the three polylines + cards + selectedRouteId for the composition task (RR-S09-IOS-T02), and exposes the alt-selection, refine, and dismiss/recall intents that the composition task wires through.

The view-model is the **single bridge** between Convex subscription data and the SwiftUI composition. It MUST NOT contain SwiftUI body code, MUST NOT contain Mapbox configuration, and MUST NOT decode polylines in non-pure helpers; polyline string → coordinates decoding belongs in the existing `Convex/Polyline.swift` (or equivalent helper module). The view-model only exposes the **shape** of the data that the composition consumes.

PlanningViewModel (Sprint 08) is the architectural mirror for this task — same `@Observable` macro, same intent-method shape, same separation between subscription binding and view composition. The dismiss/recall intents are new (no Sprint 08 analogue); the chat-refine intent reuses the same `agent.sendMessage` action wired in Sprint 04. The `selectedRouteId` lives **only on the view-model**, never on the Convex server (per the RR-S09-CVX-T01 policy note).

## Critical Constraints

**MUST:**
- MUST use `@Observable` macro (Swift 5.9+) — match the Sprint 08 `PlanningViewModel` shape exactly
- MUST bind to `db.routePlans.getPlanById({routePlanId})` via the existing `ConvexClient` subscribe API; reuse the existing subscription helper from `PlanningViewModel` if present (do NOT roll a new subscription manager)
- MUST derive `polylines: [PolylineData]` from `plan.options[]` with per-variant tokens: best → `LaneShadowTheme.colors.route.best` (solid, 3.5px); alt1 → `LaneShadowTheme.colors.route.alt1` (dashed `6 4`, 2.5px); alt2 → `LaneShadowTheme.colors.route.alt2` (dashed `3 4`, 2.5px); use `LaneShadowTheme` tokens for ALL colors and stroke widths (no hex, no numeric literals outside the dash arrays which are SVG attributes per design-system README)
- MUST derive `cards: [RouteAttachmentCardModel]` from `plan.options[]` with `id`, `title`, `via`, `distanceMiles`, `durationMinutes`, `scenicScore`, `weatherBadge: WeatherBadgeModel?` (populated when `route_enrichments.status == "completed"`), `colorToken: LaneShadowTheme.Color` matching the polyline variant
- MUST expose `selectedRouteId: String?` as a published property (Observable-tracked); initialize to `plan.options.first?.id` (the "best" option) on plan completion
- MUST expose `selectAlt(_ id: String)` intent that updates `selectedRouteId`; calling with the current selectedRouteId is a no-op (idempotent)
- MUST expose `refine(_ prompt: String)` intent that calls `agent.sendMessage({ sessionId: self.sessionId, message: prompt })` and transitions the parent flow state machine back to `.planning(sessionId:)` — DO NOT mint a new sessionId
- MUST expose `dismissMessage()` / `recallMessage()` intents that flip `isMessageDismissed: Bool`; this is purely client-side, no Convex calls
- MUST expose `isMessageDismissed: Bool` (default false) for the composition to drive `LSNavigatorMessage` vs Recall chip rendering
- MUST add unit tests in `ios/LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests.swift` covering: subscription binding produces three PolylineData entries with correct tokens; selectAlt updates selectedRouteId; refine calls sendMessage with same sessionId; dismiss/recall flips the flag; weather badge populates from enrichments; fewer-than-3 options yields a 2- or 1-entry polylines array (V01 Two Candidates)

**NEVER:**
- NEVER hardcode color hex strings, RGB tuples, numeric stroke widths (except the SVG dash arrays which match the design-system README literal-constant exemption), or polyline decode magic; route ALL of these through `LaneShadowTheme` tokens or the existing `Convex/Polyline.swift` decoder
- NEVER persist `selectedRouteId` to Convex; selection is client-side per RR-S09-CVX-T01 policy
- NEVER call `db.routePlans.cancelPlan` from this view-model (cancel belongs to PlanningViewModel; results-state doesn't cancel)
- NEVER mint a new `sessionId` on refine; the active `sessionId` is reused per UC-CHAT-04 state machine (`ROUTE_RESULTS → PLANNING on refine via chat input (reuses session)`)
- NEVER decode `option.polyline` in the view-model itself; delegate to `Convex/Polyline.swift` or equivalent decoder helper
- NEVER hold a strong reference cycle from the subscription closure back to `self`; use `[weak self]` per the Sprint 08 PlanningViewModel pattern

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"@Observable view-models" — model owns state + intents; SwiftUI views are presentational
- STRICTLY use `LaneShadowTheme.colors.route.{best,alt1,alt2}` tokens (or the existing equivalents in the theme) — do NOT introduce new color tokens in this task; if a route color is missing, file a follow-up task
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 after view-model changes; the view-model code MUST be token-pure
- STRICTLY treat the empty-options edge case (`plan.options == []`) as an error state surfaced to the parent flow, NOT a "render 0 polylines" success path

## Specification

**Objective:** Implement a Swift `@Observable` `RouteResultsViewModel` that binds to `db.routePlans.getPlanById`, derives a deterministic `{best, alt1, alt2}` triple of polylines + cards with token-driven styling, exposes `selectedRouteId` + `selectAlt(id:)` + `refine(prompt:)` + `dismissMessage()` + `recallMessage()` + `isMessageDismissed`, and adds unit tests covering all happy-path + edge-case derivations.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests` exits 0 with all new tests passing. `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exits 0. `swiftlint lint ios/LaneShadow/Features/RouteResults/` exits 0. `scripts/tokens/enforce-native-compliance.sh` exits 0. The view-model is consumed by RR-S09-IOS-T02 (composition) which is the next task in the iOS wave.

## Acceptance Criteria

### AC-1 — Subscription binding produces three PolylineData entries with correct tokens

**GIVEN** a `routePlanId` with a completed `route_plans` row containing 3 options
**WHEN** `RouteResultsViewModel.observe(routePlanId:)` is called and the subscription delivers the plan
**THEN** `viewModel.polylines.count == 3`; `polylines[0].colorToken == .route.best` (best, solid, 3.5px); `polylines[1].colorToken == .route.alt1` (alt1, dashed `6 4`, 2.5px); `polylines[2].colorToken == .route.alt2` (alt2, dashed `3 4`, 2.5px); each `PolylineData.coordinates` is a non-empty `[CLLocationCoordinate2D]` array decoded from `option.polyline`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_subscription_producesThreePolylinesWithTokens`

### AC-2 — selectAlt(id:) updates selectedRouteId; idempotent on same id

**GIVEN** `viewModel.selectedRouteId == "best-id"` (initial state after plan completion)
**WHEN** `viewModel.selectAlt("alt1-id")` is called, followed by `viewModel.selectAlt("alt1-id")` a second time
**THEN** after the first call, `selectedRouteId == "alt1-id"`; after the second call, `selectedRouteId == "alt1-id"` (no spurious change events fired); calling with an unknown id is treated as no-op + logged warning
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_selectAlt_updatesAndIsIdempotent`

### AC-3 — refine(prompt:) calls sendMessage with same sessionId; transitions to planning state

**GIVEN** `viewModel.sessionId == "sess-xyz"` and a stub `agent.sendMessage` action observer
**WHEN** `viewModel.refine("make it shorter")` is called
**THEN** the stub records exactly one call with arguments `{ sessionId: "sess-xyz", message: "make it shorter" }` AND a parent-flow transition is emitted (e.g., via a `flowTransitionSubject` Combine subject or `@Bindable` flow-state binding) carrying `.planning(sessionId: "sess-xyz")` — DO NOT mint a new sessionId
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_refine_callsSendMessageWithSameSessionAndTransitionsToPlanning`

### AC-4 — dismissMessage / recallMessage flip isMessageDismissed; no Convex call

**GIVEN** `viewModel.isMessageDismissed == false` (initial state)
**WHEN** `viewModel.dismissMessage()` is called, followed by `viewModel.recallMessage()`
**THEN** after dismiss, `isMessageDismissed == true`; after recall, `isMessageDismissed == false`; ZERO Convex mutations are recorded by the stub Convex client during the sequence
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_dismissAndRecall_flipsFlagWithNoConvexCall`

### AC-5 — Weather badge populates from route_enrichments when status is "completed"

**GIVEN** a `routePlanId` with 3 options AND a `route_enrichments` subscription returning `{ "best-id": { weather: "clear", time: "morning", status: "completed" }, "alt1-id": { weather: "rain", time: "afternoon", status: "completed" }, "alt2-id": { status: "pending" } }`
**WHEN** the view-model derives `cards: [RouteAttachmentCardModel]`
**THEN** `cards[0].weatherBadge == .clear` (best, completed); `cards[1].weatherBadge == .rain` (alt1, completed); `cards[2].weatherBadge == nil` (alt2, pending — badge hidden until enrichment completes)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_weatherBadge_populatesFromEnrichmentsCompleted`

### AC-6 — Fewer-than-3 options yields a 2- or 1-entry polylines array (V01 Two Candidates)

**GIVEN** a `routePlanId` with exactly 2 options in the plan
**WHEN** the subscription delivers
**THEN** `viewModel.polylines.count == 2`; `polylines[0]` is the best option; `polylines[1]` is alt1; `viewModel.cards.count == 2` (matching); accessing a third element via `polylines[2]` is NOT possible (array bounds enforced)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_twoCandidates_yieldsTwoEntries`

### AC-7 — Empty-options surfaces error state, not silent success

**GIVEN** a `routePlanId` that resolves to a plan with `options: []` (edge case — should never happen per agent contract but defensively handled)
**WHEN** the subscription delivers
**THEN** `viewModel.errorState` is set to `.noOptions("Plan returned zero options")` (or equivalent); `polylines.count == 0`; the parent flow is notified to render the ErrorScreen instead of the results state
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_emptyOptions_surfacesErrorState`

### AC-8 — Token purity in view-model file

**GIVEN** the modified `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with zero `Color(red:...)` calls, zero hex strings (e.g., `#D9742A`), zero numeric font sizes, zero hardcoded CGFloat color values outside the documented dash-array exemption
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:|#[0-9A-Fa-f]{6}|\.font\(\.system\(size:' ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift | wc -l` returns 0

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Subscription delivers 3 options → polylines.count == 3 with correct tokens for best/alt1/alt2 | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_subscription_producesThreePolylinesWithTokens` | happy_path |
| TC-2 | selectAlt updates selectedRouteId; second call with same id is no-op | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_selectAlt_updatesAndIsIdempotent` | happy_path |
| TC-3 | refine calls sendMessage with same sessionId; emits planning transition | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_refine_callsSendMessageWithSameSessionAndTransitionsToPlanning` | happy_path |
| TC-4 | dismiss + recall flip flag, zero Convex calls recorded | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_dismissAndRecall_flipsFlagWithNoConvexCall` | happy_path |
| TC-5 | weatherBadge populated from completed enrichments; nil for pending | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_weatherBadge_populatesFromEnrichmentsCompleted` | edge |
| TC-6 | Two-option plan → polylines.count == 2, cards.count == 2 | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_twoCandidates_yieldsTwoEntries` | edge |
| TC-7 | Empty options → errorState set, polylines empty, no silent success | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_emptyOptions_surfacesErrorState` | error |
| TC-8 | View-model file passes token compliance script with zero violations | AC-8 | `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:\|#[0-9A-Fa-f]{6}\|\.font\(\.system\(size:' ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift \| wc -l` returns 0 | edge |
| TC-9 | Build + lint clean across modified files | AC-1, AC-8 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | all | [PRIMARY PATTERN] Sprint 08 ViewModel architectural template — `@Observable`, subscription binding via ConvexClient, intent methods, weak-self closure pattern, error state handling |
| `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` | 1-259 | Existing template consuming the mock provider — understand the current shape of `RouteResultsScreenState` to mirror in the new view-model |
| `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` | all | Mock fixture shape — `routeOptions`, polyline format, card model; the new view-model must produce data of the same shape |
| `ios/LaneShadow/Convex/Polyline.swift` (or equivalent decoder) | all | Polyline string → `[CLLocationCoordinate2D]` decoder; reuse, do NOT re-implement |
| `ios/LaneShadow/Convex/ConvexClient.swift` (or wrapper) | all | `subscribe(query:args:)` API surface |
| `server/convex/db/routePlans.ts` | 191-253 (getPlanByIdHandler) | Return shape — what fields the subscription delivers (note: RR-S09-CVX-T01 documents the `{best, alt1, alt2}` ordering invariant) |
| `.spec/prds/v3-integration/architecture/ios-architecture.md` | §5.3 RouteResultsScreen | iOS architecture spec — state.routes, polyline mapping, RouteResultsMockProvider migration plan |
| `.spec/prds/v3-integration/05-uc-chat.md` | UC-CHAT-03 + UC-CHAT-04 | AC list — refine reuses sessionId, weather badge from enrichments |
| `RULES.md` | "Convex Backend", "Cross-Platform Component Parity", "Verification Standards by Platform" | Project-wide rules |
| `brain/docs/mobile-architecture/ios-principles.md` | "@Observable view-models" | View-model patterns |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` (NEW)
- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModelTypes.swift` (NEW — optional, for `PolylineData`, `RouteAttachmentCardModel`, `WeatherBadgeModel`, `RouteResultsError` types if they don't already exist)
- `ios/LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests.swift` (NEW — or extend existing tests if present)
- `ios/project.yml` (MODIFY only if file additions require regeneration via `scripts/ios/generate-project.sh`)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` — owned by RR-S09-IOS-T02 (composition); this task only builds the ViewModel
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` — do NOT modify; sandbox fixtures stay mock; the live path is a separate code path
- `ios/LaneShadow/Convex/Polyline.swift` — existing decoder, do NOT modify
- `ios/LaneShadow/Convex/ConvexClient.swift` — existing client, do NOT modify
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — Sprint 08 ownership
- `server/**`, `android/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated; regenerate via `scripts/ios/generate-project.sh`, never hand-edit

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (visual contract — polyline strokes, card composition)
- `.spec/design/system/views/route-results-screen/README.md` (variant matrix)
- `.spec/design/system/refs/route-results-screen/default--best-pre-selected.light.png` (S01 reference)
- `.spec/prds/v3-integration/architecture/ios-architecture.md` §5.3 RouteResultsScreen
- `.spec/prds/v3-integration/05-uc-chat.md` UC-CHAT-03 + UC-CHAT-04
- Sprint 08 PlanningViewModel as the architectural mirror

**Interaction Notes:** No direct user interactions in this task — the view-model exposes intent methods that the composition task (RR-S09-IOS-T02) wires to user gestures. The view-model is responsible for: (a) translating Convex subscription data into a polyline/card model with token-driven styling, (b) preserving the `{best, alt1, alt2}` ordering from RR-S09-CVX-T01, (c) exposing the four intent methods (`selectAlt`, `refine`, `dismissMessage`, `recallMessage`) that the composition calls.

**Pattern:** `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — Sprint 08 architectural mirror. Same `@Observable` macro, same subscription binding pattern via ConvexClient, same intent-method shape (no async/await in the intent methods themselves; subscription updates flow back through the published properties). Mirror the `[weak self]` closure pattern to avoid retain cycles in the subscription closure.

**Pattern Source:** `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (Sprint 08, currently in-flight at PLAN-S08-IOS-T01)

**Anti-Pattern:** Decoding polylines inside the view-model (use `Convex/Polyline.swift`); persisting `selectedRouteId` to Convex (it's client-side); minting a new `sessionId` on refine (reuse the active one); strong-reference cycles via the subscription closure (use `[weak self]`); hardcoding color hex (use theme tokens); rendering 0-option plans as silent success (surface as error state).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_subscription_producesThreePolylinesWithTokens` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_selectAlt_updatesAndIsIdempotent` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_refine_callsSendMessageWithSameSessionAndTransitionsToPlanning` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_dismissAndRecall_flipsFlagWithNoConvexCall` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_weatherBadge_populatesFromEnrichmentsCompleted` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_twoCandidates_yieldsTwoEntries` |
| AC-7 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_emptyOptions_surfacesErrorState` |
| AC-8 | `scripts/tokens/enforce-native-compliance.sh` (exit 0); `grep -E 'Color\(red:\|#[0-9A-Fa-f]{6}' ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift \| wc -l` returns 0 |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/RouteResults/` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** iOS view-model + unit tests under `ios/LaneShadow/Features/RouteResults/` and `ios/LaneShadowTests/Features/RouteResults/`. Matches `swift-implementer` mandate — `@Observable`, SwiftData (not used here but adjacent), XCTest, XcodeBuildMCP. The view-model is the bridge between Convex subscription data and the SwiftUI composition; no SwiftUI body code lives here. Reviewer is `swift-reviewer` per RULES.md.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Observable`, dependency injection, intent methods)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-model unit tests via Combine subjects / stub clients)
- `brain/docs/mobile-architecture/performance-optimization.md` (avoid unnecessary publishing; only mutate when state changes)
- `RULES.md` §"Convex Backend", §"Verification Standards by Platform", §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-CVX-T01 (consumes the documented `{best, alt1, alt2}` ordering invariant + chat-refine sessionId reuse contract)

**Blocks:**
- RR-S09-IOS-T02 (composition consumes the view-model)
- RR-S09-IOS-T03 (polyline rendering binds to `viewModel.polylines`)
- RR-S09-IOS-T04 (chat-refine + dismiss/recall wires the view-model intents)
- RR-S09-IOS-T05 (capture tests use the live view-model with stub Convex data)
- RR-S09-E2E-IOS-T01 (E2E asserts view-model intent flows end-to-end)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Subscription delivers 3 options; viewModel.polylines.count == 3 with best/alt1/alt2 token assignment correct","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"selectAlt updates selectedRouteId; second call with same id is idempotent no-op","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"refine calls sendMessage with same sessionId; emits planning transition","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_refine_callsSendMessageWithSameSessionAndTransitionsToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"dismissMessage + recallMessage flip isMessageDismissed with zero Convex mutations","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Weather badge populates from route_enrichments where status == completed; nil for pending","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_weatherBadge_populatesFromEnrichmentsCompleted","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Two-option plan yields polylines.count == 2 (V01 Two Candidates variant)","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Empty options ([]) surfaces errorState, polylines.count == 0, parent flow notified to ErrorScreen","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"View-model file is token-pure; no hex/RGB/numeric font/hardcoded color literals","verify":"scripts/tokens/enforce-native-compliance.sh && grep -E pattern ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift | wc -l == 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Three-option plan test produces three polylines with correct tokens","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"selectAlt idempotency test","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"refine sends with same sessionId + emits planning transition","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_refine_callsSendMessageWithSameSessionAndTransitionsToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"dismiss + recall flag flip with no Convex calls","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Weather badge derivation from completed enrichments","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_weatherBadge_populatesFromEnrichmentsCompleted","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-option edge case produces 2 polylines","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Empty options error state surfaced","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/RouteResults/RouteResultsViewModelTests/test_emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Token compliance + grep returns zero violations in view-model file","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/RouteResults/","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
