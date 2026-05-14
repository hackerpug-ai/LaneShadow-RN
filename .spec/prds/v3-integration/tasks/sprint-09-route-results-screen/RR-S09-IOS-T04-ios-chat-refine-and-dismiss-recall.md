# RR-S09-IOS-T04 — iOS chat-refine + dismiss/recall wiring

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-IOS-T04
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03 (refine via chat reuses session), UC-CHAT-04 (state machine), Sprint 09

## Background

Wire the unlocked `LSChatInput` to `viewModel.refine(_:)` (RR-S09-IOS-T01) for chat-refine submission, and wire the `LSNavigatorMessage` dismiss chevron to `viewModel.dismissMessage()` with a copper "Recall" chrome chip that re-pins via `viewModel.recallMessage()`. The chat input placeholder swaps to "Refine your ride…" in the results state. Submitting the refine input transitions the parent flow back to `.planning(sessionId:)` (reusing the same session — verified by RR-S09-CVX-T01 contract test). The dismiss/recall is pure client-side UI state — no Convex mutation. The Recall chip is bottom-anchored per V03 Message Dismissed variant.

## Critical Constraints

**MUST:**
- MUST unlock `LSChatInput` in the results state: `isThinking = false`, `placeholder = "Refine your ride…"`, `isEnabled = true`
- MUST wire `LSChatInput.onSubmit` to `viewModel.refine(_:)` with the typed prompt; the view-model emits the parent-flow transition to `.planning(sessionId:)`
- MUST wire `LSNavigatorMessage`'s dismiss chevron to call `viewModel.dismissMessage()`
- MUST render a copper "Recall" chrome chip when `viewModel.isMessageDismissed == true`, anchored at bottom of the canvas per V03 design; the chip uses `LSChromeChip` (or equivalent atom) styled with `LaneShadowTheme.colors.signal.default` (copper)
- MUST wire the Recall chip's tap to `viewModel.recallMessage()`; on recall, the LSNavigatorMessage slides back in with identical content
- MUST honor `UIAccessibility.isReduceMotionEnabled` for the message slide-out / Recall chip slide-in / message slide-in — collapse to instantaneous swap when reduced motion is on
- MUST add `accessibilityIdentifier == "routeresultsscreen-recall-chip"` to the Recall chip for E2E + design-review capture
- MUST add tests covering: refine submit calls viewModel.refine; dismiss flips isMessageDismissed and hides message; Recall chip renders when dismissed; Recall tap calls recallMessage and re-pins; reduced-motion path is instantaneous

**NEVER:**
- NEVER call `agent.sendMessage` directly from this view code; route through `viewModel.refine(_:)` so the view-model owns the flow transition
- NEVER persist dismiss/recall state to Convex; it's local UI state
- NEVER hardcode hex color literals for the Recall chip; use `LaneShadowTheme.colors.signal.default` (copper)
- NEVER swap `LSChatInput.placeholder` via a hardcoded string at the call site; the placeholder MUST come from `LaneShadowStrings.routeResultsRefinePlaceholder` (or equivalent localized string) — add a new string if missing
- NEVER block the main thread during the Recall chip animation

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Accessibility Standards iOS" — the Recall chip MUST have an `accessibilityLabel` like `"Recall Navigator message"` and an `accessibilityHint` describing the action
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0
- STRICTLY follow the design-system V03 variant for Recall chip placement (bottom-anchored, copper, chrome-glass)

## Specification

**Objective:** Unlock `LSChatInput` in results state with refine-prompt placeholder; wire refine submit to `viewModel.refine(_:)`; wire dismiss chevron to `viewModel.dismissMessage()`; render bottom-anchored copper Recall chip when dismissed; wire Recall tap to `viewModel.recallMessage()`; honor reduce-motion for all transitions.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests` exits 0; the `templates.route-results-screen.message-dismissed-light` story renders the Recall chip bottom-anchored copper; the `templates.route-results-screen.refining-light` story renders the unlocked chat input with refine placeholder; `xcodebuild build` exits 0; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean.

## Acceptance Criteria

### AC-1 — LSChatInput unlocked in results state with refine placeholder

**GIVEN** `RouteResultsScreen` is rendered in the results state
**WHEN** the view tree is inspected
**THEN** `LSChatInput` has `isThinking = false`, `isEnabled = true`, and `placeholder` equal to `LaneShadowStrings.routeResultsRefinePlaceholder` (typically "Refine your ride…")
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_chatInput_unlockedWithRefinePlaceholder`

