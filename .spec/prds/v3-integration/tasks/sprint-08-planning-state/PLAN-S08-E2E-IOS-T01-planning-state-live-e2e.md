# PLAN-S08-E2E-IOS-T01 — iOS Planning State Live E2E (XCUITest, simulator + real device)

> Status: ✅ Completed
> Cycle: 1
> Commit: 83a52ba60
> Reviewer: orchestrator-self
> Updated: 2026-05-14T17:30:00.000Z

> **Task ID:** PLAN-S08-E2E-IOS-T01
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer (this session, direct)
> **Estimate:** 180 min
> **Type:** TEST
> **Status:** In Progress
> **Priority:** P1
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-01, UC-CHAT-02, UC-CHAT-04, Sprint 08 Human Testing Gate (SPRINT.md), `RULES.md` §"Real Device E2E Testing"

## Background

After the Sprint 08 stub-fix cycle (commits `8eb2d577a` + `08e034a87`) eliminated ten production stubs across the Convex `cancelPlanHandler`, the iOS `IdleScreen`/`PlanningScreen` live-paths, and the Android `PlanningRoute`/`PlanningViewModel`, the red-hat review's `H-3` finding remained open: the Sprint 08 human-testing gate is structurally blocked because **no live E2E test exercises the planning state on a real app launch**. Existing coverage:

- `ios/LaneShadowUITests/MapView/IdleStateE2ETests.swift` has four tests, of which only `testIdleStateSuggestionChipTransitionsToPlanning` touches planning — and it only asserts the `planningscreen` element APPEARS after a chip tap. It verifies none of the behaviors the stub fixes were meant to guarantee.
- `ios/LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests.swift` covers the FIX-S07-IOS-T01 zoom/recenter wiring against a real LSMapHost.
- `androidTest/.../PlanningScreenInstrumentedTest.kt` is Compose-rule rendering against the sandbox template, not app-launch E2E.

Coverage gaps left after the stub-fix cycle:

1. Persistent map-host contract (the same `LSMap` survives idle → planning) — **unverified**.
2. `LSChatInput` `isThinking` binding actually disables the input during planning — **unit-test only**.
3. `LSPhaseIndicator` header reflects `viewModel.capsuleHeadline` — **unit-test only**.
4. Back chip → `viewModel.cancelPlanning()` → return-to-idle on the same host — **unverified end-to-end**; rider-initiated Convex `cancelPlan` (the L-1 fix path) — **unverified live**.
5. Copper sketch polyline actually animates (1400ms loop) — **unverified**; reduced-motion collapses animation — **unverified**.

Per `RULES.md` §"Real Device E2E Testing" the iOS automated path is native XCUITest through `xcodebuild test`. The user's directive for this task is that the tests must run on **both iOS Simulator and a real iPhone** — XCUITest naturally supports both via `-destination`. The Sprint 08 test set is added to the existing `MapView/` E2E directory so the planning state lives next to its idle sibling (sprint 06–08 map view suite).

## Critical Constraints

**MUST:**

- Add a new XCUITest file `ios/LaneShadowUITests/MapView/PlanningStateE2ETests.swift` next to `IdleStateE2ETests.swift`, sharing the existing helpers (`AppLauncher.launchApp`, `LSIds`, the screenshot attachment pattern, pixel sampling from `IdleStateE2ETests.testIdleMapTilesRenderNonUniformPixelGrid`).
- Tests MUST run identically on:
  - `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests`
  - `xcodebuild test -scheme LaneShadow -destination "id=<IOS_UDID>" -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests` (real device, paired via `make ios_e2e_device_headed`).
