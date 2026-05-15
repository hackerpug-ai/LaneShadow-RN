# PLAN-S08-IOS-T04 — iOS locked chat input + cancel-confirm sheet (V02 variant) + return-to-idle restoration

> Status: 🟢 Done
> Cycle: 4
> Updated: 2026-05-14T18:55:00.000Z

> **Task ID:** PLAN-S08-IOS-T04
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Done
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-04 (cancel + cancel-confirm flow), UC-FID-01 (planning-screen V02 cancel-prompt variant), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06)

## Background

In the planning state of the canonical map view, `LSChatInput` is locked: the rider's prompt text remains visible (`has-value`), typing is disabled, the leading button dims, and the send button is replaced by a copper spinner. The only exit affordance is the back chip in the top bar, which opens a cancel-confirm sheet — the V02 variant from `planning-screen.html` — asking "Cancel this plan? I've drawn one route already. You can back out now — but I'll toss what I have." Confirming fires `db.routePlans.cancelPlan` (via `convexClient.cancelRoutePlan`) and returns the same map host to its idle state (capsule swaps back to `--idle`, indicator unmounts, chat input unlocks, session preserved as `archived` if applicable). The back-from-cancel-confirm path closes the sheet and resumes planning untouched.

The existing `LSChatInput.swift` already supports `isThinking: Bool` + `isEnabled: Bool` for the lock state — wiring is straightforward. The cancel-confirm sheet currently lives inline in `PlanningScreen.swift` (lines 128-203, an inline `VStack` overlay) and is hardcoded to the legacy state. This task extracts the sheet into a dedicated `PlanningCancelConfirmSheet.swift`, binds it to `viewModel.cancelConfirmationVisible` / `confirmCancellation()` / `dismissCancelConfirmation()` from PLAN-S08-IOS-T01, ensures the V02 layout matches the design (title + italic body + two buttons + scrim), and the confirm path triggers the return-to-idle restoration end-to-end.

## Critical Constraints

**MUST:**
- Wire `LSChatInput(isThinking: viewModel.isThinking, isEnabled: !viewModel.isThinking)` in `PlanningScreen.swift` (already present per existing live-content path lines 393-411 — this task verifies + tests the binding); placeholder shows the locked-state copy ("Planning your ride…" via existing `LSChatInput` API)
- Create `ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift` extracting the inline cancel-confirm overlay from `PlanningScreen.swift` (lines 128-203) into a public SwiftUI view; consume the existing `LSCancelConfirmSheet` molecule at `ios/LaneShadow/Views/Molecules/LSCancelConfirmSheet.swift` if its API matches the V02 design, OR build the sheet token-driven matching the existing inline pattern but parameterized
- Render the sheet conditionally inside `PlanningScreenContainer` based on `viewModel.cancelConfirmationVisible == true`, with a `LSScrim(blocking: true)` behind it; primary "Cancel plan" CTA triggers `viewModel.confirmCancellation()`; tertiary "Keep thinking" CTA triggers `viewModel.dismissCancelConfirmation()`
- Confirm path MUST end with the map view returning to its idle state — `viewModel.confirmCancellation()` from PLAN-S08-IOS-T01 already routes through `appState`/`SessionStore` to flip `flowState = .idle`; this task asserts the end-to-end via integration test (mounted in `PlanningScreenContainer`, taps confirm, observes `appState.flowState == .idle` AND chat input unlocked AND `LSChatInput.isThinking == false` AND capsule + indicator unmounted)
- Add tests in `ios/LaneShadowTests/Features/Planning/PlanningCancelConfirmTests.swift`: sheet visibility binds to `cancelConfirmationVisible`, scrim renders behind sheet, "Cancel plan" tap calls `confirmCancellation`, "Keep thinking" tap calls `dismissCancelConfirmation`, end-to-end return-to-idle, V02 copy matches design exactly (title + body strings)
- Preserve existing accessibility identifiers (`planningscreen-scrim`, `planningscreen-cancel-confirm`, `cancel-confirm-keep`, `cancel-confirm-cancel`) AND add a parent `planning-cancel-confirm-sheet` identifier on the new view for design-review capture

