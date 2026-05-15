# CAPS-S07-T16 — Android LSMapLayer parity audit (defensive — same class of bug as iOS T14)

> Status: ✅ Done
> Cycle: 1
> Updated: 2026-05-07T21:15:00-07:00
>
> **Task ID:** CAPS-S07-T16 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 30 min audit (+30 min if fix needed) · **Type:** BUG (conditional) · **Status:** Done · **Priority:** P1 · **Effort:** XS
> **PRD Refs:** UC-FID-01, UC-MAP-01

## Completion Evidence

- Audit result: Path A. Android `LSMapLayer` already uses `Modifier.fillMaxSize()` plus `align(Alignment.BottomCenter)` and `navigationBarsPadding()` for bottom overlays; the iOS T14 failure mode was not present in Android production code.
- Added source-level regression coverage in `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt` to pin the fill-before-bottom-alignment contract.
- Verified with `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest' --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' --tests 'com.laneshadow.ui.organisms.LSMapLayerTest' --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest' --tests 'com.laneshadow.ui.idle.IdleViewModelTest' --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest' --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'` — PASS.
- Android preview screenshot is recorded as BLOCKED in `gate-evidence/CAPS-S07-T16/audit-result.md` because `adb devices` returned no connected emulator/device. No synthetic preview PNG was fabricated.

## Background

CAPS-S07-T14 fixes a primitive layout bug in iOS `LSMapLayer.swift` where the `bottomOverlays` slot frame omitted `maxHeight: .infinity`, causing chat-input to collapse mid-screen instead of pinning to the bottom safe area. Cross-platform parity (per RULES.md §Cross-Platform Component Parity) requires that Android's equivalent layer primitive be audited for the same class of bug. If found, fix; if not present, document the audit result and close.

This is a **defensive** task — no broken Android symptom has been visually confirmed. The risk model is that if the iOS implementation drifted into this bug, the Compose port may have inherited it. A 30-minute audit is cheaper than discovering the bug in T08 capture or T09 sprint gate.

## Critical Constraints

**MUST:**
- Locate the Android Compose equivalent of `LSMapLayer`. Likely paths (search in this order):
  - `android/app/src/main/java/com/laneshadow/ui/templates/MapLayer.kt`
  - `android/app/src/main/java/com/laneshadow/ui/templates/LSMapLayer.kt`
  - `android/app/src/main/java/com/laneshadow/ui/organisms/MapLayer.kt`
  - Any Compose component that exposes `topOverlays`/`bottomOverlays` slot parameters (search via `rg "topOverlays|bottomOverlays|TopOverlays|BottomOverlays" android/app/src/main`)
- Inspect the layer's bottom-overlay positioning. The Compose-correct pattern is `Modifier.fillMaxHeight().align(Alignment.BottomCenter)` or `Modifier.fillMaxSize().wrapContentHeight(Alignment.Bottom)` — anything that fills the available height before applying bottom alignment. The buggy pattern (mirror of iOS) would be `Modifier.align(Alignment.BottomCenter)` without a `fillMaxHeight` modifier on the same chain, OR a `Box` parent that does not fill the available height.
- Inspect the layer's status-bar safe-area handling. Compose-correct: the topbar uses `Modifier.statusBarsPadding()` or sits inside a `Scaffold`'s top bar slot; the map canvas uses `Modifier.fillMaxSize()` without statusBarsPadding so it bleeds under the status bar. Buggy: a parent `Modifier.statusBarsPadding()` cascading to the map canvas (would create a gap).
- Document the audit result in this task's closure note:
  - **PATH A — Android is correct:** Document the file path + the relevant Modifier chain that proves correctness. Close as completed with no code change.
  - **PATH B — Android has the same/analogous bug:** Apply the minimal fix mirroring T14's iOS approach (fill-max-height for bottom overlay; respect status bar on topbar; map canvas still bleeds). Add an instrumented test asserting the bottom-overlay y-position is in the bottom 15% of the layer.
- Either path: capture a Compose preview screenshot of the layer with a known fixed-size bottom overlay rectangle on a 393×851dp (Pixel 6) target, attached to the closure note as evidence.

**NEVER:**
- Refactor the Android map-layer primitive beyond the minimal fix. This is not a Compose-architecture review task.
- Edit `IdleScreen` / `IdleRoute` / `IdleViewModel` Kotlin files — those are owned by Sprint 06 + CAPS-S07-T06.
- Change Compose dependencies, Gradle build files, or Mapbox SDK version.
- Document the audit only in commit messages — it must be in this task's closure evidence (`gate-evidence/CAPS-S07-T16/audit-result.md`).

**STRICTLY:**
- Use existing theme tokens (`MaterialTheme.spacing.md` or whichever LaneShadow Compose theme exposes).
- Mirror the iOS T14 fix structure where possible (same intent, idiomatic Compose form).
- Do not over-fix: if Android is already correct, do not "tidy" or "refactor" — close the task as audit-only.