- Every test launches the app with `AppLauncher.launchApp(app, bypassAuth: true)` (mirrors the existing `IdleStateE2ETests` flow) so the test starts on the authenticated map view's idle state, then drives into the planning state by tapping a real suggestion chip.
- Real Convex backend MUST be exercised — no mocking, no stubbing of the planning session creation. Tests rely on the same Clerk test account + Convex URL the existing `IdleStateE2ETests` already drive against.
- Tests MUST surface real failures, not soft-pass on missing UI. Each test attaches a screenshot on success and on failure for the .xcresult bundle.
- Container plumbing fix: `PlanningScreenContainer.swift` MUST pass `viewModel.capsuleHeadline` into `PlanningScreenLiveState(...)` (the swift-implementer added the property but Container drops it on the floor, so production currently always shows the `PlanningScreenLiveState.capsuleHeadline` default `"Reading your prompt..."`).

**NEVER:**

- NEVER mock Convex, the chat store, or the planning ViewModel inside the E2E test target. These are end-to-end tests against the real app and the real Convex deployment.
- NEVER assert against arbitrary screen coordinates. Use `LSIds` (or per-id `XCUIElement` queries by `accessibilityIdentifier`).
- NEVER pass if a test asserts only on existence of a parent element while the spec-required child element is absent (test theatre).
- NEVER use `XCTSkip` to silence behavior that should pass against the current production build.

**STRICTLY:**

- STRICTLY mirror the existing `IdleStateE2ETests` shape (`@MainActor final class … XCTestCase`, `setUpWithError`/`tearDownWithError`, `attachScreenshot(named:)`, optional `sampledRGBColors(...)` for pixel-diff).
- STRICTLY treat the cancel-confirm sheet currently being broken in the iOS live path as a documented residual: the test for the cancel flow asserts the **current** behavior (back chip → mutation fires → return to idle, NO sheet). A follow-up task `PLAN-S08-IOS-CANCEL-CONFIRM-T01` is needed to wire the sheet UI (it exists in the sandbox path of `PlanningScreen` but not in the live path; Container needs to call `viewModel.requestCancelConfirmation()` rather than `viewModel.cancelPlanning()`).

## Specification

**Objective:** Provide live E2E coverage for every claim in the Sprint 08 SPRINT.md Human Testing Gate that is testable today: planning-state composition (capsule + indicator), persistent map host, locked chat input, cancel flow (current behavior), sketch-polyline animation. Tests must run unchanged on simulator and physical iPhone.

**Success State:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests` exits 0 with five test methods passing and one `.xcresult` per test containing labelled screenshots; the same invocation against `-destination "id=<IOS_UDID>"` on a real iPhone passes identically.

## Acceptance Criteria

### AC-1 — Planning composition renders capsule + indicator + chat input

**GIVEN** the app launched with `bypassAuth: true` and rendered to the idle map view
**WHEN** the user taps the first suggestion chip in `lschatinput-suggestions`
**THEN** within 10s the `planningscreen` root element exists AND `planningscreen-phase-indicator` is displayed AND `planningscreen-chat-input` is displayed AND `planningscreen-map` is displayed
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateRendersCompositionAfterChipTap`

### AC-2 — Persistent map host survives the idle → planning transition (no remount)

**GIVEN** the user is on the idle map view with `idlescreen-map` mounted
**WHEN** the user taps a suggestion chip and transitions to planning
**THEN** the planning-state map element (`planningscreen-map`) renders AND the previously-mounted `idlescreen-map` element is gone (replaced because it now lives at the `planningscreen-map` identifier) AND the rendered map pixels are non-uniform (proving Mapbox tiles survived the transition, not just SDK chrome)
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateMapHostRendersLiveTilesAfterTransition`

> NB: SwiftUI does not surface a stable handle to prove "same underlying `LSMap` view instance" through XCUITest — the strongest XCUITest-level signal we can capture is "map element with valid tile content exists in planning state immediately after transition, before any reload could occur." The pixel-sampling test from `testIdleMapTilesRenderNonUniformPixelGrid` is the canonical pattern; we reuse it here.

### AC-3 — `LSChatInput` is locked while `viewModel.isThinking == true`

**GIVEN** the app is in the planning state after a chip tap (planning has just started and the ViewModel is thinking)
**WHEN** XCUITest inspects the `planningscreen-chat-input` subtree
**THEN** the spinner element `lschatinput-spinner` exists AND the field `lschatinput-field` is `!isEnabled` (XCUIElement `.isEnabled == false`)
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateChatInputLocksWhileThinking`

