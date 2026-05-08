# PLAN-S08-REM-IOS-T03 - iOS chat suggestion spacing remediation

> Status: Backlog
> Cycle: 0
> Updated: 2026-05-08T00:00:00.000Z

> **Task ID:** PLAN-S08-REM-IOS-T03
> **Sprint:** [Sprint 08 - Map View - Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 90 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P1
> **Effort:** S
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, UC-CHAT-01, Sprint 08 remediation note 2026-05-08

## Background

The current capture shows quick search chips/tabs overlapping the chat input surface. The target places those chips above the input, with a visible token-driven gap between the chip row and the input bar. `LSChatInput` currently stacks location context, suggestion chips, input bar, and autocomplete dropdown with one shared `theme.space.xs` gap. That is too small for the bottom overlay composition and does not protect the fixed input surface from the horizontal suggestion row.

This remediation keeps the existing `LSChatInput` API and visual language, but gives the suggestion row a stable spacing relationship above the input bar so Sprint 8 locked/planning input states inherit the corrected layout.

## Critical Constraints

**MUST:**
- Keep suggestion chips above the input bar with a stable token-derived vertical gap; they must not overlap the input background or controls.
- Preserve location context row ordering: location badge above suggestion chips, suggestion chips above input bar, autocomplete dropdown below input bar.
- Preserve all existing `LSChatInput` callbacks, accessibility identifiers, and public initializer parameters.
- Keep live `IdleScreenContainer` and sandbox `IdleScreen` using the shared `LSChatInput` primitive; do not add screen-specific offsets to hide the issue.

**NEVER:**
- Never hardcode pixel offsets or negative padding to force visual separation.
- Never remove quick search suggestions from idle or planning entry states.
- Never modify map controls or topbar files in this task.

**STRICTLY:**
- Add focused regression tests before implementation.
- Use existing theme spacing tokens only.

## Specification

**Objective:** Ensure `LSChatInput` lays out quick search chips above the input bar without overlap in idle and planning-entry compositions.

**Success State:** The bottom chat surface renders location context, suggestion chips, input bar, and autocomplete dropdown in stable vertical order; suggestion chips have enough token spacing above the input on iPhone 16.

## Acceptance Criteria

### AC-1 - Suggestions have a dedicated gap above input

**GIVEN** `LSChatInput` has non-empty suggestions
**WHEN** the body lays out the suggestion row and input bar
**THEN** a dedicated theme-token gap separates `lschatinput-suggestions` from the input bar instead of relying on a shared `theme.space.xs` stack gap
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_suggestions_have_dedicated_gap_above_input`

### AC-2 - Row order stays stable with location context

**GIVEN** `LSChatInput` has a location badge and suggestions
**WHEN** the view renders
**THEN** order is location badge, suggestions, input bar, then autocomplete dropdown when present
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_location_suggestions_input_order_is_stable`

### AC-3 - Suggestion row does not resize the input bar

**GIVEN** long suggestion labels render in a horizontal scroll row
**WHEN** the view lays out
**THEN** the input bar keeps its stable height and the chip row scrolls horizontally without compressing or overlapping the input controls
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_long_suggestions_scroll_without_input_overlap`

### AC-4 - Idle screens inherit primitive fix

**GIVEN** live and sandbox idle screens render suggestions
**WHEN** tests inspect the bottom overlay composition
**THEN** neither screen adds custom negative offsets; both rely on corrected `LSChatInput` spacing
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_idle_chat_suggestions_use_shared_spacing`

### AC-5 - Build and token compliance pass

**GIVEN** the spacing remediation is complete
**WHEN** native compliance, focused tests, and build run
**THEN** all exit 0
**Verify:** `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | LSChatInput separates suggestion chips from input bar with a dedicated theme-token gap | AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_suggestions_have_dedicated_gap_above_input` | happy_path |
| TC-2 | LSChatInput order is location badge, suggestions, input bar, autocomplete dropdown when all are present | AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_location_suggestions_input_order_is_stable` | edge |
| TC-3 | Long suggestion labels scroll horizontally without compressing or overlapping the input bar | AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_long_suggestions_scroll_without_input_overlap` | edge |
| TC-4 | Idle screens rely on shared LSChatInput spacing and do not introduce screen-specific overlap offsets | AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_idle_chat_suggestions_use_shared_spacing` | edge |
| TC-5 | Native token compliance and iOS build both exit 0 | AC-5 | `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Molecules/LSChatInput.swift` | 58-80, 95-111 | Current stack spacing and suggestion row composition |
| `ios/LaneShadowTests/Molecules/LSChatInputTests.swift` | 123-174 | Existing suggestion and location tests |
| `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | 120-177 | Live idle chat input consumer |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | 160-215 | Sandbox chat input consumer |
| `.spec/design/system/molecules/chat-input/` | all | Visual contract for suggestion chips above input |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` (MODIFY - token spacing/layout only)
- `ios/LaneShadowTests/Molecules/LSChatInputTests.swift` (MODIFY - spacing/order regression tests)
- `ios/LaneShadowTests/Templates/IdleScreenTests.swift` (MODIFY - shared-spacing consumer regression)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` - owned by PLAN-S08-REM-IOS-T01
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift` - owned by PLAN-S08-REM-IOS-T01
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` - owned by PLAN-S08-REM-IOS-T02
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` - read-only consumer unless a test proves a missing identifier is required
- `android/**`, `server/**`, `tokens/**` - out of scope

## Dependencies

**Depends on:** Existing `LSChatInput` suggestion-chip support.

**Blocks:**
- PLAN-S08-IOS-T04 (planning locked input should inherit fixed spacing)
- PLAN-S08-IOS-T05 (capture tests should not lock in chip/input overlap)
- PLAN-S08-T11 (human gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN LSChatInput with suggestions WHEN body lays out THEN suggestion row and input bar are separated by a dedicated theme-token gap","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_suggestions_have_dedicated_gap_above_input","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN LSChatInput with location badge, suggestions, and autocomplete WHEN rendered THEN order is location, suggestions, input, autocomplete","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_location_suggestions_input_order_is_stable","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN long suggestion labels WHEN laid out THEN suggestions scroll horizontally without compressing or overlapping the input bar","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_long_suggestions_scroll_without_input_overlap","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN idle screens with suggestions WHEN inspected THEN they rely on shared LSChatInput spacing and add no custom negative offsets","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_idle_chat_suggestions_use_shared_spacing","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN touched Swift files WHEN native compliance and iOS build run THEN both exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"LSChatInput separates suggestion chips from input bar with a dedicated theme-token gap","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_suggestions_have_dedicated_gap_above_input","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"LSChatInput order is location badge, suggestions, input bar, autocomplete dropdown","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_location_suggestions_input_order_is_stable","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Long suggestion labels scroll horizontally without compressing or overlapping input bar","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSChatInputTests/test_long_suggestions_scroll_without_input_overlap","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Idle screens rely on shared LSChatInput spacing and add no custom negative offsets","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_idle_chat_suggestions_use_shared_spacing","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Native token compliance and iOS build both exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"}
  ]
}
-->
