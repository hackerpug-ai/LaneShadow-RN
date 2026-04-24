# kb-run Reviewer Prompt

Execution unit: `UC-ATM-03-android`
Sprint: `sprint-02-atoms-foundation-primitives`
Role: `kotlin-reviewer`
Worktree: `.kb-run/worktrees/UC-ATM-03-android`
Latest implementer commit: `719cdaf55165b3dc03df1bf5a1a0137a3cb01749`

## Review Standard

The user explicitly relaxed testing standards for this sprint.

Interpretation for this review:

- Prioritize correctness, scope, and merge safety.
- Do not reject solely for non-exhaustive tests if the implementation is sound and targeted build/smoke evidence is present.
- Do not require additional polish-only coverage beyond the core task outcome.

## Task

Review `UC-ATM-03-android` against:

- `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-03-android-input-atoms-lstextfield-lstextarea-android-compose.md`

Important context:

- The live repo uses `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`, not the task doc's older story path.
- The live theme path is `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt`, not the task doc's older app-local theme path.
- The repo exposes no Gradle `detekt` task; this is a documented repo/task-doc mismatch, not a newly introduced regression.
- The release artifact path in this repo is `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

## Scope Under Review

Branch diff vs `main...HEAD` currently contains:

- `android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextAreaInstrumentationTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextFieldInstrumentationTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/InputState.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSTextAreaTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt`

Latest implementer commit itself changed the same files.

## What Changed

- Added `InputState`, `LSTextField`, and `LSTextArea`.
- Added sandbox stories for all required text field and text area states.
- Added unit coverage for token mapping and textarea growth behavior.
- Added instrumentation coverage for focused border semantics and textarea overflow semantics.

## Validation Evidence

- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest" --tests "com.laneshadow.ui.atoms.LSTextAreaTest"` -> PASS
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugAndroidTestKotlin` -> PASS
- Booted `Pixel_7_API_34` on `emulator-5554` and ran `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.atoms.LSTextFieldInstrumentationTest,com.laneshadow.ui.atoms.LSTextAreaInstrumentationTest` -> PASS (`Finished 2 tests ... BUILD SUCCESSFUL`)
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugKotlin` -> PASS
- Story registration grep in `LSInputStories.kt` -> PASS
- Forbidden literal color/font/icon grep across `LSTextField.kt` and `LSTextArea.kt` -> PASS
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:assembleRelease` -> PASS
- `unzip -l android/app/build/outputs/apk/release/app-release-unsigned.apk | grep -c com.nativesandbox` -> `0`
- Commit hook passed and produced `719cdaf5`

## Review Focus

1. Does the branch satisfy AC-1 through AC-9 with merge-safe Compose implementations?
2. Are the instrumentation semantics and helper functions coherent, or is there hidden complexity/risk the unit tests do not catch?
3. Is the sandbox story wiring consistent with the current `AtomsStories.kt` architecture?
4. Are there any remaining merge blockers, regressions, or scope problems?

## Required JSON

Return JSON only:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-ATM-03-android",
      "verdict": "APPROVED | NEEDS_FIXES",
      "requirements": [
        {
          "id": "AC-1",
          "satisfied": true,
          "evidence": "file/test output",
          "remediation": null
        }
      ]
    }
  ],
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "task_id": "UC-ATM-03-android",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid when the remaining issues are non-blocking under the relaxed sprint standard and there are no `CRITICAL` or `HIGH` findings.