### AC-4 — Back chip cancels the plan and returns to the idle map view

**GIVEN** the app is in the planning state with a freshly-created plan
**WHEN** XCUITest taps the `lschatinput-collapse` back chip
**THEN** within 10s the `idlescreen` element re-renders AND the `planningscreen` element is gone AND the rider's chat-input value is restored / cleared appropriately
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateBackChipCancelsAndReturnsToIdle`

> NB: The iOS live path currently calls `viewModel.cancelPlanning()` (which does request + confirm in one shot) from the back chip — there is no confirmation sheet rendered in the live path even though `PlanningScreen.swift` sandbox path has the UI. The cancel-confirm sheet is a **documented residual**: file follow-up `PLAN-S08-IOS-CANCEL-CONFIRM-T01` to wire `Container.onCollapse` to `viewModel.requestCancelConfirmation()` and render the sheet from the live path bound to `viewModel.cancelConfirmationVisible`. This test asserts CURRENT behavior; when the follow-up lands, this test will be split into two (sheet appears → keep dismisses sheet → cancel button confirms → idle).

### AC-5 — Sketch polyline animates after planning starts (pixel diff between two frames)

**GIVEN** the app is in the planning state with the sketch polyline visible
**WHEN** XCUITest samples the pixel set inside the `planningscreen-map` bounds twice with a ~700ms gap (half the 1400ms loop)
**THEN** the two pixel sets DIFFER (proving the polyline path-progress is advancing) — uniform pixels would prove the animation is static
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateSketchPolylineAnimatesBetweenFrames`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | After chip tap, all three planning overlays (`planningscreen-phase-indicator`, `planningscreen-chat-input`, `planningscreen-map`) are displayed within 10s | AC-1 | happy_path |
| TC-2 | After chip tap, `planningscreen-map` renders non-uniform pixels (Mapbox tiles), proving the host survived the transition with live tile content | AC-2 | happy_path |
| TC-3 | After chip tap, `lschatinput-spinner` exists AND `lschatinput-field.isEnabled == false` in the planning state | AC-3 | happy_path |
| TC-4 | After tapping `lschatinput-collapse` from planning, `idlescreen` re-renders within 10s AND `planningscreen` no longer exists | AC-4 | happy_path |
| TC-5 | Two screenshots ~700ms apart inside `planningscreen-map` produce different pixel sets (animation is advancing) | AC-5 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadowUITests/MapView/IdleStateE2ETests.swift` | all | Pattern to mirror: launch flow, screenshot helpers, pixel sampling |
| `ios/LaneShadowUITests/Helpers/AppLauncher.swift` | all | `launchApp(_:bypassAuth:)` entry point |
| `ios/LaneShadowUITests/Helpers/AccessibilityIds.swift` | all | `LSIds` namespace — extend with planning ids |
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | 125, 343, 380-411 | Live-path accessibility identifiers (`planningscreen`, `planningscreen-chat-input`, `planningscreen-phase-indicator`) |
| `ios/LaneShadow/Views/Molecules/LSChatInput.swift` | 79, 236, 248, 293, 303 | Chat input identifiers (`lschatinput`, `lschatinput-collapse`, `lschatinput-field`, `lschatinput-send`, `lschatinput-spinner`) |
| `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | all | Container plumbs `capsuleHeadline` (fix this task adds) and wires the cancel callback |

## Guardrails

**Write-Allowed:**