**NEVER:**
- NEVER modify `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — it already supports the `isThinking` lock; consumed component, write-prohibited
- NEVER bypass the two-stage cancel intent from PLAN-S08-IOS-T01 — `requestCancelConfirmation()` opens the sheet, `confirmCancellation()` fires the mutation; do NOT call the mutation directly from this view
- NEVER inline the sheet rendering in `PlanningScreen.swift` post-task — extract into `PlanningCancelConfirmSheet.swift` so it can be sandbox-storied independently
- NEVER hardcode hex literals, RGB tuples, numeric font sizes/weights, or pixel paddings — every visual must resolve through `LaneShadowTheme` tokens
- NEVER use `.foregroundColor` (deprecated); use `.foregroundStyle`
- NEVER skip the scrim or render it non-blocking — scrim is `blocking: true` per the existing pattern; tapping scrim is treated as "Keep thinking" (dismiss) only if the design explicitly allows it (default: scrim taps are no-ops; require explicit button press)

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"Sheets" — sheets composed via `ZStack` overlay (not `.sheet()` modifier) per the existing inline pattern, since the sheet sits over the persistent map host and shouldn't trigger sheet lifecycle events
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — copy strings ("Cancel this plan?", "I've drawn one route already…", "Keep thinking", "Cancel plan") MUST match the Android twin (PLAN-S08-AND-T04) exactly
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 — the new file must be token-pure

## Specification

**Objective:** Extract the cancel-confirm sheet (V02 variant) into a dedicated `PlanningCancelConfirmSheet.swift` view, bind it to the two-stage cancel intent from PLAN-S08-IOS-T01, and verify end-to-end that the locked `LSChatInput` + back-chip → request → confirm → mutation → return-to-idle flow works with no map remount.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests` exits 0 with all sheet visibility + button-tap + return-to-idle integration tests passing; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` succeeds; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean across modified files.

## Acceptance Criteria

### AC-1 — Locked chat input — isThinking + isEnabled binding

**GIVEN** `viewModel.isThinking == true` is published
**WHEN** `PlanningScreen` renders
**THEN** the rendered `LSChatInput` has `isThinking: true` AND `isEnabled: false` AND the placeholder is the locked-state string ("Planning your ride…" or equivalent per existing `LSChatInput` API), with no typing accepted and the send button replaced by a copper spinner per existing `LSChatInput` `is-thinking` modifier
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_chatInput_lockedBinding`

### AC-2 — PlanningCancelConfirmSheet exists as standalone view

**GIVEN** the new file `ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift`
**WHEN** the file is read
**THEN** it exports `struct PlanningCancelConfirmSheet: View` with three init parameters: `onConfirm: () -> Void`, `onDismiss: () -> Void`, AND optional `title`/`body` overrides; renders title + italic body + two buttons + accessibility identifier `planning-cancel-confirm-sheet`; consumes `@Environment(\.theme)` for all visual tokens
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheet_publicViewSurface`

### AC-3 — Sheet visibility binds to viewModel.cancelConfirmationVisible

**GIVEN** `viewModel.cancelConfirmationVisible == false`
**WHEN** `PlanningScreenContainer` renders
**THEN** neither the scrim nor the sheet is in the view hierarchy
**AND GIVEN** `viewModel.cancelConfirmationVisible` flips to `true`
**THEN** the scrim (`accessibilityIdentifier == "planningscreen-scrim"`) AND the sheet (`accessibilityIdentifier == "planning-cancel-confirm-sheet"`) are both rendered
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheetVisibility_binding`

### AC-4 — "Cancel plan" tap fires confirmCancellation

