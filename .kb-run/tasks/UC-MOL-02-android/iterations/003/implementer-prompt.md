# kb-run Implementer Prompt

Execution unit: `UC-MOL-02-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-02-android`
Role: `kotlin-implementer`
Start commit: `262d1d858f1683fe5a51f7aaf9f191aa19080f2e`
Review cycle: `003`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-02-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md`. Do not redo the feature from scratch; remediate the current implementation in place.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-android-toolbar-navheader-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/002/reviewer-response.json`
3. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/002/implementer-response.json`
4. `.spec/design/system/molecules/toolbar/`
5. `.spec/design/system/molecules/nav-header/`
6. `.spec/prds/v2/06-uc-mol.md`
7. `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
8. `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
9. `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
10. `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
11. `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`

## Scope

Write allowed:

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`
- `ai-specs/UC-MOL-02-android/android-learnings.md`

Write prohibited:

- `android/app/build.gradle.kts`
- `android/app/src/main/java/com/laneshadow/ui/atoms/**`
- `tokens/**`
- `ios/**`

## Recovery Note

Ignore `.kb-run-sprint-codex/.state.json.sha256`. It is harness-managed and out of task scope.

## Reviewer Findings To Fix

1. `AC-1` failed because `LSToolbar` reconstructs height as `space.xxxxl - space.sm` instead of reading a toolbar component token/API for `sizing.component.toolbarHeight`.
2. `LSToolbarTest.default_render_uses_chrome_tokens` is too weak; it checks key presence and node existence but does not prove exact background/height/button semantics.
3. `AC-4` failed because `LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes` does not assert exact subtitle spacing or exact subtitle token semantics.
4. `AC-5` failed because `LSToolbarUiTest.window_insets_system_bars_respected` does not actually prove `WindowInsets.systemBars` behavior; it only checks that the toolbar top is greater than zero.

## Acceptance Requirements

Implement all ACs and TCs from the task file. The critical remediation targets are:

1. Resolve toolbar/nav-header height from a real toolbar component token source available to the Android implementation, not by reconstructing `56` from spacing rungs.
2. Strengthen `default_render_uses_chrome_tokens` so it proves exact token-backed height and chrome semantics instead of generic semantics-key presence.
3. Strengthen `large_title_with_subtitle_renders_both_nodes` so it proves exact subtitle spacing and exact subtitle token semantics.
4. Rewrite the instrumentation proof for `WindowInsets.systemBars` so it would be meaningful once an emulator/device is attached.
5. Keep AC-2, AC-3, and AC-6 green.

## Validation Targets

- `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest" --tests "com.laneshadow.ui.molecules.LSNavHeaderTest"`
- `cd android && ./gradlew :app:assembleDebug`
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSToolbarUiTest`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt | wc -l | grep -x '0'`
- `grep -c 'molecules.toolbar\\|molecules.navheader' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 7'`

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
