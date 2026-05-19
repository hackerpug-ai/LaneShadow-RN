# Android Learnings: PLAN-S08-AND-T02

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. The direct `PlanningScreen` story surface was still a real contract surface even though the live host also has planning controls elsewhere; keeping only the host-level helper/model green was not enough because sandbox coverage mounts `PlanningScreen` directly.
2. The previous TC-4 source scan could pass while the rendered workbar still omitted planning behavior. The regression test now composes `PlanningScreen` and verifies the real controls plus toggle transition.

## API Contract Notes
- No backend or repository contract changes were required for this remediation.
- Planning-state controls currently expose recenter, layers/reset, zoom, and chat toggle on the live path; save remains hidden until a route-save condition is available.

## UI Decisions
- `PlanningScreen` now reuses the existing planning workbar model so the direct template surface and the host-driven planning surface stay aligned on recenter, reset/layers, and chat-toggle behavior.
- The planning workbar defaults to `MapControlsMode.Map` and switches locally between map/chat modes so TC-4 can verify a real rendered toggle path instead of a helper-only model.

## Gotchas for iOS Implementer
- If iOS has both a direct planning template and a shared host path, keep their workbar behavior aligned or delete one contract surface explicitly; partial alignment creates false-green tests.
- Tests that only inspect template source are not enough for shared-host flows; verify rendered controls on the actual composable surface that stories or routes mount.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — wired the direct planning workbar to the full planning-state control model with local map/chat toggle state.
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` — replaced TC-4 helper-only assertions with rendered `PlanningScreen` workbar assertions.
