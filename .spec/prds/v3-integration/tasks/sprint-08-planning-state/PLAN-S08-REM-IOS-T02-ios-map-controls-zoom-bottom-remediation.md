# PLAN-S08-REM-IOS-T02 - iOS map controls zoom-bottom remediation
> Status: ✅ Completed
> Cycle: 1
> Commit: c12353b1c4aea3c9453cdaf7ac0ade39492b5e78
> Reviewer: swift-reviewer
> Updated: 2026-05-09T00:46:09.107Z

> Status: Backlog
> Cycle: 0
> Updated: 2026-05-08T00:00:00.000Z

> **Task ID:** PLAN-S08-REM-IOS-T02
> **Sprint:** [Sprint 08 - Map View - Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 120 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P1
> **Effort:** S
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, Sprint 08 remediation note 2026-05-08

## Background

The current idle capture shows the zoom cluster as a horizontal plus/minus pill near the top of the right-edge controls. The target asks for zoom controls stacked vertically and moved to the bottom of the right-aligned control stack. Android already renders the zoom cluster vertically but still places it first, so this iOS task owns the SwiftUI primitive change and PLAN-S08-REM-AND-T01 owns Android parity.

`LSMapControls.resolvedAppearance` currently appends `.zoomCluster` before recenter/layers/save/mode toggle, and `zoomClusterChip` is an `HStack`. This remediation changes the control model and view while keeping the right-edge workbar, glass styling, handlers, and accessibility ids intact.

## Critical Constraints

**MUST:**
- Render zoom in and zoom out as a vertical stack in one glass cluster: plus above, divider between, minus below.
- Make `.zoomCluster` the bottom-most chip in map mode after recenter, layers, optional save, and mode toggle.
- Preserve all existing handler semantics and accessibility identifiers: `lsmapcontrols-zoom-cluster`, `lsmapcontrols-zoom-in`, `lsmapcontrols-zoom-out`.
- Keep `LSMapControls` positioned by consumers; this task changes chip order and cluster orientation only.

**NEVER:**
- Never introduce a second zoom component or split plus/minus into unrelated chips.
- Never hardcode colors, spacing, radii, or sizes outside existing token-derived helpers.
- Never modify Android files in this iOS task.

**STRICTLY:**
- Update tests before implementation using RED -> GREEN -> REFACTOR.
- Keep public API source-compatible unless an existing test proves a signature change is required.

## Specification

**Objective:** Update iOS `LSMapControls` so zoom controls are vertical and bottom-most in the right-edge map-mode workbar.

**Success State:** Map mode renders recenter/layers/save-if-present/mode-toggle above a vertical plus-over-minus zoom cluster; chat mode still renders only the mode toggle.

## Acceptance Criteria

### AC-1 - Map-mode chip order puts zoom at bottom

**GIVEN** `LSMapControls.resolvedAppearance(mode: .map, hasRouteToSave: false)`
**WHEN** chip order is resolved
**THEN** `.zoomCluster` is the final item after `.modeToggle`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_map_mode_places_zoom_cluster_last`

### AC-2 - Save state preserves zoom-bottom order

**GIVEN** `hasRouteToSave == true` in map mode
**WHEN** chip order is resolved
**THEN** save remains visible above mode toggle and zoom remains the final/bottom chip
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_save_chip_stays_above_bottom_zoom_cluster`

### AC-3 - Zoom cluster is vertical

**GIVEN** `LSMapControls(mode: .map, onZoomIn: ..., onZoomOut: ...)`
**WHEN** the zoom cluster body renders
**THEN** plus and minus buttons are arranged vertically with a horizontal divider and a cluster frame taller than one chip
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_cluster_uses_vertical_layout`

### AC-4 - Accessibility and callbacks stay stable

**GIVEN** zoom handlers are supplied
**WHEN** tests inspect the controls
**THEN** zoom identifiers are unchanged and both handlers remain bound exactly once
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_callbacks_and_identifiers_remain_stable`

### AC-5 - Build and token compliance pass

**GIVEN** the control remediation is complete
**WHEN** native compliance, focused tests, and build run
**THEN** all exit 0
**Verify:** `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Map-mode chip order ends with `.zoomCluster` when no save chip is visible | AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_map_mode_places_zoom_cluster_last` | happy_path |
| TC-2 | Map-mode chip order keeps save above mode toggle and zoom last when save is visible | AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_save_chip_stays_above_bottom_zoom_cluster` | edge |
| TC-3 | Zoom cluster source uses vertical layout and horizontal divider instead of HStack horizontal plus/minus | AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_cluster_uses_vertical_layout` | happy_path |
| TC-4 | Zoom identifiers and callback binding remain stable after layout change | AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_callbacks_and_identifiers_remain_stable` | edge |
| TC-5 | Native token compliance and iOS build both exit 0 | AC-5 | `scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Organisms/LSMapControls+ResolvedValues.swift` | 37-85 | Current chip order model; move `.zoomCluster` to bottom |
| `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | 64-151 | Current rendering loop and horizontal `zoomClusterChip` |
| `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` | 9-180 | Existing appearance and handler tests |
| `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | 100-114 | Live consumer; ensure no consumer-specific reorder is introduced |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | 109-123 | Sandbox consumer; should inherit primitive behavior |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` (MODIFY - vertical zoom cluster layout)
- `ios/LaneShadow/Views/Organisms/LSMapControls+ResolvedValues.swift` (MODIFY - chip order)
- `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` (MODIFY - order/layout/accessibility regression tests)
- `ios/LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests.swift` (MODIFY only if existing UI coverage needs order assertion)

**Write-Prohibited:**
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` - read-only consumer for this task
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` - read-only consumer for this task
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` - owned by PLAN-S08-REM-IOS-T01
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` - owned by PLAN-S08-REM-IOS-T03
- `android/**`, `server/**`, `tokens/**` - out of scope

## Dependencies

**Depends on:** Sprint 07 `LSMapControls` implementation.

**Blocks:**
- PLAN-S08-IOS-T02 (planning-state controls should consume the corrected primitive)
- PLAN-S08-REM-AND-T01 (Android parity task mirrors the resulting order)
- PLAN-S08-T11 (human gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN LSMapControls map mode without save WHEN appearance resolves THEN zoomCluster is the final chip after modeToggle",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_map_mode_places_zoom_cluster_last",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Organisms/LSMapControls+ResolvedValues.swift:51-64; .tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1842-1843",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN LSMapControls map mode with save visible WHEN appearance resolves THEN save remains above modeToggle and zoomCluster remains final",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_save_chip_stays_above_bottom_zoom_cluster",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Organisms/LSMapControls+ResolvedValues.swift:55-63; .tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1844-1845",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN LSMapControls zoom cluster WHEN rendered THEN plus and minus are vertical with a horizontal divider and taller cluster frame",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_cluster_uses_vertical_layout",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Organisms/LSMapControls.swift:117-153; ios/LaneShadowTests/Organisms/LSMapControlsTests.swift:56-83; .tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1997; .tmp/PLAN-S08-REM-IOS-T02/idle-map-controls-simulator.png",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN zoom handlers WHEN controls render THEN zoom identifiers are unchanged and callbacks remain bound exactly once",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_callbacks_and_identifiers_remain_stable",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Organisms/LSMapControls.swift:120-139; ios/LaneShadowTests/Organisms/LSMapControlsTests.swift:85-128; .tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1846-1921",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN touched Swift files WHEN native compliance and iOS build run THEN both exit 0",
      "verify": "scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'",
      "satisfied": true,
      "evidence": "scripts/tokens/enforce-native-compliance.sh exit 0; .tmp/PLAN-S08-REM-IOS-T02/ac-5-output.txt:9760",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Map-mode chip order ends with zoomCluster when no save chip is visible",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_map_mode_places_zoom_cluster_last",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1842-1843",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Save chip remains above mode toggle and zoom remains last when save is visible",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_save_chip_stays_above_bottom_zoom_cluster",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1844-1845",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Zoom cluster uses vertical layout and horizontal divider",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_cluster_uses_vertical_layout",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1997",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Zoom identifiers and callback binding remain stable",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoom_callbacks_and_identifiers_remain_stable",
      "satisfied": true,
      "evidence": ".tmp/PLAN-S08-REM-IOS-T02/test-output.txt:1846-1921",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Native token compliance and iOS build both exit 0",
      "verify": "scripts/tokens/enforce-native-compliance.sh && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'",
      "satisfied": true,
      "evidence": "scripts/tokens/enforce-native-compliance.sh exit 0; .tmp/PLAN-S08-REM-IOS-T02/ac-5-output.txt:9760",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c12353b1c4aea3c9453cdaf7ac0ade39492b5e78",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
