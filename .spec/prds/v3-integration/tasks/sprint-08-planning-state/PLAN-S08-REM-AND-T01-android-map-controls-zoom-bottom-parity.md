# PLAN-S08-REM-AND-T01 - Android map controls zoom-bottom parity

> Status: Backlog
> Cycle: 0
> Updated: 2026-05-08T00:00:00.000Z

> **Task ID:** PLAN-S08-REM-AND-T01
> **Sprint:** [Sprint 08 - Map View - Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 90 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P2
> **Effort:** S
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, Sprint 08 remediation note 2026-05-08, RULES.md Cross-Platform Component Parity

## Background

The user remediation asks for the zoom controls to sit at the bottom of the right-aligned control stack. iOS currently has a horizontal zoom cluster and puts it first; PLAN-S08-REM-IOS-T02 fixes iOS. Android already renders the zoom cluster vertically, but `LSMapControls.kt` still renders it first in `MapControlsMode.Map`.

This task keeps Android's vertical plus-over-minus cluster, moves it to the bottom of the map-mode workbar, and updates tests so Android stays conceptually paired with the iOS `LSMapControls` story and behavior.

## Critical Constraints

**MUST:**
- Keep the Android zoom cluster vertical: plus above divider above minus.
- Move the zoom cluster to the bottom-most map-mode chip position after recenter, layers, optional save, and mode toggle.
- Preserve existing test tags and semantics: `ls-map-controls-zoom-cluster`, `ls-map-controls-zoom-in`, `ls-map-controls-zoom-out`.
- Preserve handler semantics, including `onClear` backing the layers/reset chip.

**NEVER:**
- Never change Android to match iOS's old horizontal zoom layout.
- Never create a platform-only control order that diverges from PLAN-S08-REM-IOS-T02.
- Never modify iOS files in this Android parity task.

**STRICTLY:**
- Follow Compose token usage through `LocalLaneShadowTheme.current`.
- Add or update tests before implementation.

## Specification

**Objective:** Update Android `LSMapControls` so the vertical zoom cluster is bottom-most in the right-edge map-mode workbar, matching the corrected iOS behavior.

**Success State:** Android map mode renders recenter/layers/save-if-present/mode-toggle above the zoom cluster; chat mode still renders only the mode toggle; existing tags and callbacks remain stable.

## Acceptance Criteria

### AC-1 - Map mode places zoom cluster last

**GIVEN** `LSMapControls(mode = MapControlsMode.Map)` with zoom, recenter, clear/layers, and toggle handlers
**WHEN** the Compose tree renders
**THEN** `LSMAPCONTROLS_ZOOM_CLUSTER_TAG` is the final/bottom child in the workbar after the toggle chip
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_places_zoom_cluster_last'`

### AC-2 - Save state preserves zoom-bottom order

**GIVEN** `hasRouteToSave = true` and `handlers.onSaveRoute != null`
**WHEN** map controls render
**THEN** save chip remains above mode toggle and zoom cluster remains bottom-most
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.save_chip_stays_above_bottom_zoom_cluster'`

### AC-3 - Zoom cluster remains vertical and accessible

**GIVEN** zoom in/out handlers are provided
**WHEN** the zoom cluster renders
**THEN** plus appears above minus with a horizontal divider, and existing zoom tags/content descriptions are unchanged
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.zoom_cluster_remains_vertical_and_accessible'`

### AC-4 - Chat mode remains toggle-only

**GIVEN** `LSMapControls(mode = MapControlsMode.Chat)`
**WHEN** controls render
**THEN** only the mode-toggle chip is visible; zoom cluster is not rendered in chat mode
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_remains_toggle_only'`

### AC-5 - Kotlin checks pass

**GIVEN** the parity remediation is complete
**WHEN** native compliance, focused tests, and Android compile run
**THEN** all exit 0
**Verify:** `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Android map-mode workbar renders zoom cluster as the final/bottom chip | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_places_zoom_cluster_last'` | happy_path |
| TC-2 | Android save chip remains above mode toggle and zoom remains bottom-most when save is visible | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.save_chip_stays_above_bottom_zoom_cluster'` | edge |
| TC-3 | Android zoom cluster remains vertical and keeps existing tags/content descriptions | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.zoom_cluster_remains_vertical_and_accessible'` | happy_path |
| TC-4 | Android chat mode renders only the mode-toggle chip and omits zoom cluster | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_remains_toggle_only'` | edge |
| TC-5 | Native compliance, focused tests, and Android Kotlin compile exit 0 | AC-5 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` | 97-286 | Current Compose order; zoom cluster is first and mode toggle last |
| `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControlsTypes.kt` | all | Mode, handlers, and semantics property contracts |
| `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` | all | Existing Compose test pattern for tags, handlers, and theme behavior |
| `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` | 120-140 | Idle consumer; should inherit primitive behavior |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-REM-IOS-T02-ios-map-controls-zoom-bottom-remediation.md` | all | iOS twin behavior for cross-platform parity |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` (MODIFY - reorder map-mode chip emission)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControlsTypes.kt` (MODIFY only if a small testable order helper is needed)
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` (MODIFY - order/orientation/accessibility regressions)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` - read-only consumer for this task
- `android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt` - legacy molecule; do not patch unless a failing test proves it is still used
- `ios/**` - owned by PLAN-S08-REM-IOS-T02
- `server/**`, `tokens/**` - out of scope

## Dependencies

**Depends on:** Sprint 07 Android `LSMapControls` implementation and PLAN-S08-REM-IOS-T02 behavior definition.

**Blocks:**
- PLAN-S08-AND-T02 (planning-state controls should consume corrected primitive)
- PLAN-S08-AND-T05 (capture tests should not lock in old control order)
- PLAN-S08-T11 (human gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN Android LSMapControls map mode with all handlers WHEN rendered THEN zoom cluster is the final bottom child after toggle","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_places_zoom_cluster_last'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Android LSMapControls with save visible WHEN rendered THEN save remains above mode toggle and zoom cluster remains bottom-most","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.save_chip_stays_above_bottom_zoom_cluster'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN Android zoom handlers WHEN rendered THEN zoom cluster remains vertical with stable tags and content descriptions","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.zoom_cluster_remains_vertical_and_accessible'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN Android LSMapControls chat mode WHEN rendered THEN only mode-toggle is visible and zoom cluster is omitted","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_remains_toggle_only'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN touched Kotlin files WHEN native compliance, focused tests, and compileDebugKotlin run THEN all exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Android map-mode workbar renders zoom cluster as final bottom chip","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_places_zoom_cluster_last'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Android save chip remains above mode toggle and zoom remains bottom-most","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.save_chip_stays_above_bottom_zoom_cluster'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Android zoom cluster remains vertical and keeps existing tags/content descriptions","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.zoom_cluster_remains_vertical_and_accessible'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Android chat mode renders only mode-toggle and omits zoom cluster","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_remains_toggle_only'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Native compliance, focused tests, and Android Kotlin compile exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"}
  ]
}
-->