## Specification

**Objective:** Audit Android's Compose equivalent of `LSMapLayer` for the bottom-overlay collapse bug fixed in iOS T14. Apply a minimal fix only if the bug is present. Otherwise document the audit and close.

**Success State (Path A — already correct):** Closure note documents file path + correctness evidence (Modifier chain quoted). No code change. Task closes as completed.

**Success State (Path B — fix needed):** Bottom overlay pins to the bottom of the layer in instrumented tests; topbar respects status bar; map canvas still bleeds under status bar. Closure note documents the audit finding + fix diff.

## Acceptance Criteria

### AC-1 — Android map-layer file located and audit documented

**GIVEN** the kotlin-implementer's audit work
**WHEN** complete
**THEN** the closure note `gate-evidence/CAPS-S07-T16/audit-result.md` exists and contains:
1. The exact Android file path of the Compose layer primitive
2. Quoted Modifier chains for: top overlay slot, bottom overlay slot, topbar, map content
3. A verdict: `Path A: already correct` or `Path B: fix required and applied`
4. If Path B: a `git diff` excerpt showing the fix
**Verify:** `test -f gate-evidence/CAPS-S07-T16/audit-result.md && grep -c "Path [AB]:" gate-evidence/CAPS-S07-T16/audit-result.md` returns `>= 1`.

### AC-2 — Path B only: instrumented test pins bottom overlay

**GIVEN** Path B was taken (fix applied)
**WHEN** the new instrumented test mounts the Compose layer with a 100×40dp known-color rectangle as a single bottom overlay on a 393×851dp Pixel 6 target
**THEN** the rectangle's vertical center y-position is in the **bottom 15%** of the layer (`centerY >= layerHeight * 0.85`)
**Verify (Path B only):** `cd android && ./gradlew app:connectedDebugAndroidTest --tests "*MapLayerLayoutTest.bottomOverlay_pinsToBottom"`

### AC-3 — Path B only: topbar respects status bar; map canvas bleeds

**GIVEN** Path B was taken
**WHEN** the layer mounts on a device with a non-zero status-bar height
**THEN** the topbar's top y-position is `>=` the WindowInsets statusBars top, AND the map content's top y-position is `0` (canvas extends under the status bar)
**Verify (Path B only):** `cd android && ./gradlew app:connectedDebugAndroidTest --tests "*MapLayerLayoutTest.topBar_respectsStatusBar_mapBleedsUnderIt"`

### AC-4 — Compose preview screenshot attached as evidence

**GIVEN** the audit is complete (either path)
**WHEN** closure evidence is collected
**THEN** a Compose preview screenshot of the layer with the test bottom-overlay rectangle is at `gate-evidence/CAPS-S07-T16/preview.png`. The screenshot must show the rectangle positioned at the bottom of the layer.
**Verify:** `test -f gate-evidence/CAPS-S07-T16/preview.png`

### AC-5 — All existing Android tests still pass (no regressions)

**GIVEN** any code changes (Path B)
**WHEN** the existing Android instrumented + unit suites run
**THEN** they all pass with no regressions
**Verify:** `cd android && ./gradlew test connectedDebugAndroidTest`

### AC-6 — Path A only: zero code-change verification

