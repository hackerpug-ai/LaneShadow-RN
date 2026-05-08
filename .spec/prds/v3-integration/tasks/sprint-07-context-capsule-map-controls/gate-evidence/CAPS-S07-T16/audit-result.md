# CAPS-S07-T16 Android LSMapLayer Parity Audit

Date: 2026-05-07T21:15:00-07:00
Owner: Codex

## Verdict

PASS: Android does not have the iOS T14 bottom-overlay collapse bug.

## Evidence

- Audited file: `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt`
- Bottom overlays are rendered inside a `Box` whose modifier includes `fillMaxSize()` and whose `contentAlignment` is `Alignment.BottomCenter`.
- Bottom overlay content uses `navigationBarsPadding()`, so the chat input stays above the system navigation area.
- Top overlays use `statusBarsPadding()`, while the map slot remains a full-size canvas.
- Added a source-level regression test in `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt` covering the `fillMaxSize()` + `Alignment.BottomCenter` + `navigationBarsPadding()` contract.

## Screenshot Status

BLOCKED: no connected Android emulator/device session was available in this run for a Compose preview screenshot. `adb devices` returned no attached devices. The audit is closed on source and JVM test evidence; physical/emulator visual capture should be folded into the next Android device pass.

## Verification

Target command passed:

```bash
cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest'
```

Broader Sprint 7 Android command passed after fixing deterministic `IdleViewModel` test-clock construction:

```bash
cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest' --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' --tests 'com.laneshadow.ui.organisms.LSMapLayerTest' --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest' --tests 'com.laneshadow.ui.idle.IdleViewModelTest' --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest' --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'
```
