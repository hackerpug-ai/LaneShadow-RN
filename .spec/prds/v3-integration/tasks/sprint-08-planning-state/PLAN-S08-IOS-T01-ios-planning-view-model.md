# PLAN-S08-IOS-T01 — iOS PlanningViewModel evolution (phase derivation, capsule headline, indicator step model, cancel intent)
> Status: ✅ Completed
> Cycle: 2
> Commit: d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762
> Reviewer: swift-reviewer
> Updated: 2026-05-09T00:15:47.539Z

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-07T19:10:00.000Z

> **Task ID:** PLAN-S08-IOS-T01
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-02 (phase progression streaming), UC-CHAT-04 (cancel + cancel-confirm flow), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06)

## Background

The current `PlanningViewModel` (ios/LaneShadow/Features/Planning/PlanningViewModel.swift) was authored against the legacy planning surface (floating phase indicator + transcript + chat input). It derives the active phase by string-matching the latest planning-kind message's `content`/`statusMessage` against keyword lists ("search", "draft", "enrich"), exposes a flat `phases: [PlanningPhase]` array, and routes `cancelPlanning()` directly to `convexClient.cancelRoutePlan(...)` without surfacing a confirmation intent. Sprint 08 retires that surface in favor of the canonical map view's planning state: `LSContextCapsule(--planning)` shows a single italic phase line + copper spinner above the map host; `LSPhaseIndicator` (5-step pipeline) renders directly below; the back button opens a cancel-confirm sheet that fires `db.routePlans.cancelPlan` and returns the same map host to its idle state.

This task evolves `PlanningViewModel` to expose the data the new overlay layout needs without touching the components themselves: `capsuleHeadline: String` (the italic Newsreader t-opinion-md line — "Sketching a coastal loop…", "Refining…", etc.), `phaseSteps: [LSPhaseIndicator.Phase]` (5 step models with `.active|.done|.pending` state), and a two-stage cancel intent (`requestCancelConfirmation()` opens the sheet; `confirmCancellation()` fires the mutation). The phase derivation MUST replace the brittle string-heuristic with the deterministic contract delivered by PLAN-S08-CVX-T01 — either reading the new `phase` field on `sessionMessages` or calling the documented derivation helper. Real Convex sessionMessages flow MUST drive the model; tests MUST cover all 5 phases + cancel happy/error paths against the same `LaneShadowPlanningDataProviding` test double pattern already used in `PlanningViewModelTests`.

## Critical Constraints

