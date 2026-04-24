# kb-run Implementer Prompt

Execution unit: `UC-MOL-03-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-android`
Role: `kotlin-implementer`
Start commit: `53b52c6869136f481466e40af913eeae083f735f`
Review cycle: `001`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Source `../../scripts/agent-worktree-env.sh` before running Gradle commands so caches and daemons stay isolated to this worktree.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean task-scope worktree. Ignore only `.kb-run-sprint-codex/.state.json.sha256` if it changes during your session.
- Respect `RULES.md`. Keep scope limited to this task's overlay molecules, tests, stories, registry updates, and learnings.

## Objective

Implement `UC-MOL-03-android` from scratch on this worktree base and satisfy the full task contract for:

- `LSBottomSheet`
- `LSToast`
- `LSModal`

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-android-bottomsheet-toast-modal-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/06-uc-mol.md`
3. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/bottom-sheet/`
4. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/toast/`
5. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/modal/`
6. `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
7. `android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt`
8. `android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt`
9. `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`
10. Any existing overlay-adjacent Android molecule/test patterns needed for local conventions

## Scope

Write allowed:

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
- `ai-specs/UC-MOL-03-android/android-learnings.md`

Write prohibited:

- `android/app/build.gradle.kts`
- `android/app/src/main/java/com/laneshadow/ui/atoms/**`
- `tokens/**`
- `ios/**`

## Key Contract Reminders

1. `LSBottomSheet` must use `ModalBottomSheet` from Material3, with named detent fraction constants derived from screen height. No custom drag sheet.
2. `LSToast` auto-dismiss must derive from `theme.motion.duration.chatOverlayDismiss` or an equivalent named theme token constant. No `delay(3000)` style literals.
3. `LSModal` must use `Dialog { LSCard { ... } }`, and all title/body/action content must compose through LS atoms.
4. `LSGlassPanel` or `LSPanel` must provide the visible sheet surface background.
5. Story registration is part of the contract; there must be at least 9 story IDs across the three new story files.
6. No raw `Text()` or `Icon()` in the three new molecule files, no literal `Color(0xFF...)`, and no hardcoded toast delay literals.

## Validation Targets

- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest' --tests 'com.laneshadow.ui.molecules.LSToastTest' --tests 'com.laneshadow.ui.molecules.LSModalTest'`
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSBottomSheetUiTest`
- `cd android && ./gradlew test`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'`
- `grep -n 'delay(3000)\\|delay(2000)\\|delay(4000)' android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt | wc -l | grep -x '0'`
- `grep -c 'molecules.bottomsheet\\|molecules.toast\\|molecules.modal' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'`

## Completion Contract

Write a JSON completion report to:

- `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-android/implementer_response.json`

Also print the same JSON in your final response. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary
- emulator/device status for the connected test
- any residual risks or known limitations
