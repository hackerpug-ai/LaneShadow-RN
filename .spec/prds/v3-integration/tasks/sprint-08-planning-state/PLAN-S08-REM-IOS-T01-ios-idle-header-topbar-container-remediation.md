# PLAN-S08-REM-IOS-T01 - iOS idle header topbar container remediation
> Status: 🔴 Needs Fixes
> Cycle: 2
> Commit: be0ab42fe7bdeff33fb0effff5dd99c8d50ff825
> Reviewer: swift-reviewer
> Fix: FIX-PLAN-S08-REM-IOS-T01-C1
> Updated: 2026-05-09T03:17:34.244Z

> Status: Backlog
> Cycle: 0
> Updated: 2026-05-08T00:00:00.000Z

> **Task ID:** PLAN-S08-REM-IOS-T01
> **Sprint:** [Sprint 08 - Map View - Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, Sprint 08 remediation note 2026-05-08

## Background

The current iPhone 16 capture shows the idle header fragmented: the menu and top surfaces can appear in the middle of the map because `LSMapLayer` renders `topBar` without the full-height top alignment already used for top overlay slots. The idle composition also splits the header into two concepts: `LSTopBar` owns menu/trailing chrome while `LSContextCapsule` is a separate top overlay.

The target layout keeps the production status/capsule container styling, but all header items share one invisible top container: menu chip at leading, status/message capsule centered, and New chip trailing. This remediation fixes the shared primitive before Sprint 08 planning overlays build on it.

## Critical Constraints

**MUST:**
- Preserve the production `LSContextCapsule` glass/container appearance for the center status/message surface; do not flatten it into raw text.
- Top-align `LSMapLayer.topBar` with a full-size frame/alignment so it cannot float at screen center while the map still bleeds under safe areas.
- Compose idle header menu, center capsule, and New chip inside one `LSTopBar` container in both live `IdleScreenContainer` and sandbox `IdleScreen`.
- Keep existing `LSTopBar` title/trailing variants working for other screens and tests.

**NEVER:**
- Never create a new idle-only header component when `LSTopBar` can be extended with a token-driven center slot.
- Never modify `LSContextCapsule` internals or its visual tokens in this task.
- Never touch Android files in this iOS remediation task.

**STRICTLY:**
- Use `LaneShadowTheme` tokens for spacing, padding, radius, color, and shadows.
- Keep file ownership scoped to the write-allowed list below.

## Specification

**Objective:** Fix the idle header so `LSMapLayer` pins the top bar to the top and idle renders menu, preserved capsule/status container, and New chip in one invisible top row.

**Success State:** The live and sandbox idle screens show a top-aligned header row matching the target: menu left, status/capsule centered, New right; no duplicate separate top context capsule overlay remains.

## Acceptance Criteria

### AC-1 - LSMapLayer pins topBar to the top

**GIVEN** an `LSMapLayer` with a `topBar`
**WHEN** the body renders inside the full-screen map stack
**THEN** the `topBar` is framed with `maxWidth: .infinity`, `maxHeight: .infinity`, `alignment: .top` and cannot be centered vertically
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapLayerTests/test_topbar_slot_fills_height_with_top_alignment`

### AC-2 - LSTopBar accepts a center content slot

**GIVEN** `LSTopBar` is initialized with custom center content
**WHEN** the top bar renders
**THEN** hamburger remains leading, custom center content is centered in the row, and the New chip remains trailing without changing existing title-only behavior
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSTopBarTests/test_center_content_slot_keeps_menu_and_new_aligned`

### AC-3 - Live idle header uses one topbar container

**GIVEN** `IdleScreenContainer` renders the idle map
**WHEN** it builds `LSMapLayer`
**THEN** `topOverlays` no longer contains the idle `context-capsule`; the capsule is passed as `LSTopBar` center content and `LSTopBarTrailing.newChip` is visible
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_live_idle_header_uses_single_topbar_container`

### AC-4 - Sandbox idle header matches live composition

**GIVEN** the sandbox `IdleScreen` renders any idle variant
**WHEN** its `LSMapLayer` is constructed
**THEN** it uses the same single `LSTopBar` header composition as live: menu, center `LSContextCapsule`, trailing New chip
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_sandbox_idle_header_uses_single_topbar_container`

### AC-5 - Token purity and build pass

**GIVEN** the remediation changes are complete
**WHEN** native compliance, focused tests, and build run
**THEN** all exit 0 with no hardcoded visual literals in touched Swift files
**Verify:** `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | LSMapLayer topBar slot fills height and aligns top when topBar is present | AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapLayerTests/test_topbar_slot_fills_height_with_top_alignment` | happy_path |
| TC-2 | LSTopBar center content slot keeps menu leading and New trailing when custom center content is supplied | AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSTopBarTests/test_center_content_slot_keeps_menu_and_new_aligned` | happy_path |
| TC-3 | IdleScreenContainer places the idle LSContextCapsule inside LSTopBar center content instead of topOverlays | AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_live_idle_header_uses_single_topbar_container` | edge |
| TC-4 | Sandbox IdleScreen uses the same single topbar header composition as live | AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_sandbox_idle_header_uses_single_topbar_container` | edge |
| TC-5 | Native token compliance and iOS build both exit 0 | AC-5 | `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 35-92 | Current `ZStack` layer order and unaligned `topBar` slot |
| `ios/LaneShadow/Views/Organisms/LSTopBar.swift` | 32-78 | Current menu/title/trailing layout to extend without breaking |
| `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | 13-54, 87-98 | Live idle composition splitting topBar and capsule |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | 47-82, 95-107 | Sandbox composition that must match live |
| `ios/LaneShadowTests/Organisms/LSMapLayerTests.swift` | 117-148 | Source-inspection test pattern for alignment gates |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` (MODIFY - top-align topBar slot)
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift` (MODIFY - add center content support without breaking title initializer)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY - live header composition)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY - sandbox header composition)
- `ios/LaneShadowTests/Organisms/LSMapLayerTests.swift` (MODIFY - alignment regression test)
- `ios/LaneShadowTests/Organisms/LSTopBarTests.swift` (MODIFY - center slot regression test)
- `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` (NEW or MODIFY - live idle composition test)
- `ios/LaneShadowTests/Templates/IdleScreenTests.swift` (MODIFY - sandbox composition test)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` - consumed component; preserve visual container styling
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` - owned by PLAN-S08-REM-IOS-T02
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` - owned by PLAN-S08-REM-IOS-T03
- `android/**`, `server/**`, `tokens/**` - out of scope
- `ios/LaneShadow.xcodeproj/**` - generated only

## Dependencies

**Depends on:** Sprint 07 `LSContextCapsule` and `LSTopBar` availability.

**Blocks:**
- PLAN-S08-IOS-T02 (planning-state top overlay should inherit corrected map-layer/header alignment)
- PLAN-S08-IOS-T05 (capture tests should not lock in the mid-screen header regression)
- PLAN-S08-T11 (human gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN LSMapLayer with topBar WHEN body renders THEN topBar fills available height and aligns to top, preventing vertical centering",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapLayerTests/test_topbar_slot_fills_height_with_top_alignment",
      "satisfied": false,
      "evidence": "Implementation exists at ios/LaneShadow/Views/Organisms/LSMapLayer.swift:86-90, but the required verify command executed 0 tests (see .tmp/PLAN-S08-REM-IOS-T01/ac-1-output.txt and /tmp/plan_s08_rem_ios_t01_ac1_exact.txt).",
      "remediation": "Fix the xcodebuild -only-testing selector so it executes the intended test under the current Swift Testing/XCTest layout, then rerun and capture a non-zero executed test count for AC-1.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN LSTopBar with custom center content WHEN rendered THEN menu remains leading, center content is centered, and New remains trailing",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSTopBarTests/test_center_content_slot_keeps_menu_and_new_aligned",
      "satisfied": false,
      "evidence": "Implementation exists at ios/LaneShadow/Views/Organisms/LSTopBar.swift:67-79 and 117-131, but the required verify command executed 0 tests (see .tmp/PLAN-S08-REM-IOS-T01/ac-2-output.txt).",
      "remediation": "Fix the AC-2 verify selector so it runs the intended test and proves the center-slot layout with a non-zero executed test count.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleScreenContainer WHEN constructing LSMapLayer THEN idle context capsule is in LSTopBar center content, not topOverlays, and New chip is visible",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_live_idle_header_uses_single_topbar_container",
      "satisfied": false,
      "evidence": "IdleScreenContainer now composes the capsule in topBar at ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:39-45, but the live UI regression test LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:171 fails waiting for idle-context-capsule (isolated rerun EXIT_CODE 65 in /tmp/plan_s08_rem_ios_t01_ui_regression.txt).",
      "remediation": "Restore runtime accessibility/visibility for idle-context-capsule in the live idle path after moving it into LSTopBar center content, then rerun the direct idle UI capture test and the task verify command.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN sandbox IdleScreen WHEN constructing LSMapLayer THEN it uses the same single topbar container header as live idle",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_sandbox_idle_header_uses_single_topbar_container",
      "satisfied": false,
      "evidence": "Sandbox IdleScreen composes the same center slot at ios/LaneShadow/Views/Templates/IdleScreen.swift:75-81, but the required verify command executed 0 tests (see .tmp/PLAN-S08-REM-IOS-T01/ac-4-output.txt).",
      "remediation": "Fix the AC-4 verify selector so it executes the intended sandbox test and proves the composition with a non-zero executed test count.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN touched Swift files WHEN native compliance and iOS build run THEN both exit 0",
      "verify": "scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'",
      "satisfied": true,
      "evidence": "scripts/tokens/enforce-native-compliance.sh EXIT 0; xcodebuild build from ios/ EXIT 0 with ** BUILD SUCCEEDED ** (/tmp/plan_s08_rem_ios_t01_ac5_build.txt).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "LSMapLayer topBar slot fills height and aligns top when topBar is present",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapLayerTests/test_topbar_slot_fills_height_with_top_alignment",
      "satisfied": false,
      "evidence": "The exact verify command exited 0 but executed 0 tests: Test Suite 'LaneShadowTests.xctest' passed, Executed 0 tests (.tmp/PLAN-S08-REM-IOS-T01/ac-1-output.txt; /tmp/plan_s08_rem_ios_t01_ac1_exact.txt).",
      "remediation": "Use a working test selector or executable test target filter that actually runs LSMapLayerTests.test_topbar_slot_fills_height_with_top_alignment.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "LSTopBar center content slot keeps menu leading and New trailing",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSTopBarTests/test_center_content_slot_keeps_menu_and_new_aligned",
      "satisfied": false,
      "evidence": "The exact verify command exited 0 but executed 0 tests in .tmp/PLAN-S08-REM-IOS-T01/ac-2-output.txt.",
      "remediation": "Use a working test selector or executable test target filter that actually runs LSTopBarTests.test_center_content_slot_keeps_menu_and_new_aligned.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "IdleScreenContainer places idle LSContextCapsule inside LSTopBar center content instead of topOverlays",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_live_idle_header_uses_single_topbar_container",
      "satisfied": false,
      "evidence": "The exact verify command exited 0 but executed 0 tests in .tmp/PLAN-S08-REM-IOS-T01/ac-3-output.txt.",
      "remediation": "Use a working test selector or executable test target filter that actually runs IdleScreenRetrofitTests.test_live_idle_header_uses_single_topbar_container.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Sandbox IdleScreen uses the same single topbar header composition as live",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/IdleScreenTests/test_sandbox_idle_header_uses_single_topbar_container",
      "satisfied": false,
      "evidence": "The exact verify command exited 0 but executed 0 tests in .tmp/PLAN-S08-REM-IOS-T01/ac-4-output.txt.",
      "remediation": "Use a working test selector or executable test target filter that actually runs IdleScreenTests.test_sandbox_idle_header_uses_single_topbar_container.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Native token compliance and iOS build both exit 0",
      "verify": "scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'",
      "satisfied": true,
      "evidence": "scripts/tokens/enforce-native-compliance.sh EXIT 0 and xcodebuild build EXIT 0.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "be0ab42fe7bdeff33fb0effff5dd99c8d50ff825",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
