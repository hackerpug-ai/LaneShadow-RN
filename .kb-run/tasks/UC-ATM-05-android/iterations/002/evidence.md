# UC-ATM-05-android Evidence

## RED phase

- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4'`
  - First run hit a pre-existing `:app:mergeDebugResources` artifact deletion race in `android/app/build/intermediates/merged_res/debug/mergeDebugResources`.
  - After clearing that generated directory and rerunning, the build failed in `:app:compileDebugUnitTestKotlin` with unresolved references for `resolveLSCardStyle`, `resolveLSPanelStyle`, `resolveLSGlassPanelStyle`, `GlassVariant`, `AccentColor`, and `resolveAccentColor`. This is the intended RED evidence showing the surface APIs did not exist yet.

## GREEN / verification

- Implemented `LSCard`, `LSPanel`, `LSGlassPanel`, `GlassVariant`, `AccentColor`, and sandbox stories.
- Registered `LSSurfaceStories.all` in the existing `AtomsStories` aggregator. The task packet named `AtomStories.kt`; the repo uses `AtomsStories.kt`.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4' --tests 'com.laneshadow.ui.atoms.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3' --tests 'com.laneshadow.ui.atoms.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color' --tests 'com.laneshadow.ui.atoms.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens'`
  - Passed.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugKotlin`
  - Passed.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:assembleRelease`
  - Passed, producing `android/app/build/outputs/apk/release/app-release-unsigned.apk`.
- `source scripts/agent-worktree-env.sh && cd android && APK=$(find app/build/outputs/apk/release -name '*.apk' | head -1) && test -n "$APK" && [ "$(unzip -l "$APK" | grep -c com.nativesandbox || true)" = "0" ]`
  - Passed.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:lint`
  - Passed.
- Story and boundary grep gate passed:
  - `atoms.card.default`
  - `atoms.panel.default`
  - `atoms.glasspanel.chrome`
  - `atoms.glasspanel.callout.signal`
  - `atoms.glasspanel.callout.warning`
  - No forbidden literal color / Material Icons / default font references in `LSCard.kt`, `LSPanel.kt`, or `LSGlassPanel.kt`.

## External blockers / mismatches

- Canonical PRD/design references (`.spec/prds/v2/05-uc-atm.md` and `.spec/prds/v2/concepts/uc-atm-05-surfaces.html`) define callout accents as `.signal` and `.warning`. The task packet normalizes this to `AccentColor.Velocity` and `color.accent.{name}`. The live token module in `tokens/platforms/kotlin` exposes `color.Signal.default` and `color.Status.Warning.default`, not `color.accent.velocity` style accessors. This prevents full compliance with AC-4/AC-5 as written in the packet.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest`
  - Android test APK compilation succeeded, but `:app:connectedDebugAndroidTest` failed with `No connected devices!`.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew detekt`
  - Failed because no `detekt` task exists in this Gradle project.
- `source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest`
  - Fails for large pre-existing suites unrelated to this task, including `ChecksumValidatorTest` plus many Robolectric-based atom/molecule tests already failing with `RuntimeException at RoboMonitoringInstrumentation.java:105`.