### AC-2 — Refine submit calls viewModel.refine and transitions to planning state

**GIVEN** `viewModel.sessionId == "sess-xyz"` and the chat input has text "make it shorter"
**WHEN** the user taps Send (or presses Return in the input)
**THEN** `viewModel.refine("make it shorter")` is called exactly once AND the parent-flow transition subject emits `.planning(sessionId: "sess-xyz")`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_refine_submit_callsViewModelAndTransitions`

### AC-3 — Dismiss chevron calls viewModel.dismissMessage; LSNavigatorMessage hides

**GIVEN** `viewModel.isMessageDismissed == false`; `LSNavigatorMessage` is visible
**WHEN** the user taps the dismiss chevron
**THEN** `viewModel.dismissMessage()` is called; `viewModel.isMessageDismissed == true`; `LSNavigatorMessage` is no longer in the view hierarchy (or has opacity 0); polylines remain visible on the map
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_dismissChevron_hidesMessage`

### AC-4 — Copper Recall chip renders bottom-anchored when isMessageDismissed

**GIVEN** `viewModel.isMessageDismissed == true`
**WHEN** `RouteResultsScreen` renders
**THEN** a `LSChromeChip` (or equivalent atom) labeled "Recall" is present in the bottom-anchored slot of `LSMapLayer.bottomOverlays`; its background uses `LaneShadowTheme.colors.signal.default` (copper); accessibility id is `routeresultsscreen-recall-chip`; accessibilityLabel is `"Recall Navigator message"`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_rendersBottomAnchoredCopperWhenDismissed`

### AC-5 — Recall chip tap re-pins LSNavigatorMessage

**GIVEN** `viewModel.isMessageDismissed == true`; Recall chip is rendered
**WHEN** the user taps the Recall chip
**THEN** `viewModel.recallMessage()` is called; `viewModel.isMessageDismissed == false`; `LSNavigatorMessage` is back in the view hierarchy with identical content (same headline, same cards, same selection); Recall chip is no longer rendered
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_tap_repinsMessageAndHidesChip`

### AC-6 — Reduce-motion: all transitions instantaneous

**GIVEN** `UIAccessibility.isReduceMotionEnabled == true`
**WHEN** the user dismisses the message AND then taps Recall
**THEN** both transitions complete with zero animation duration; tests assert no animation block is active via stub `AnimationController` or `withAnimation { ... }` flag
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_reducedMotion_transitionsAreInstantaneous`

### AC-7 — Token + accessibility compliance

**GIVEN** modified Swift files for refine/dismiss/recall wiring
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0; Recall chip has `accessibilityLabel` and `accessibilityHint` per `RULES.md` §"Accessibility Standards iOS"
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'accessibilityLabel.*Recall|accessibilityHint' ios/LaneShadow/Features/RouteResults/RouteResultsRecallChip.swift | wc -l` ≥ 2

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Chat input is unlocked with refine placeholder | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_chatInput_unlockedWithRefinePlaceholder` | happy_path |
| TC-2 | Refine submit calls viewModel.refine + parent-flow transition | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_refine_submit_callsViewModelAndTransitions` | happy_path |
| TC-3 | Dismiss chevron hides message, flips isMessageDismissed | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_dismissChevron_hidesMessage` | happy_path |
| TC-4 | Recall chip renders bottom-anchored copper when dismissed | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_rendersBottomAnchoredCopperWhenDismissed` | happy_path |
| TC-5 | Recall tap re-pins message and hides chip | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_tap_repinsMessageAndHidesChip` | happy_path |
| TC-6 | Reduce-motion: dismiss + recall transitions are instantaneous | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_reducedMotion_transitionsAreInstantaneous` | edge |
| TC-7 | Token + accessibility compliance | AC-7 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-8 | Build + lint clean | all | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/RouteResults/` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` (NEW from T01) | published intent methods | `refine(_:)`, `dismissMessage()`, `recallMessage()`, `isMessageDismissed` |
| `ios/LaneShadow/Views/Molecules/LSChatInput.swift` | all | Public API surface — `placeholder`, `isThinking`, `isEnabled`, `onSubmit` |
| `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` | all | Public API — dismiss chevron callback, slide-out animation |
| `ios/LaneShadow/Views/Atoms/LSChromeChip.swift` (or equivalent) | all | Recall chip atom |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | S04 Refining + V03 Message Dismissed sections | Refine placeholder, Recall chip placement, motion recipes |
| `.spec/design/system/refs/route-results-screen/refining.light.png` | full | S04 visual reference |
| `.spec/design/system/refs/route-results-screen/message-dismissed.light.png` | full | V03 visual reference |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T04-ios-locked-chat-input-and-cancel-confirm.md` | all | Sprint 08 sibling task — chat input state binding pattern (different state, same architecture) |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/RouteResults/RouteResultsRecallChip.swift` (NEW — Recall chip view wrapping `LSChromeChip` with copper signal-default styling)
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (MODIFY — wire chat input + dismiss + Recall chip into composition)
- `ios/LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests.swift` (NEW)
- `ios/LaneShadow/Resources/LaneShadowStrings.swift` (MODIFY — add `routeResultsRefinePlaceholder` string)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — existing component
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — existing organism
- `ios/LaneShadow/Views/Atoms/LSChromeChip.swift` — existing atom
- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` — RR-S09-IOS-T01 ownership
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (S04 Refining + V03 Message Dismissed)
- `.spec/design/system/views/route-results-screen/README.md` (refine primer + Recall chip composition)
- `.spec/design/system/refs/route-results-screen/refining.light.png`
- `.spec/design/system/refs/route-results-screen/message-dismissed.light.png`
- Sprint 08 PLAN-S08-IOS-T04 (chat input state binding pattern)

**Interaction Notes:** REQUIRED READING: `.spec/design/system/views/route-results-screen/route-results-screen.html` § Refining + Message Dismissed. Three new user interactions: (1) refine submit via chat input → transitions back to planning, (2) dismiss chevron → hides message + shows Recall chip, (3) Recall chip tap → re-pins message. Dismiss/Recall is pure client state — no Convex calls.

**Pattern:** Sprint 08 PLAN-S08-IOS-T04 — chat input state binding via the view-model's published properties; the view doesn't own the state, the view-model does. Mirror the same approach for refine submit. For Recall chip, follow the standard atom-composition pattern: a thin SwiftUI view wraps `LSChromeChip` with copper styling and binds to the view-model's intent method.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T04-ios-locked-chat-input-and-cancel-confirm.md`