- `ios/LaneShadowUITests/MapView/PlanningStateE2ETests.swift` (NEW)
- `ios/LaneShadowUITests/Helpers/AccessibilityIds.swift` (extend `LSIds` with planning ids)
- `ios/LaneShadow.xcodeproj/project.pbxproj` (auto-generated — XcodeGen regenerate after adding the new test source)
- `ios/project.yml` (only if XcodeGen requires explicit registration of `MapView/PlanningStateE2ETests.swift`; otherwise unchanged)
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` (one-line plumb of `viewModel.capsuleHeadline` into `PlanningScreenLiveState`)

**Write-Prohibited:**

- Any other file in `ios/LaneShadow/**` (no production-code changes other than the Container plumb fix)
- `ios/LaneShadowUITests/MapView/IdleStateE2ETests.swift` (no edits to the idle sibling)
- `server/**`, `android/**`, `react-native/**`

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateRendersCompositionAfterChipTap` |
| AC-2 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateMapHostRendersLiveTilesAfterTransition` |
| AC-3 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateChatInputLocksWhileThinking` |
| AC-4 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateBackChipCancelsAndReturnsToIdle` |
| AC-5 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateSketchPolylineAnimatesBetweenFrames` |
| Full suite | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests` |
| Device pass | `make ios_e2e_device_headed` (or invoke `xcodebuild test … -destination "id=<UDID>" …`); record `.xcresult` artifact under `ios/build/xcresults/` |

## Agent Assignment

**Agent:** swift-implementer (this session, direct execution)
**Rationale:** Adding XCUITest source + one-line Container plumb + LSIds extension — pure iOS test wiring inside an established pattern. No subagent dispatch.

## Coding Standards

- `RULES.md` §"Real Device E2E Testing"
- `ios/LaneShadowUITests/MapView/IdleStateE2ETests.swift` (the canonical pattern)
- `RULES.md` §"Accessibility Standards" (iOS section — every interactive element uses `accessibilityIdentifier`, not `accessibilityLabel`, for UI-test selectors)

## Dependencies

**Depends on:**

- Sprint 08 stub-fix commits `8eb2d577a` + `08e034a87` (live-path `isThinking`/`capsuleHeadline` bindings; rider-initiated Convex `cancelPlan` patch path)
- Sprint 07 components (LSContextCapsule, LSChatInput) — already shipped
- Sprint 06 `LSMapView`/`LSMapHost` — already shipped

**Blocks:**

- PLAN-S08-T11 sprint gate (zero-high-issue `pnpm design:review --screens planning-screen` + real-iPhone XCUITest evidence requirement)

**Follow-ups (documented residuals discovered during this task):**

- `PLAN-S08-IOS-CANCEL-CONFIRM-T01` (new task): Wire `PlanningScreenContainer.onCollapse` to `viewModel.requestCancelConfirmation()` (not `cancelPlanning()`) AND render the cancel-confirm sheet from the **live** path of `PlanningScreen.swift` (sheet UI already exists in the sandbox path at lines 129-204 but is not bound in `liveContent`). Sheet buttons at lines 156 and 173 currently have empty `Button(action: {})` actions — they must be wired to `viewModel.dismissCancelConfirmation()` and `viewModel.confirmCancellation()` respectively. After this lands, `testPlanningStateBackChipCancelsAndReturnsToIdle` must be split into two tests covering the sheet flow.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "After chip tap, planning composition (phase indicator + chat input + map) renders",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateRendersCompositionAfterChipTap",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "Planning state map host renders live Mapbox tiles after transition (non-uniform pixels)",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateMapHostRendersLiveTilesAfterTransition",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "Chat input is locked (spinner present + field disabled) while planning is thinking",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateChatInputLocksWhileThinking",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "Back chip from planning cancels and returns to idle (current behavior — sheet wiring is a follow-up)",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateBackChipCancelsAndReturnsToIdle",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "Sketch polyline animates between two ~700ms-apart frames (pixel-diff)",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/MapView/PlanningStateE2ETests/testPlanningStateSketchPolylineAnimatesBetweenFrames",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    }
  ]
}
-->