**GIVEN** the sheet is visible
**WHEN** the "Cancel plan" button (`accessibilityIdentifier == "cancel-confirm-cancel"`) is tapped
**THEN** `viewModel.confirmCancellation()` is called exactly once AND `viewModel.dismissCancelConfirmation()` is NOT called
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_cancelButton_callsConfirmCancellation`

### AC-5 — "Keep thinking" tap fires dismissCancelConfirmation

**GIVEN** the sheet is visible
**WHEN** the "Keep thinking" button (`accessibilityIdentifier == "cancel-confirm-keep"`) is tapped
**THEN** `viewModel.dismissCancelConfirmation()` is called exactly once AND `viewModel.confirmCancellation()` is NOT called AND no Convex mutation fires
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_keepButton_callsDismiss`

### AC-6 — End-to-end return-to-idle after confirm

**GIVEN** `PlanningScreenContainer` mounted with a stub view-model in planning state (`isThinking: true`, `phaseSteps` populated, `activeRoutePlanId` set)
**WHEN** the back chip is tapped → "Cancel plan" is tapped → the stub Convex client returns success
**THEN** `convexClient.cancelRoutePlan(routePlanId:)` was called once, `viewModel.isThinking == false`, `viewModel.cancelConfirmationVisible == false`, the appState/SessionStore received the return-to-idle transition, the capsule + indicator are unmounted from the view tree, AND `LSChatInput.isThinking == false`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_endToEnd_returnToIdle`

### AC-7 — V02 design copy strings match exactly

**GIVEN** the sheet renders with default copy
**WHEN** the title and body text are inspected
**THEN** title equals "Cancel this plan?" AND body equals "I've drawn one route already. You can back out now — but I'll toss what I have." (verbatim, including em-dash)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_v02_copyMatchesDesign`

### AC-8 — Token purity (zero hex / numeric typography / hardcoded spacing)

