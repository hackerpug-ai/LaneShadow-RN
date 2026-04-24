# kb-run Implementer Remediation Prompt

Execution unit: `UC-MOL-02-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-02-android`
Role: `kotlin-implementer`
Start commit: `800c6ebfd41edb0869e590849f8eefb8721fbe4e`
Review cycle: `002`

## Recovery Reason

Iteration 001 already implemented the task work in the existing worktree, but the session exited before commit/final JSON because it treated the hook-managed file `.kb-run-sprint-codex/.state.json.sha256` as an out-of-scope change. The orchestrator has now restored that file. Do not redo the feature from scratch.

## What To Do

1. Inspect the existing worktree changes for `UC-MOL-02-android`.
2. Keep only task-scope changes plus the required learnings file.
3. Re-run the minimal validations needed to confirm the current diff state.
4. If connected Android instrumentation is still blocked by the no-device baseline, record that precisely as a pre-existing limitation rather than asking the user what to do.
5. Create a normal git commit for the task changes.
6. Leave the worktree clean.
7. Write the final JSON completion report to the configured output file.

## Hard Rules

- Do not touch `.kb-run*` state files, notebooks, or checksums.
- Do not ask the user to choose what to do about hook-managed files; the orchestrator owns that.
- Do not revert the feature changes unless a validation failure proves they are invalid.
- Respect the original task scope from `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-android-toolbar-navheader-molecules.md`.

## Existing Task Work To Preserve

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`
- `ai-specs/UC-MOL-02-android/android-learnings.md`

## Validation Expectations

Re-run the strongest relevant commands you can from the current worktree. Include exact outcomes. If the original task's `connectedDebugAndroidTest --tests ...` form is invalid, use the valid equivalent you already discovered. If no emulator/device is attached, classify that as `pre_existing` and explain it clearly.

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