**Anti-Pattern:** Calling `agent.sendMessage` directly from the view; persisting dismiss/recall to Convex; hardcoding the refine placeholder string; using a custom chip view instead of `LSChromeChip`; tweening message slide-out / Recall slide-in without respecting reduce-motion.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_chatInput_unlockedWithRefinePlaceholder` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_refine_submit_callsViewModelAndTransitions` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_dismissChevron_hidesMessage` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_rendersBottomAnchoredCopperWhenDismissed` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_tap_repinsMessageAndHidesChip` |
| AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_reducedMotion_transitionsAreInstantaneous` |
| AC-7 | `scripts/tokens/enforce-native-compliance.sh` (exit 0) |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/RouteResults/` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI wiring task in `Features/RouteResults/` consuming existing molecules + atoms via published APIs + view-model intent methods. Matches swift-implementer mandate. Reviewer: `swift-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (view-model intent calls; small body)
- `RULES.md` §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-IOS-T01 (consumes `viewModel.refine`, `dismissMessage`, `recallMessage`, `isMessageDismissed`)
- RR-S09-IOS-T02 (composition slot for the chat input + bottomOverlays)

**Blocks:**
- RR-S09-IOS-T05 (capture tests need refining variant + message-dismissed variant rendering)
- RR-S09-E2E-IOS-T01 (E2E asserts refine reuses sessionId, dismiss shows chip, recall re-pins)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"LSChatInput rendered with isThinking=false, isEnabled=true, placeholder=LaneShadowStrings.routeResultsRefinePlaceholder","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Refine submit calls viewModel.refine and emits .planning(sessionId:) transition reusing the active sessionId","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_refine_submit_callsViewModelAndTransitions","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Dismiss chevron calls viewModel.dismissMessage, hides LSNavigatorMessage","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Recall chip renders bottom-anchored copper with correct accessibility id and label when isMessageDismissed","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Recall chip tap calls viewModel.recallMessage, re-pins LSNavigatorMessage, hides chip","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Reduce-motion enabled: dismiss + recall transitions are instantaneous","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Token compliance + Recall chip accessibility label and hint present","verify":"scripts/tokens/enforce-native-compliance.sh && grep accessibility label/hint pattern","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Chat input unlocked test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Refine submit + transition test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_refine_submit_callsViewModelAndTransitions","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Dismiss chevron test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Recall chip render test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Recall tap re-pin test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Reduce-motion path test","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenRefineDismissTests/test_reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Token + accessibility compliance","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Build + lint clean","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/RouteResults/","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
