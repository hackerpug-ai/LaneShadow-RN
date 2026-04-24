# kb-run Implementer Prompt

Execution unit: `UC-MOL-02-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-02-android`
Role: `kotlin-implementer`
Start commit: `86f24f890661764f15a7532899954ef4fe3e9d56`
Review cycle: `004`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-02-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md`. Do not redo the feature from scratch; fix only the remaining AC-1 defect and its test proof.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-android-toolbar-navheader-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/003/reviewer-response.json`
3. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/003/implementer-response.json`
4. `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
5. `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
6. `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
7. `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt`
8. `tokens/semantic/dimensions.tokens.json`
9. `tokens/semantic/semantic.tokens.json`

## Scope

Write allowed:

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
- `ai-specs/UC-MOL-02-android/android-learnings.md`

Write prohibited:

- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
- `android/app/build.gradle.kts`
- `tokens/**`
- `ios/**`

## Recovery Note

Ignore `.kb-run-sprint-codex/.state.json.sha256`. It is harness-managed and out of task scope.

## Remaining Defect To Fix

1. The current bridge uses `space.xxxxl`, but reviewer confirmed that rung is `64dp`. The required toolbar component token is `56dp`.
2. `LSToolbarTest.default_render_uses_chrome_tokens` still reads the expected value from `theme.toolbarComponentSizing.toolbarHeight`, so it self-validates the bad bridge.

## Acceptance Requirements

You are fixing only the remaining AC-1 issue. The task is done when:

1. `toolbarComponentSizing.toolbarHeight` resolves from the actual `component.toolbarHeight = 56` token source on Android, not from any spacing rung.
2. `LSToolbar` and `LSNavHeader` consume that corrected toolbar-height value.
3. `default_render_uses_chrome_tokens` asserts the canonical 56dp component token or an independent direct component-token API, not the same helper used by production.
4. Existing AC-2 through AC-6 behavior remains green.

## Strong Hint

The reviewer found `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt` already exposes generated sizing surfaces such as `GeneratedTokens.sizing.icon.*`. Use the generated component toolbar height if it already exists instead of inventing another bridge.

## Validation Targets

- `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest" --tests "com.laneshadow.ui.molecules.LSNavHeaderTest"`
- `cd android && ./gradlew :app:assembleDebug`
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSToolbarUiTest`

## Completion Contract

Return JSON matching this shape exactly:

```json
{
  "status": "completed | blocked",
  "task_id": "UC-MOL-02-android",
  "blocking_issues": [],
  "unblock_options": [],
  "failure_classification": "none | pre_existing | task_introduced",
  "failed_commands": [],
  "evidence_path": "path",
  "evidence_manifest_path": "path",
  "summary": "summary",
  "files_changed": ["relative/path"],
  "verification_commands": ["command"],
  "acceptance_criteria_evidence": [{"id": "AC-1", "status": "met | not_met", "evidence": ["proof"]}],
  "reviewer_considerations": ["focus area"],
  "notes": "include base sha, final commit sha, RED/GREEN evidence, instrumentation/device status"
}
```
