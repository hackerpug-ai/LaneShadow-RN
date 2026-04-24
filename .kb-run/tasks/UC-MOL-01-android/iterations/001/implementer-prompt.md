# kb-run Implementer Prompt

Execution unit: `UC-MOL-01-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-01-android`
Role: `kotlin-implementer`
Start commit: `fbe49fe479d55d6eee99efa6264bea5ec7bce515`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-01-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's Android molecule, test, and story files.

## Objective

Implement `UC-MOL-01-android` from the current task spec with full TDD evidence:

- `LSContentCard` and `LSListRow` as Android molecules
- atom-only composition through `LSCard`, `LSText`, `LSAvatar`, `LSIcon`, and `LSDivider`
- all 10 sandbox stories registered
- interactive `LSListRow` tap fires exactly once
- no literal colors or bare `Text(...)` inside the molecule files

## Required Reading

Read these before editing:

1. `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-01-android-card-listrow-molecules.md`
2. `.spec/design/system/molecules/content-card/`
3. `.spec/design/system/molecules/list-row/`
4. `.spec/prds/v2/06-uc-mol.md`
5. `android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt`
6. `android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt`
7. `android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt`
8. `android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt`
9. `android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt`

## Scope

Write allowed:

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSListRowTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSListRowUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`

Write prohibited:

- `android/app/build.gradle.kts` unless you have a task-file-backed justification
- `android/app/src/main/java/com/laneshadow/ui/atoms/**`
- `tokens/**`
- `ios/**`

## Acceptance Requirements

Implement all ACs and TCs from the task file. The critical ones are:

1. `LSContentCard` default render uses `LSCard` and theme tokens for card surface, radius, elevation, title, subtitle, and spacing.
2. `LSContentCard` supports header and actions slots with no extra gap when omitted.
3. `LSListRow` with avatar, subtitle, and chevron meets token spacing and touch-target requirements.
4. Interactive `LSListRow` fires its tap callback once; non-interactive rows must not attach clickable/ripple behavior.
5. `LSContentCard.kt` and `LSListRow.kt` contain no literal `Color(0xFF...)` and no bare `Text(...)` usage for UI copy.
6. All 10 story variants are registered in the sandbox molecules stories.

## Validation Targets

- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest' --tests 'com.laneshadow.ui.molecules.LSListRowTest'`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugAndroidTestKotlin`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt | wc -l | grep -x '0'`
- `grep -n '^[^/]*Text(' android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt | wc -l | grep -x '0'`
- `grep -c 'molecules.contentcard\\|molecules.listrow' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 10'`

If connected-device instrumentation execution is unavailable on this host, compile the androidTest sources, document the exact limitation, and still implement the UI test coverage so the host can review it.

## Completion Contract

Return a Markdown completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary for the TDD flow
- whether the connected `androidTest` ran or was only compile-validated
- story registration summary
- any residual risks
