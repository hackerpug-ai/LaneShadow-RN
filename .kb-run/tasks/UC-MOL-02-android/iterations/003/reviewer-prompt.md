# kb-run Reviewer Prompt

You are `kotlin-reviewer` for kb-run task `UC-MOL-02-android`. This is review cycle 2 after remediation commit `86f24f890661764f15a7532899954ef4fe3e9d56`. This is a separate read-only review pass. Do not edit files, do not commit, do not modify `.kb-run` state.

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
Review base commit: `262d1d858f1683fe5a51f7aaf9f191aa19080f2e`
Review head commit: `86f24f890661764f15a7532899954ef4fe3e9d56`

Requirements:

- AC-1: `LSToolbarTest.default_render_uses_chrome_tokens` passes and now proves exact toolbar-height token bridge, exact surface-primary chrome, ghost icon-button semantics, and centered title behavior.
- AC-2: `LSToolbarTest.title_only_and_two_actions_variants` still passes and preserves title-only plus two-action toolbar composition.
- AC-3: `LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography` still passes and preserves static large-title presentation via `LSText(typography.opinion.lg)`.
- AC-4: `LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes` now proves exact subtitle spacing and exact subtitle token semantics.
- AC-5: `LSToolbarUiTest.window_insets_system_bars_respected` now proves WindowInsets/system-bar handling through a deterministic injected-insets delta, and it passed on the attached emulator during remediation.
- AC-6: Molecule story IDs remain at least 7 across `LSToolbarStory.kt` and `LSNavHeaderStory.kt`, and the molecule source contains no literal `Color(0xFF...)`.

Previous review findings this remediation was intended to fix:

- Toolbar height was reconstructed as `space.xxxxl - space.sm` instead of using a toolbar token/API.
- `default_render_uses_chrome_tokens` overstated what it proved and only checked semantics-key presence.
- `large_title_with_subtitle_renders_both_nodes` did not prove exact subtitle gap or exact subtitle token semantics.
- `window_insets_system_bars_respected` did not actually prove `WindowInsets.systemBars`.

Host validation / implementer evidence already completed on this exact worktree state:

- `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.molecules.LSToolbarTest" --tests "com.laneshadow.ui.molecules.LSNavHeaderTest"` => pass
- `cd android && ./gradlew :app:assembleDebug` => pass
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSToolbarUiTest` => pass on `emulator-5554`
- literal color grep => `0`
- story ID count => `7`

Changed files in this remediation diff:

- `ai-specs/UC-MOL-02-android/android-learnings.md`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt`

Artifacts available:

- Implementer report: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/003/implementer-response.json`
- Prior reviewer verdict: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-android/iterations/002/reviewer-response.json`
- Evidence log: `/tmp/uc-mol-02-android-iter003/evidence.md`
- Evidence manifest: `/tmp/uc-mol-02-android-iter003/evidence-manifest.json`

Out-of-scope noise to ignore:

- `.kb-run-sprint-codex/.state.json.sha256`

Review focus:

- Judge the current worktree state against the full task contract, not just the remediation diff.
- Verify the new toolbar-height bridge is an acceptable direct token-backed source on Android.
- Verify the strengthened tests now prove exact values/layout semantics rather than only key presence.
- Verify the new `windowInsets` parameter is an acceptable test seam and does not weaken production behavior.
