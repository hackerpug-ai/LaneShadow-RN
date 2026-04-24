Retry `UC-ATM-12-android` again, but do not infer the contract this time. Use the exact values below.

Start from the existing worktree state. You may replace the current `LSMapTest.kt` rewrite and the current `LSMapTypes.kt` helper additions if they conflict with these requirements.

Allowed write targets:
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt`
- `android/app/build.gradle.kts`
- `android/settings.gradle.kts`

Read only if needed:
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Do not reread repo rules. Do not do repo-wide searches. Do not inspect unrelated files.

Exact Android LSMap spec values you must encode:
- style URIs: `LaneShadowTheme.map.style.light` and `.dark`
- polyline colors: `LaneShadowTheme.color.Route.best`, `.alt1`, `.alt2`
- default polyline stroke width: `LaneShadowTheme.sizing.stroke.md` = `2.dp`
- annotation colors:
  - start -> `LaneShadowTheme.color.Status.Success.default`
  - end -> `LaneShadowTheme.color.Status.recording`
  - waypoint -> `LaneShadowTheme.color.Status.Info.default`
- annotation sizes:
  - start outer diameter = `14.dp`
  - start border width = `2.5.dp`
  - end outer diameter = `18.dp`
  - end inner diameter = `6.dp`
  - waypoint diameter = `12.dp`
- camera-fit default padding for `SpacingToken.Spacing4` = `16.dp`
- camera ease duration = `400`
- scroll isolation is enabled by `rememberNestedScrollInteropConnection()` / `nestedScroll(...)` on the host view; do not encode it as disabled
- missing token fallback title should be `Map unavailable`
- network fallback title should be `Network unavailable`

Implementation guidance:
- Replace the shallow / wrong tests with AC-aligned tests for:
  - style token selection and in-place theme reload
  - three route variants using token colors
  - annotation colors and exact spec sizes
  - camera-fit spacing for `SpacingToken.Spacing4`
  - missing-token fallback
  - network-unavailable fallback
  - scroll isolation enabled
- In production code, it is acceptable to add internal helper data classes and resolver functions in `LSMapTypes.kt` so the unit tests can verify the exact values above.
- `LSMap.kt` must keep Mapbox SDK types out of the public signature, include `rememberNestedScrollInteropConnection` / `nestedScroll`, and route fallback rendering through `LSGlassPanel`.
- Use generated tokens only for style URLs and route/status colors. Do not add raw `Color(0x` literals in `LSMap.kt`.
- The worktree `android/app/build.gradle.kts` and `android/settings.gradle.kts` have already been synced with the validated Mapbox token wiring; keep them intact unless compile errors require a minimal correction.

Validation:
- source `scripts/agent-worktree-env.sh`
- use the isolated Gradle home
- run `cd android && ./gradlew :app:compileDebugKotlin`
- run `cd android && ./gradlew :app:test --tests '*.LSMapTest'`

Evidence required before finish:
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/004/evidence.md`
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/004/evidence-manifest.json`

Final response must satisfy `.kb-run/implementer-completion.schema.json` with `task_id = UC-ATM-12-android`.

If you hit an infrastructure failure after code is in place, return a blocked completion JSON with the exact failed command and explain whether the code changes themselves were complete.
