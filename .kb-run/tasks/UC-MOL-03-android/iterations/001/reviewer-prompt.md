# Reviewer Packet: UC-MOL-03-android

Execution unit: `UC-MOL-03-android`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-android-bottomsheet-toast-modal-molecules.md`
Base commit: `53b52c6869136f481466e40af913eeae083f735f`
Candidate commit: `2380153adb00cd9246bd255c28cab8d9ab61f3c0`
Checkpoint branch: `kb-run/sprint-04-UC-MOL-03-android`

## Scope

- `ai-specs/UC-MOL-03-android/android-learnings.md`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSModalTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSBottomSheetUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`

## Task Requirements

- AC-1: `LSBottomSheet` medium detent uses token surface, subtle drag handle, `ModalBottomSheet`, and enter motion recipe reference.
- AC-2: Small and large bottom-sheet detents resolve the required `0.25` and `0.9` fractions from screen height.
- AC-3: Drag-to-dismiss fires `onDismiss` exactly once.
- AC-4: `LSToast` success variant uses token status color and token-derived auto-dismiss timing.
- AC-5: All four toast variants resolve distinct required colors.
- AC-6: `LSModal` composes from `LSCard`, `LSText`, and `LSButton` atoms rather than `AlertDialog`.
- AC-7: Overlay molecules stay token-driven in theme changes and avoid literal `Color(0xFF...)` values or hardcoded toast delays.
- AC-8: Sandbox registers at least nine overlay stories across bottom sheet, toast, and modal.

## Validation Evidence

- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew detekt` -> pass
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugKotlin` -> pass
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest' --tests 'com.laneshadow.ui.molecules.LSToastTest' --tests 'com.laneshadow.ui.molecules.LSModalTest'` -> pass
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSBottomSheetUiTest` -> pass on `emulator-5554`
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew test` -> pass
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'` -> pass
- `grep -n 'delay(3000)\\|delay(2000)\\|delay(4000)' android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt | wc -l | grep -x '0'` -> pass
- `grep -c 'molecules.bottomsheet\\|molecules.toast\\|molecules.modal' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'` -> pass (`9`)

## Candidate Summary

- Added Compose implementations for `LSBottomSheet`, `LSToast`, and `LSModal` with token-backed overlay styling, motion helpers, and atom composition.
- Added unit coverage for all three molecules plus an instrumented swipe-to-dismiss test for the bottom sheet.
- Added nine overlay stories and registered them in the molecule sandbox catalog.

## Residual Risk

- The toast auto-dismiss duration is token-derived from the current motion map and resolves very quickly in this environment, so the sandbox story re-triggers the toast to keep it visible enough for inspection.
- Motion helpers now tolerate missing theme motion inputs by falling back to token-aligned defaults; confirm that this is acceptable rather than masking a theme contract failure.

## Review Instructions

1. Review the exact diff with `git diff 53b52c6869136f481466e40af913eeae083f735f..2380153adb00cd9246bd255c28cab8d9ab61f3c0`.
2. Read every changed file in full, with extra scrutiny on `LSBottomSheet.kt`, `LSToast.kt`, `LSModal.kt`, and `LSBottomSheetUiTest.kt`.
3. Decide whether the runtime motion fallbacks are the right contract for this task or a hidden regression risk.
4. Treat the connected-test evidence as strong validation because the packet includes the exact emulator used (`Pixel_7_API_34`, serial `emulator-5554`).
5. Return only JSON matching the required reviewer verdict schema.
