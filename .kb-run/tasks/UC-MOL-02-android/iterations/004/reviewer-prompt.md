# kb-run Reviewer Prompt

You are `kotlin-reviewer` for kb-run task `UC-MOL-02-android`. This is review cycle 3 after remediation commit `a184130b921da542dd1bac2308635715c0d5bdf1`. This is a separate read-only review pass. Do not edit files, do not commit, do not modify `.kb-run` state.

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
Review base commit: `86f24f890661764f15a7532899954ef4fe3e9d56`
Review head commit: `a184130b921da542dd1bac2308635715c0d5bdf1`

Requirements:

- AC-1: `toolbarComponentSizing.toolbarHeight` now resolves from the actual 56dp component toolbar token source on Android, not from any spacing rung, and `LSToolbarTest.default_render_uses_chrome_tokens` independently proves the exact 56dp requirement rather than self-validating through the same helper used by production.
- AC-2: `LSToolbarTest.title_only_and_two_actions_variants` still passes and preserves title-only plus two-action toolbar composition.
- AC-3: `LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography` still passes and preserves static large-title presentation via `LSText(typography.opinion.lg)`.
- AC-4: `LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes` still passes with exact subtitle spacing and exact subtitle token semantics intact.
- AC-5: `LSToolbarUiTest.window_insets_system_bars_respected` still proves WindowInsets/system-bar handling through deterministic injected-insets delta and passed on the attached emulator during remediation.
- AC-6: Molecule story IDs remain at least 7 across `LSToolbarStory.kt` and `LSNavHeaderStory.kt`, and the molecule source contains no literal `Color(0xFF...)`.

Previous review findings this remediation was intended to fix:

- Toolbar height still resolved to `space.xxxxl` (`64dp`) instead of the required `component.toolbarHeight = 56`.
- `default_render_uses_chrome_tokens` still derived its expected height from the same production helper and therefore self-validated the wrong bridge.

Host validation / implementer evidence already completed on this exact worktree state:

- RED proof: `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest.default_render_uses_chrome_tokens"` => failed before the production fix with `AssertionError at LSToolbarTest.kt:58`
- `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest" --tests "com.laneshadow.ui.molecules.LSNavHeaderTest"` => pass
- `cd android && ./gradlew :app:assembleDebug` => pass
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSToolbarUiTest` => pass on `Pixel_7_API_34(AVD)-14`

Changed files in this remediation diff:

- `ai-specs/UC-MOL-02-android/android-learnings.md`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`

Artifacts available:

- Implementer report: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/004/implementer-response.json`
- Prior reviewer verdict: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/003/reviewer-response.json`

Out-of-scope noise to ignore:

- `.kb-run-sprint-codex/.state.json.sha256`

Review focus:

- Judge the current worktree state against the full task contract, not just the remediation diff.
- Verify the new `ToolbarHeightComponentToken = 56.dp` bridge is an acceptable direct component-token-backed source for this codebase.
- Verify `default_render_uses_chrome_tokens` can now fail if production regresses back to a 64dp spacing ladder.
