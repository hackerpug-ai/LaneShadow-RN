# kb-run Implementer Prompt

Execution unit: `UC-MOL-03-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-03-android`
Role: `kotlin-implementer`
Start commit: `2380153adb00cd9246bd255c28cab8d9ab61f3c0`
Review cycle: `002`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- The worktree currently has hook noise in `.kb-run-sprint-codex/.state.json.sha256`. Ignore it and do not treat it as task scope.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean task worktree apart from the hook-managed checksum file above.
- Respect `RULES.md`. Keep scope limited to this overlay molecule task and the minimal Android theme-motion bridge needed to make the runtime contract correct.

## Objective

Fix the reviewer rejection from iteration `001`. Android overlay motion is currently masking a token-contract mismatch behind silent fallbacks, and the toast readable lifetime is wrong because it uses the `fast` animation duration as the entire visible window.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-android-bottomsheet-toast-modal-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-03-android/iterations/001/reviewer-response.json`
3. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-03-android/iterations/001/implementer-response.json`
4. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/06-uc-mol.md`
5. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/toast/README.md`
6. `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-android/tokens/platforms/kotlin/src/main/assets/semantic.tokens.json`
7. `android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt`
8. `android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt`
9. `android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt`
10. `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt`
11. `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt`
12. `android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt`
13. `android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt`
14. `android/app/src/test/java/com/laneshadow/ui/molecules/LSModalTest.kt`

## Scope

Write allowed:

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSModalTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSBottomSheetUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt`
- `ai-specs/UC-MOL-03-android/android-learnings.md`

Write allowed only if required to make the motion contract real on Android:

- the minimal Android theme/token bridge file(s) that expose the shipped motion data correctly to overlay molecules

Write prohibited:

- `ios/**`
- `.kb-run/**`
- unrelated Android modules outside the overlay/theme-motion surface
- token source files under `tokens/**` unless the reviewer finding makes them the only minimal fix

## Reviewer Findings To Fix

1. `LSBottomSheet`, `LSModal`, and `LSToast` ask for motion keys the Android semantic asset does not ship (`standard`, `decelerated`, `linear`), so production runtime falls back to hardcoded literals instead of a real token-backed contract.
2. `LSToast` uses `theme.motion.duration["fast"]` as the whole visible lifetime, which resolves to `120ms` in the shipped Android asset and violates the toast authority's `5000ms` readable `chatOverlayDismiss` lifetime.
3. The current implementation tolerates missing motion inputs via silent fallback literals, which breaks AC-7 because theme changes cannot actually drive these overlays.

## Acceptance Requirements

1. Eliminate silent runtime fallback behavior for overlay motion. The final runtime path must either consume the real shipped Android motion data or fail loudly if the contract is missing.
2. Keep the named overlay motion contracts aligned with `motion.recipe.chatOverlayEnter` / `motion.recipe.chatOverlayDismiss`.
3. Make toast readable lifetime match the design authority: visible window `5000ms`, with exit/progress timing sourced from the correct recipe-backed contract rather than the generic `fast` duration.
4. Remove the sandbox toast re-trigger workaround if it is no longer needed after the lifetime fix.
5. Strengthen the tests so they would fail if the code slips back to silent fallbacks or a `120ms` toast lifetime.
6. Do not regress the already-correct detents, dismiss-once behavior, atom composition, story count, or no-literal-color rules.

## Validation Targets

- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew detekt`
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugKotlin`
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest' --tests 'com.laneshadow.ui.molecules.LSToastTest' --tests 'com.laneshadow.ui.molecules.LSModalTest'`
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSBottomSheetUiTest`
- `source ../../../scripts/agent-worktree-env.sh && cd android && ./gradlew test`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'`
- `grep -n 'delay(3000)\\|delay(2000)\\|delay(4000)' android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt | wc -l | grep -x '0'`

## Completion Contract

Return a JSON completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- RED/GREEN evidence for both the motion-contract fix and the toast lifetime fix
- explicit explanation of how the final code resolves overlay motion from the real Android token/theme surface
- explicit explanation of how the final code preserves the `5000ms` readable toast lifetime without reintroducing hardcoded fallback drift
- any residual risks
