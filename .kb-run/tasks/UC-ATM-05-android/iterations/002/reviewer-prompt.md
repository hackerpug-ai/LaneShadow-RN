# kb-run Reviewer Prompt

Execution unit: `UC-ATM-05-android`
Sprint: `sprint-02-atoms-foundation-primitives`
Role: `kotlin-reviewer`
Worktree: `.kb-run/worktrees/UC-ATM-05-android`
Latest implementer commit: `b57bdebf`

## Review Standard

The user explicitly relaxed testing standards for this sprint.

Interpretation for this review:

- Prioritize correctness, scope, and merge safety.
- Do not reject solely for non-exhaustive tests if the implementation is sound and targeted build/smoke evidence is present.
- Do not require additional polish-only coverage beyond the core task outcome.

## Task

Review `UC-ATM-05-android` against:

- `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-05-android-surface-trio-lscard-lspanel-lsglasspanel-android-compose.md`

Important context:

- The task file was corrected by the orchestrator to match the canonical PRD/design:
  - callout accents are `.signal` and `.warning`
  - the story aggregator file is `AtomsStories.kt`
  - the available lint gate is `:app:lint`
  - the concept file is `uc-atm-05-surfaces.html`
- Supplemental user feedback also applies here: GlassPanel callout stripes must render inside the container bounds.

## Scope Under Review

Branch diff vs `main...HEAD` currently contains:

- `android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSGlassPanelInstrumentationTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/AccentColor.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/GlassVariant.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSCardTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSGlassPanelTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSPanelTest.kt`

Latest implementer commit itself changed the same files.

## What Changed

- Added `LSCard`, `LSPanel`, and `LSGlassPanel` with token-driven style resolvers and semantics keys for verification.
- Added `GlassVariant` and `AccentColor` using the canonical callout accents `Signal` and `Warning`.
- Implemented `LSGlassPanel` with an internal clipped container so the 3dp callout stripe sits inside the shape bounds.
- Added surface stories and registered them in `AtomsStories`.
- Added unit coverage for card/panel/glass token mapping and instrumentation coverage for glass blur behavior plus API < 31 fallback.
- Follow-up remediation commit `b57bdebf` switched surface and accent color resolution from generated light-only constants to runtime `LaneShadowThemeValues`, plus added dark-theme unit coverage for card, panel, and glass fill resolution.

## Validation Evidence

- `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4' --tests 'com.laneshadow.ui.atoms.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3' --tests 'com.laneshadow.ui.atoms.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color' --tests 'com.laneshadow.ui.atoms.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens'` -> PASS
- `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSCardTest' --tests 'com.laneshadow.ui.atoms.LSPanelTest' --tests 'com.laneshadow.ui.atoms.LSGlassPanelTest'` -> PASS after the runtime-theme-color remediation
- `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:compileDebugKotlin` -> PASS
- `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:lint` -> PASS
- `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:assembleRelease` -> PASS
- Release APK sandbox-symbol check against `app/build/outputs/apk/release/*.apk` -> PASS
- Booted `Pixel_7_API_34` on `emulator-5554` and ran `cd .kb-run/worktrees/UC-ATM-05-android/android && source ../scripts/agent-worktree-env.sh && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest` -> PASS (`Finished 2 tests ... BUILD SUCCESSFUL`)
- Commit hooks passed and produced `c083abaf` then follow-up fix commit `b57bdebf`

## Review Focus

1. Does the branch satisfy AC-1 through AC-9 under the corrected canonical surface contract?
2. Is the glass stripe implementation clearly inside the clipped container bounds?
3. Are the semantics-backed tests and instrumentation coverage coherent and merge-safe?
4. Are there any remaining regressions, scope leaks, or hidden compatibility issues?

## Required JSON

Return JSON only:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-ATM-05-android",
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
      "task_id": "UC-ATM-05-android",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid when there are no `CRITICAL` or `HIGH` findings.