**MUST:**
- Add a new `PlanningPhase` enum (or extend the existing struct with a `kind` property) at `ios/LaneShadow/Features/Planning/PlanningPhase.swift` with the 5 lowercase literal cases `parsing|searching|drafting|enriching|finalizing` matching the PLAN-S08-CVX-T01 contract exactly
- Replace `PlanningViewModel.phaseIndex(from:)` string-heuristic with deterministic derivation: read `phase` field from `LaneShadowSessionMessage` (option a) OR call a Swift port of `derivePlanningPhase` (option b); the chosen path MUST be the same as the backend contract chose in PLAN-S08-CVX-T01
- Expose three new published properties on `@Observable PlanningViewModel`: `capsuleHeadline: String` (italic phase copy — from the agent's narrator line OR a default per-phase string), `phaseSteps: [LSPhaseIndicator.Phase]` (5 entries, one per phase, with `.active|.done|.pending` states derived from current phase index), and `cancelConfirmationVisible: Bool` (toggled by `requestCancelConfirmation()` / `dismissCancelConfirmation()`)
- Replace single-stage `cancelPlanning()` with two-stage intent: `requestCancelConfirmation()` flips `cancelConfirmationVisible = true`; `confirmCancellation()` fires `convexClient.cancelRoutePlan(routePlanId:)` AND triggers return-to-idle (set `appState?.flowState = .idle` or equivalent existing transition); `dismissCancelConfirmation()` closes the sheet without mutating
- Bind to live `convexClient.subscribeToSessionMessages(sessionId:limit:)` flow exactly as the existing model does — preserve the `observe()` / `stopObserving()` / `startObservingRoutePlan(_:)` machinery
- Use `@Observable` (Swift 5.9+) macro; mark long-lived non-observed members `@ObservationIgnored` (mirror existing pattern)
- Add tests in `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift`: 5 happy-path phase derivations, capsule headline per phase, 5-step `phaseSteps` shape per phase, cancel two-stage flow happy path, cancel mutation error path, ownership/non-owner error surfacing

**NEVER:**
- NEVER reintroduce string-substring heuristics on `content` / `statusMessage` for phase derivation — the whole point of PLAN-S08-CVX-T01 is to retire that approach
- NEVER call `convexClient.cancelRoutePlan` directly from `requestCancelConfirmation()` — confirmation MUST gate the mutation
- NEVER bypass the `appState`/`SessionStore` return-to-idle path with manual UI mutation; flow transitions go through the existing app-state mechanism
- NEVER read or write the PascalCase `Parsing|Searching|Drafting|Enriching|Finalizing` strings — the cross-platform contract is lowercase literal
- NEVER touch UI rendering, components, or `LSPhaseIndicator` / `LSContextCapsule` internals from this task — view-model only

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"Observation" — `@Observable` macro, `@ObservationIgnored` for non-published members, `@MainActor` annotation, `Task` cancellation in `stopObserving()`
- STRICTLY follow `brain/docs/mobile-architecture/testing-strategy.md` §"View-model tests" — exercise the model with a stub `LaneShadowPlanningDataProviding` (existing pattern in `MockLaneShadowConvex`), assert published-property changes, do NOT render SwiftUI in unit tests
- STRICTLY align `PlanningPhase` enum literals 1:1 with the backend contract delivered by PLAN-S08-CVX-T01 — if the backend chose option (a) phase field, deserialize with `Decodable` from JSON-string; if option (b) helper, port the helper logic into Swift in `PlanningPhase.swift`

## Specification

**Objective:** Evolve `PlanningViewModel` to (1) derive the active pipeline phase deterministically from the PLAN-S08-CVX-T01 contract, (2) expose `capsuleHeadline` + `phaseSteps` + `cancelConfirmationVisible` for the new overlay layout, and (3) split cancel into a two-stage intent (request → confirm → mutation + return-to-idle) so the upcoming cancel-confirm sheet (PLAN-S08-IOS-T04) has a clean state machine to bind to.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests` exits 0 with new tests covering all 5 phase derivations + capsule headlines + cancel two-stage flow; `swiftlint lint ios/LaneShadow/Features/Planning/*.swift` and `scripts/tokens/enforce-native-compliance.sh` (no UI tokens here, but the script still runs clean) exit 0; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` succeeds.

## Acceptance Criteria

### AC-1 — PlanningPhase enum exists with 5 lowercase literal cases

**GIVEN** `ios/LaneShadow/Features/Planning/PlanningPhase.swift`
**WHEN** the file is compiled
**THEN** it exports `enum PlanningPhase: String, CaseIterable, Codable { case parsing, searching, drafting, enriching, finalizing }` (or equivalent struct with the same 5 lowercase literals) matching the PLAN-S08-CVX-T01 contract exactly
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_planningPhase_enumLiterals`

### AC-2 — phaseSteps published property exposes 5-entry LSPhaseIndicator.Phase array

**GIVEN** a sequence of `LaneShadowSessionMessage` updates that should resolve to phase `drafting`
**WHEN** `PlanningViewModel.updateMessages(_:)` runs
**THEN** `phaseSteps` is an array of exactly 5 `LSPhaseIndicator.Phase` entries with the first two states `.done`, the third `.active`, and the last two `.pending`; the `id` of each step is the lowercase phase literal
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseSteps_drafting_correctShape`

### AC-3 — capsuleHeadline derived per phase

**GIVEN** the model is in each of the 5 phases in turn
**WHEN** `capsuleHeadline` is read
**THEN** the value is a non-empty single-line italic-ready string per phase: parsing → "Reading your prompt…", searching → "Sketching a route…" / "Searching available roads…", drafting → "Drafting candidates…", enriching → "Checking conditions…", finalizing → "Picking the best…" (exact strings TBD by design but MUST be one-line, italic-ready, non-default-empty)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_capsuleHeadline_perPhase`

### AC-4 — Two-stage cancel — requestCancelConfirmation toggles visibility only

**GIVEN** the model is mid-planning (phase != finalizing, isThinking == true)
**WHEN** `requestCancelConfirmation()` is invoked
**THEN** `cancelConfirmationVisible` flips to `true` AND no `convexClient.cancelRoutePlan(...)` call is made AND the underlying planning state is unchanged (`isThinking`, `activeRoutePlanId`, `phaseSteps` unchanged)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_requestCancelConfirmation_togglesVisibilityOnly`

### AC-5 — Two-stage cancel — confirmCancellation fires mutation + returns to idle

**GIVEN** `cancelConfirmationVisible == true` AND a non-nil `activeRoutePlanId`
**WHEN** `confirmCancellation()` is invoked
**THEN** `convexClient.cancelRoutePlan(routePlanId:)` is called exactly once with the active route plan id, `cancelConfirmationVisible` flips back to `false`, `isThinking` becomes `false`, the appState/SessionStore receives the return-to-idle transition, AND `chatStore.clearOptimisticMessages()` is called per existing cancel pattern
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_firesMutationAndReturnsToIdle`

### AC-6 — Cancel mutation error surfaces to errorMessage

**GIVEN** `cancelConfirmationVisible == true` AND the stub Convex client throws on `cancelRoutePlan`
**WHEN** `confirmCancellation()` is invoked
**THEN** `errorMessage` is set to the localized error description, `cancelConfirmationVisible` STILL flips to false (sheet dismisses), and the model does NOT crash
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_errorPath`

### AC-7 — dismissCancelConfirmation closes sheet without mutating

**GIVEN** `cancelConfirmationVisible == true`
**WHEN** `dismissCancelConfirmation()` is invoked
**THEN** `cancelConfirmationVisible == false`, `convexClient.cancelRoutePlan` is NOT called, `isThinking` is unchanged, and planning continues
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_dismissCancelConfirmation_noMutation`

### AC-8 — Phase derivation deterministic across all 5 phases

**GIVEN** 5 representative `LaneShadowSessionMessage` payloads (one per phase, built per the PLAN-S08-CVX-T01 contract)
**WHEN** `updateMessages(_:)` processes each in turn
**THEN** `phaseSteps` reaches the matching `.active` step for each — parsing → step 0, searching → step 1, drafting → step 2, enriching → step 3, finalizing → step 4
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseDerivation_allFivePhases`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | `PlanningPhase` enum exposes 5 cases as lowercase string literals | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_planningPhase_enumLiterals` | happy_path |
| TC-2 | `phaseSteps` for `drafting` phase is 5 entries [done, done, active, pending, pending] with lowercase ids | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseSteps_drafting_correctShape` | happy_path |
| TC-3 | `capsuleHeadline` returns non-empty per-phase italic-ready string for each of the 5 phases | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_capsuleHeadline_perPhase` | happy_path |
| TC-4 | `requestCancelConfirmation()` flips visibility only — no mutation, no state churn | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_requestCancelConfirmation_togglesVisibilityOnly` | happy_path |
| TC-5 | `confirmCancellation()` calls cancelRoutePlan + closes sheet + return-to-idle + clears optimistic messages | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_firesMutationAndReturnsToIdle` | happy_path |
| TC-6 | Cancel mutation error sets `errorMessage` + closes sheet without crash | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_errorPath` | error |
| TC-7 | `dismissCancelConfirmation()` closes sheet without mutation, planning continues | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_dismissCancelConfirmation_noMutation` | edge |
| TC-8 | All 5 phases derive deterministically from contract-shaped messages — no string-content heuristics involved | AC-8 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseDerivation_allFivePhases` | happy_path |
| TC-9 | Build + lint pass cleanly across modified files | AC-1, AC-2 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/Planning/PlanningViewModel.swift ios/LaneShadow/Features/Planning/PlanningPhase.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 1-453 | Existing model — `observe()`, `startObserving(sessionId:)`, `updateMessages(_:)`, `phaseIndex(from:)` heuristic to replace, `cancelPlanning()` to split into two stages, `phases` computed array to replace with `phaseSteps` |
| `ios/LaneShadow/Features/Idle/IdleViewModel.swift` | 1-200 | Pattern reference — `@Observable` macro usage, `@ObservationIgnored` for stores/clients, `Task` cancellation, `appState` flow transitions |
| `.spec/design/system/molecules/phase-indicator/README.md` | all | 5-step pipeline contract — confirms parsing→searching→drafting→enriching→finalizing order + step state semantics (`pending`/`active`/`done`) |
| `.spec/design/system/molecules/context-capsule/README.md` | all | `--planning` state contract — single italic Newsreader t-opinion-md headline + copper pulse-dot, no meta row |
| `server/convex/db/sessionMessages.ts` | 1-250 | Backend contract source — `LaneShadowSessionMessage` shape consumed via `convexClient.subscribeToSessionMessages` |
| `server/models/session-messages.ts` | 1-98 | Phase contract source — confirm chosen option (a or b) from PLAN-S08-CVX-T01 before implementing client side |
| `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` | 1-110 | `LSPhaseIndicator.Phase` struct shape — read-only reference; do not modify |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY — replace phase heuristic, add capsuleHeadline/phaseSteps/cancelConfirmationVisible, split cancel)
- `ios/LaneShadow/Features/Planning/PlanningPhase.swift` (NEW — enum/struct + helper if option b)
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` (NEW or MODIFY — phase derivation + cancel-flow cases)
- `ios/project.yml` (MODIFY ONLY if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` — consumed component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — consumed component (Sprint 07), do NOT modify
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` — composition lives in PLAN-S08-IOS-T02; this task is view-model only
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` — wiring lives in PLAN-S08-IOS-T02 / PLAN-S08-IOS-T04; out of scope here
- `server/**`, `android/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/molecules/phase-indicator/README.md`
- `.spec/design/system/molecules/context-capsule/README.md`
- `.spec/design/system/views/mapapp/planning/planning-screen.html` (post-PLAN-S08-DR-T01 update)

**Interaction Notes:** View-model only — no SwiftUI rendering. The new properties are read by `PlanningScreen.swift` in PLAN-S08-IOS-T02; the cancel-confirm sheet in PLAN-S08-IOS-T04 binds `cancelConfirmationVisible` and calls `confirmCancellation()` / `dismissCancelConfirmation()`.

**Pattern:** `ios/LaneShadow/Features/Idle/IdleViewModel.swift` — established `@Observable` macro pattern with `@ObservationIgnored` for stores; `Task` cancellation guards in observation loops.

**Pattern Source:** Sprint 06 `IdleViewModel` evolution + Sprint 04 `PlanningViewModel` original — both use the same `convexClient` test-double pattern via `LaneShadowPlanningDataProviding` for unit-test isolation.

**Anti-Pattern:** Reintroducing string-substring heuristics on `content`/`statusMessage`; coupling `requestCancelConfirmation` to the mutation; mutating SwiftUI directly from the model; hardcoding PascalCase phase strings.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_planningPhase_enumLiterals` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseSteps_drafting_correctShape` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_capsuleHeadline_perPhase` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_requestCancelConfirmation_togglesVisibilityOnly` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_firesMutationAndReturnsToIdle` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_errorPath` |
| AC-7 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_dismissCancelConfirmation_noMutation` |
| AC-8 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseDerivation_allFivePhases` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/Planning/PlanningViewModel.swift ios/LaneShadow/Features/Planning/PlanningPhase.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure Swift view-model task — `@Observable` macro, `@MainActor` annotation, `Task` cancellation, `LaneShadowPlanningDataProviding` test-double pattern, XCTest unit tests in `LaneShadowTests/`. No UI, no Convex schema, no Mapbox. Matches swift-implementer's mandate (Swift 5.9 Observation, async/await flows, view-model + unit tests).

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Observable`, `@ObservationIgnored`, `@MainActor`)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-model unit tests with stub providers)
- `brain/docs/mobile-architecture/performance-optimization.md` (avoid full-tree recompositions; published-property granularity)
- `RULES.md` (LaneShadow §"Cross-Platform Component Parity", §"Convex Backend Guidelines" for client-side contract adherence)

## Dependencies

**Depends on:** PLAN-S08-CVX-T01 (phase derivation contract — choice between option a/b is locked by the backend task)
**Blocks:**
- PLAN-S08-IOS-T02 (composition consumes `phaseSteps` + `capsuleHeadline` + binds `cancelConfirmationVisible`)
- PLAN-S08-IOS-T03 (sketch polyline reads view-model phase to drive geometry/animation if required)
- PLAN-S08-IOS-T04 (cancel-confirm sheet binds the two-stage cancel intent)
- PLAN-S08-T11 (Sprint 08 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "PlanningPhase.swift exports enum (or equivalent struct) with 5 lowercase string literals matching backend contract: parsing/searching/drafting/enriching/finalizing",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_planningPhase_enumLiterals",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningPhase.swift:3-8 defines the five lowercase raw-value cases; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:347-349 shows test_planningPhase_enumLiterals passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "phaseSteps published property exposes 5-entry LSPhaseIndicator.Phase array — for drafting phase: [done, done, active, pending, pending] with lowercase ids",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseSteps_drafting_correctShape",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningPhase.swift:50-58 builds LSPhaseIndicator.Phase entries; ios/LaneShadow/Features/Planning/PlanningViewModel.swift:154-156 publishes phaseSteps; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:350-351 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "capsuleHeadline derives non-empty single-line italic-ready string per phase, distinct per phase",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_capsuleHeadline_perPhase",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningPhase.swift:25-37 defines non-empty single-line per-phase copy; ios/LaneShadow/Features/Planning/PlanningViewModel.swift:154-156 assigns capsuleHeadline from the derived phase; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:352-353 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "requestCancelConfirmation() flips cancelConfirmationVisible=true; no mutation, no state churn",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_requestCancelConfirmation_togglesVisibilityOnly",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningViewModel.swift:120-122 only toggles cancelConfirmationVisible; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:354-355 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "confirmCancellation() invokes cancelRoutePlan exactly once, closes sheet, isThinking=false, returns to idle, clears optimistic messages",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_firesMutationAndReturnsToIdle",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningViewModel.swift:128-145 closes the sheet, clears optimistic messages, stops thinking, calls cancelRoutePlan once when activeRoutePlanId exists, and dispatches cancelPlanning; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:356-357 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "Cancel mutation error path sets errorMessage, dismisses sheet, no crash",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_errorPath",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningViewModel.swift:136-142 surfaces error.localizedDescription while still dismissing the sheet; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:358-359 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "dismissCancelConfirmation() closes sheet without mutation; planning continues",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_dismissCancelConfirmation_noMutation",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Features/Planning/PlanningViewModel.swift:124-125 dismisses without mutation; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:360-361 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "All 5 phases derive deterministically from contract-shaped messages — no string-content heuristics",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseDerivation_allFivePhases",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:129-176 decodes persisted phase; ios/LaneShadow/Features/Planning/PlanningPhase.swift:69-94 and 101-170 mirror server/models/session-messages.ts:178-209 fallback order exactly; .tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:362-365 passed including persisted-phase fallback coverage.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "PlanningPhase enum has 5 lowercase literal cases",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_planningPhase_enumLiterals",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:348-349 shows test_planningPhase_enumLiterals passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "phaseSteps drafting shape is 5 entries [done,done,active,pending,pending]",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseSteps_drafting_correctShape",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:350-351 shows test_phaseSteps_drafting_correctShape passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "capsuleHeadline non-empty + distinct per phase",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_capsuleHeadline_perPhase",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:352-353 shows test_capsuleHeadline_perPhase passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "requestCancelConfirmation toggles visibility only",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_requestCancelConfirmation_togglesVisibilityOnly",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:354-355 shows test_requestCancelConfirmation_togglesVisibilityOnly passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "confirmCancellation calls mutation + return-to-idle + clear optimistic",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_firesMutationAndReturnsToIdle",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:356-357 shows test_confirmCancellation_firesMutationAndReturnsToIdle passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Cancel error path surfaces errorMessage + dismisses sheet",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_confirmCancellation_errorPath",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:358-359 shows test_confirmCancellation_errorPath passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-6"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "dismissCancelConfirmation closes sheet without mutation",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_dismissCancelConfirmation_noMutation",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:360-361 shows test_dismissCancelConfirmation_noMutation passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-7"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "5 phase happy paths derive correct active step deterministically",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseDerivation_allFivePhases",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/planning-viewmodel-tests-udid-output.txt:362-365 shows deterministic phase derivation tests passed, including the persisted-phase fallback case.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-8"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Build + swiftlint clean across modified Planning files",
      "verify": "xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/Planning/PlanningViewModel.swift ios/LaneShadow/Features/Planning/PlanningPhase.swift",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-IOS-T01/tc_9-output.txt ends with '** BUILD SUCCEEDED **' and 'Done linting! Found 0 violations, 0 serious in 2 files'; local re-run /tmp/planvm-lint-review.txt also exited 0.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "d44d1701e8db66d83e57dcf6ba0d7cae9ecb0762",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
