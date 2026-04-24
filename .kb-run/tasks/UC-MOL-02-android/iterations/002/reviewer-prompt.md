# kb-run Reviewer Prompt

You are `kotlin-reviewer` for kb-run task `UC-MOL-02-android`. This is review cycle 1 after the iteration 002 implementation commit. This is a separate read-only review pass. Do not edit files, do not commit, do not modify `.kb-run` state.

Return ONLY valid JSON matching this schema:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-MOL-02-android",
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
      "task_id": "UC-MOL-02-android",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid only when every requirement is satisfied and there are no `CRITICAL` or `HIGH` findings.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-android-toolbar-navheader-molecules.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-02-android`
Review base commit: `800c6ebfd41edb0869e590849f8eefb8721fbe4e`
Review head commit: `262d1d858f1683fe5a51f7aaf9f191aa19080f2e`

Requirements:

- AC-1: `LSToolbarTest.default_render_uses_chrome_tokens` passes and verifies toolbar-height token, surface-primary chrome, centered title via `LSText`, ghost icon buttons, and top system-bar handling.
- AC-2: `LSToolbarTest.title_only_and_two_actions_variants` passes and verifies title-only plus two-action toolbar composition.
- AC-3: `LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography` passes and verifies static large-title presentation via `LSText(typography.opinion.lg)`.
- AC-4: `LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes` passes and verifies subtitle rendering, typography, and spacing contract.
- AC-5: `LSToolbarUiTest.window_insets_system_bars_respected` exists and correctly proves WindowInsets/system-bar handling. If execution is blocked only because no device/emulator is attached, distinguish that from a code defect.
- AC-6: Molecule story IDs total at least 7 across `LSToolbarStory.kt` and `LSNavHeaderStory.kt`, and the molecule source contains no literal `Color(0xFF...)`.

Host validation / implementer evidence already completed on this exact worktree state:

- `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest" --tests "com.laneshadow.ui.molecules.LSNavHeaderTest"` => pass
- `cd android && ./gradlew :app:assembleDebug` => pass
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSToolbarUiTest` => failed only with `No connected devices!`

Changed files in the reviewed diff:

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`
- `ai-specs/UC-MOL-02-android/android-learnings.md`

Diff summary:

- `git diff --stat 800c6ebf..262d1d85` reports 825 insertions and 1 deletion across the nine files above.

Artifacts available:

- Implementer report: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/002/implementer-response.json`
- Evidence log: `/tmp/ucmol02iter002/evidence.md`
- Evidence manifest: `/tmp/ucmol02iter002/evidence-manifest.json`

Out-of-scope noise to ignore:

- `.kb-run-sprint-codex/.state.json.sha256`

Review focus:

- Judge the current worktree state against the full task contract, not just the diff.
- Verify that toolbar height and chrome come from theme tokens rather than hardcoded dp or Material top-app-bar primitives.
- Verify the slot APIs stay atom-composed (`LSText`, `LSButton`, `LSIcon`) and use stable slot models where required.
- For AC-5, fail only if the UI test or implementation is actually insufficient; do not fail solely because the host had no connected device.
- Pay attention to story coverage, WindowInsets handling, and whether tests assert behavior rather than only source text.