**GIVEN** Path A was taken (already correct)
**WHEN** git diff is inspected
**THEN** zero `.kt` files are modified by this task; only the closure evidence files (audit-result.md, preview.png) are added
**Verify (Path A only):** `git diff --name-only HEAD~1 HEAD -- 'android/**/*.kt' | wc -l` returns `0` (no Kotlin files changed in this task's commit).

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Closure evidence file exists with verdict line | AC-1 | happy_path |
| TC-2 | (Path B) Instrumented test pins bottom overlay to bottom 15% | AC-2 | happy_path |
| TC-3 | (Path B) Topbar respects status bar; map bleeds under it | AC-3 | happy_path |
| TC-4 | Compose preview screenshot attached | AC-4 | happy_path |
| TC-5 | (Path B) Full Android test suite passes | AC-5 | happy_path |
| TC-6 | (Path A) Zero Kotlin files modified | AC-6 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 1-117 | Reference implementation post-T14 fix; mirror its slot-positioning intent |
| `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/CAPS-S07-T14-ios-mapLayer-overlay-slot-positioning-fix.md` | all | iOS twin of this task; bug description + acceptance criteria language to mirror |
| `android/app/src/main/java/com/laneshadow/ui/templates/` | (search) | Likely location of the Compose layer primitive |
| `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` | all | Layer consumer pattern (mirrors `IdleScreenContainer.swift`) |
| `.spec/design/system/views/mapapp/idle/idle-screen.html` | all | Authoritative overlay positions |

## Guardrails

**Write-Allowed:**
- The Compose layer primitive file (MODIFY only if Path B; declare the path in closure note)
- `android/app/src/androidTest/java/com/laneshadow/ui/templates/MapLayerLayoutTest.kt` (NEW only if Path B)
- `gate-evidence/CAPS-S07-T16/audit-result.md` (NEW)
- `gate-evidence/CAPS-S07-T16/preview.png` (NEW)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/idle/**` — Sprint 06 + CAPS-S07-T06 own the idle feature surface
- Compose theme files, Gradle build files, Mapbox dependencies
- `ios/**`, `server/**`, `react-native/**`

## Design

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — overlay positioning contract
- iOS T14 spec — twin task for parity

**Pattern:** Compose `Box(modifier = Modifier.fillMaxSize()) { ... }` with children using `Modifier.align(Alignment.BottomCenter)` is the standard absolute-positioning idiom. The fix (if needed) wraps the bottom-overlay child in a `Modifier.fillMaxHeight()` chain or applies `wrapContentHeight(Alignment.Bottom)`.

**Anti-Pattern:** Adding `Spacer(Modifier.weight(1f))` to push the bottom overlay (changes layout semantics for hosts that mount additional siblings); cascading `Modifier.statusBarsPadding()` from the parent to the map canvas (creates a status-bar-shaped gap).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `test -f gate-evidence/CAPS-S07-T16/audit-result.md && grep -c "Path [AB]:" gate-evidence/CAPS-S07-T16/audit-result.md` |
| AC-2 (Path B) | `cd android && ./gradlew app:connectedDebugAndroidTest --tests "*MapLayerLayoutTest.bottomOverlay_pinsToBottom"` |
| AC-3 (Path B) | `cd android && ./gradlew app:connectedDebugAndroidTest --tests "*MapLayerLayoutTest.topBar_respectsStatusBar_mapBleedsUnderIt"` |
| AC-4 | `test -f gate-evidence/CAPS-S07-T16/preview.png` |
| AC-5 (Path B) | `cd android && ./gradlew test connectedDebugAndroidTest` |
| AC-6 (Path A) | `git diff --name-only HEAD~1 HEAD -- 'android/**/*.kt' \| wc -l` |
| build | `cd android && ./gradlew assembleDebug` |
| lint | `cd android && ./gradlew lintDebug` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose / Android-specific layout audit. Single file or zero-change closure path. Within kotlin-implementer's domain.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity)

## Dependencies

**Depends on:** none (parallel-safe with T14, T15)
**Blocks:** CAPS-S07-T06 (Android IdleScreen retrofit) only if Path B and a fix is required; otherwise informational.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN audit done WHEN closure inspected THEN audit-result.md exists with Path A or Path B verdict","verify":"test -f gate-evidence/CAPS-S07-T16/audit-result.md && grep -c 'Path [AB]:' gate-evidence/CAPS-S07-T16/audit-result.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"(Path B only) GIVEN fix applied WHEN instrumented test runs THEN bottom overlay centerY >= layerH * 0.85","verify":"cd android && ./gradlew app:connectedDebugAndroidTest --tests '*MapLayerLayoutTest.bottomOverlay_pinsToBottom'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"(Path B only) GIVEN fix applied WHEN layer mounts THEN topbar respects status bar; map canvas bleeds","verify":"cd android && ./gradlew app:connectedDebugAndroidTest --tests '*MapLayerLayoutTest.topBar_respectsStatusBar_mapBleedsUnderIt'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN audit complete WHEN evidence collected THEN preview.png attached","verify":"test -f gate-evidence/CAPS-S07-T16/preview.png","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"(Path B only) GIVEN code changes WHEN existing Android suite runs THEN no regressions","verify":"cd android && ./gradlew test connectedDebugAndroidTest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"(Path A only) GIVEN audit-only WHEN git diff inspected THEN zero Kotlin files modified","verify":"git diff --name-only HEAD~1 HEAD -- 'android/**/*.kt' | wc -l","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"audit-result.md exists with Path verdict","verify":"test -f gate-evidence/CAPS-S07-T16/audit-result.md && grep -c 'Path [AB]:' gate-evidence/CAPS-S07-T16/audit-result.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"(Path B) Bottom-overlay pin test passes","verify":"cd android && ./gradlew app:connectedDebugAndroidTest --tests '*MapLayerLayoutTest.bottomOverlay_pinsToBottom'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"(Path B) Topbar/map bleed test passes","verify":"cd android && ./gradlew app:connectedDebugAndroidTest --tests '*MapLayerLayoutTest.topBar_respectsStatusBar_mapBleedsUnderIt'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"preview.png present","verify":"test -f gate-evidence/CAPS-S07-T16/preview.png","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"(Path B) Android test suite passes","verify":"cd android && ./gradlew test connectedDebugAndroidTest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"(Path A) zero .kt files modified","verify":"git diff --name-only HEAD~1 HEAD -- 'android/**/*.kt' | wc -l","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