**GIVEN** the new file `ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift` and modified `PlanningScreenContainer.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with no findings; both files contain zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded spacing CGFloat constants outside theme tokens
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:|#[0-9A-Fa-f]{6}|\.font\(\.system\(size:' ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift | wc -l`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | LSChatInput renders with isThinking=true, isEnabled=false when viewModel.isThinking | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_chatInput_lockedBinding` | happy_path |
| TC-2 | PlanningCancelConfirmSheet is a standalone public View with onConfirm/onDismiss params + accessibility id | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheet_publicViewSurface` | happy_path |
| TC-3 | Sheet + scrim visibility binds to cancelConfirmationVisible (false → absent, true → present) | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheetVisibility_binding` | happy_path |
| TC-4 | "Cancel plan" tap calls confirmCancellation exactly once; dismissCancelConfirmation NOT called | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_cancelButton_callsConfirmCancellation` | happy_path |
| TC-5 | "Keep thinking" tap calls dismissCancelConfirmation; confirmCancellation NOT called; no mutation | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_keepButton_callsDismiss` | happy_path |
| TC-6 | Back chip → cancel plan tap → cancelRoutePlan called → return to idle, capsule + indicator unmounted, chat unlocked | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_endToEnd_returnToIdle` | happy_path |
| TC-7 | Title "Cancel this plan?" + body verbatim match V02 design | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_v02_copyMatchesDesign` | edge |
| TC-8 | Token compliance shell + grep show zero violations in modified files | AC-8 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-9 | Build + lint pass cleanly across modified files | AC-1, AC-8 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Molecules/LSChatInput.swift` | 1-260 | Existing API — `isThinking` + `isEnabled` parameters already present (lines 21, 38, 54, 227, 237, 248); placeholder swap when `isThinking`; spinner replaces send button (read-only — do NOT modify) |
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | 128-203 | Existing inline cancel-confirm overlay — pattern source for extraction; copy strings ("Cancel this plan?", "I've drawn one route already…"), button labels ("Keep thinking", "Cancel plan"), accessibility ids |
| `ios/LaneShadow/Views/Molecules/LSCancelConfirmSheet.swift` | 1-100 | Existing molecule (4146 bytes) — evaluate if this API can be reused for the V02 layout; if yes, prefer reuse over re-implementation |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | all | View-model contract from PLAN-S08-IOS-T01 — `cancelConfirmationVisible`, `requestCancelConfirmation()`, `confirmCancellation()`, `dismissCancelConfirmation()` |
| `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | 1-46 | Container — extension point for sheet conditional rendering above the screen |
| `.spec/design/system/views/planning-screen/planning-screen.html` | V02 cancel-confirm variant | Design contract for sheet layout, copy, token recipe |
| `.spec/design/system/molecules/chat-input/` | all | LSChatInput design — confirms `is-thinking` modifier visual contract |
| `server/convex/db/routePlans.ts` | 220-339 | `cancelPlan` API — confirms the mutation signature (`routePlanId`); ownership guard; no parameters beyond plan id |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift` (NEW — extracted V02 sheet)
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` (MODIFY — conditional sheet rendering, `cancelConfirmationVisible` binding)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY ONLY if a small extension is needed for the unlock state — coordinate with PLAN-S08-IOS-T01 owner; otherwise no change)
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (MODIFY ONLY to remove inline sheet overlay if PLAN-S08-IOS-T02 hasn't already; coordinate to avoid double-touch)
- `ios/LaneShadowTests/Features/Planning/PlanningCancelConfirmTests.swift` (NEW — visibility, button-tap, end-to-end return-to-idle, V02 copy tests)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — consumed component, write-prohibited
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — Sprint 06 organism, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` — Sprint 04 component, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSScrim.swift` — existing scrim, do NOT modify
- `server/**`, `android/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (V02 cancel-confirm variant)
- `.spec/design/system/molecules/chat-input/` (locked / `is-thinking` modifier visual contract)

**Interaction Notes:** Sheet is composed as a `ZStack` overlay over the persistent map host (NOT a SwiftUI `.sheet()` modifier — sheet lifecycle would unmount the map). Tapping the scrim is a no-op by default — explicit button press required to dismiss or confirm. Sheet entry/exit animation is the standard slide-up (handled inside the sheet view via `transition(.move(edge: .bottom))` if used, or matched to the design's `chatOverlayEnter` recipe).

**Pattern:** Existing inline overlay in `PlanningScreen.swift` (lines 128-203) — token-driven `RoundedRectangle` + `LaneShadowTheme.color.surface.card` background, `theme.elevation.level1` shadow, `theme.space.lg` padding, two buttons with `.surface.inset` (cancel) / `.border.default` strokeBorder (keep). The extraction preserves this token recipe verbatim.

**Pattern Source:** Sprint 04 / Sprint 06 `LSCancelConfirmSheet.swift` molecule — if its public API matches the V02 needs, reuse instead of re-implementing.

**Anti-Pattern:** Using SwiftUI `.sheet()` modifier (would unmount the map host); calling `confirmCancellation()` on scrim tap (must require explicit button); inlining hex copper for the confirm CTA (must resolve through `LaneShadowTheme.color.signal.default` or the existing `surface.inset` per the inline pattern); keeping the sheet inline in `PlanningScreen.swift` post-extraction.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_chatInput_lockedBinding` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheet_publicViewSurface` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheetVisibility_binding` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_cancelButton_callsConfirmCancellation` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_keepButton_callsDismiss` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_endToEnd_returnToIdle` |
| AC-7 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_v02_copyMatchesDesign` |
| AC-8 | `scripts/tokens/enforce-native-compliance.sh` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure SwiftUI feature task in `Features/Planning/` — extract a token-driven sheet view, bind it to the view-model from PLAN-S08-IOS-T01, write XCTest unit + integration tests covering button taps + return-to-idle. Matches swift-implementer's mandate (SwiftUI `View` extraction, `@Bindable` view-model wiring, integration tests via SwiftUI inspection or hosting controller).

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (sheet composition via ZStack over persistent host; `@Bindable`; small `body`)
- `brain/docs/mobile-architecture/testing-strategy.md` (integration test pattern — mount container with stub view-model, drive UI, assert published state changes)
- `RULES.md` (LaneShadow §"Cross-Platform Component Parity" for copy strings, §"Accessibility Standards iOS")

## Dependencies

**Depends on:**
- PLAN-S08-IOS-T01 (consumes `cancelConfirmationVisible`, `confirmCancellation()`, `dismissCancelConfirmation()`)
- PLAN-S08-CVX-T01 (`cancelPlanHandler` documented terminal contract — ensures return-to-idle is race-free)
- PLAN-S08-IOS-T02 (composition wires the back chip to `requestCancelConfirmation` + reserves the sheet rendering hook in the container)

**Blocks:**
- PLAN-S08-IOS-T05 (capture tests render the V02 cancel-confirm variant)
- PLAN-S08-T11 (Sprint 08 gate — cancel walk evidence on real iPhone)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"LSChatInput receives isThinking=true, isEnabled=false when viewModel.isThinking==true; locked-state placeholder + copper spinner replace send button","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_chatInput_lockedBinding","satisfied":true,"evidence":"PlanningScreen.swift:252 + PlanningScreen+LiveContent.swift:116; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"PlanningCancelConfirmSheet exists as standalone public View with onConfirm/onDismiss parameters + accessibility id planning-cancel-confirm-sheet","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheet_publicViewSurface","satisfied":true,"evidence":"PlanningCancelConfirmSheet.swift:9,19,25; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Sheet + scrim visibility binds to viewModel.cancelConfirmationVisible; both render only when true","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheetVisibility_binding","satisfied":true,"evidence":"PlanningScreenContainer.swift:45-62; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"\"Cancel plan\" button tap fires viewModel.confirmCancellation exactly once; dismissCancelConfirmation NOT called","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_cancelButton_callsConfirmCancellation","satisfied":true,"evidence":"PlanningViewModel.swift:129-147 + StubLaneShadowConvexClient.swift:188-193; cancelRoutePlanCalls verified; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"\"Keep thinking\" button tap fires viewModel.dismissCancelConfirmation; no mutation, no confirm","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_keepButton_callsDismiss","satisfied":true,"evidence":"PlanningViewModel.swift:125-127; cancelRoutePlanCalls.isEmpty assertion; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"End-to-end: back chip → confirm → cancelRoutePlan called → return-to-idle, capsule+indicator unmounted, chat unlocked, no map remount","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_endToEnd_returnToIdle","satisfied":true,"evidence":"PlanningCancelConfirmTests.swift:145-168; all state resets + mutation call verified; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"V02 copy verbatim — title \"Cancel this plan?\" + body \"I've drawn one route already. You can back out now — but I'll toss what I have.\"","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_v02_copyMatchesDesign","satisfied":true,"evidence":"PlanningCancelConfirmSheet.swift:20-21; test passes","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Token compliance script exits 0; zero hex/RGB/numeric font/hardcoded spacing in new sheet + container","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":true,"evidence":"enforce-native-compliance.sh exit 0; swiftlint 0 violations; 0 grep hits for Color(red:|foregroundColor|hex","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"LSChatInput locked binding on viewModel.isThinking","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_chatInput_lockedBinding","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"PlanningCancelConfirmSheet public view surface","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheet_publicViewSurface","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Sheet + scrim visibility binding","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_sheetVisibility_binding","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Cancel button tap fires confirmCancellation","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_cancelButton_callsConfirmCancellation","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Keep button tap fires dismissCancelConfirmation","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_keepButton_callsDismiss","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"End-to-end return-to-idle integration","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_endToEnd_returnToIdle","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"V02 copy strings match design verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningCancelConfirmTests/test_v02_copyMatchesDesign","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Token compliance shell zero violations","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/Planning/PlanningCancelConfirmSheet.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift","satisfied":true,"evidence":"test passed on simulator, cycle 4, commit 3da7e5509","remediation":null,"last_evaluated_cycle":4,"last_evaluated_commit":"3da7e5509","maps_to_ac":"AC-1"}
  ]
}
-->
