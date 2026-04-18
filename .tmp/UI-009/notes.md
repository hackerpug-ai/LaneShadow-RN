UI-009 evidence notes

- Added the Android feedback and container atoms under `android/app/src/main/java/com/laneshadow/ui/atoms/`:
  `ThemeBadge`, `ThemeCard` (+ header/title/content/description), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, and `ThemeFAB`, with task-friendly wrapper names where the sprint task uses the unprefixed component name.
- Extended `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt` with deterministic RN-referenced stories for default, selected, outline, indeterminate, open, and extended-label states so each new atom is browseable in the native sandbox drawer.
- Expanded `AtomsContractTest` to cover the new badge/card/avatar/skeleton enums and added `user` icon fallback support in `IconSymbol` so avatar fallback states stay deterministic.
- Verification passed: `pnpm type-check:native`, `cd android && ./gradlew :app:testDebugUnitTest`, `cd android && ./gradlew test`, `cd android && ./gradlew :app:assembleDebug`, and `make android_sandbox`.
- `cd android && ./gradlew detekt` is not available in this Android project; Gradle reports `Task 'detekt' not found`.
