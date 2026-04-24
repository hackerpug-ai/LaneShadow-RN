# Reviewer Packet: UC-MOL-08-android

Execution unit: `UC-MOL-08-android`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-android-location-route-molecules.md`
Base commit: `079b8e4c9a666a42434a18bb66fcde27c0b29855`
Candidate commit: `02b5a01cb67d8d04dbd4e4881fb33721da7ec795`
Checkpoint branch: `kb-run/sprint-04-UC-MOL-08-android`

## Scope

- `android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSLocationContextBarTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSLocationContextBarUiTest.kt`
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardUiTest.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSLocationContextBarStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSRouteAttachmentCardStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculeStoryFrame.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt`

## Task Requirements

- AC-1: `LSLocationContextBar` renders two `LSTagPill` molecules in a space-between row.
- AC-2: Tapping the mode pill fires `onModeChange` exactly once.
- AC-3: `LSRouteAttachmentCard` best-selected variant renders stripe, badges, title/subtitle, and scenic meter.
- AC-4: Compact mode suppresses best/weather badges and tightens padding.
- AC-5: Route variant stripe colors resolve via theme route tokens.
- AC-6: Card `onTap` fires exactly once.
- AC-7: Stories are registered for both molecules.
- AC-8: No literal `Color(0xFF...)` in molecule source.

## Validation Evidence

- `cd android && ./gradlew detekt` -> pass
- `cd android && ./gradlew :app:compileDebugKotlin` -> pass
- `cd android && ./gradlew test` -> pass
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarTest.renders_two_tag_pills_with_space_between'` -> pass
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots'` -> pass
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge'` -> pass
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color'` -> pass
- Story grep gate -> pass (`9`)
- Direct `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt` -> no matches

## Environment Limits

- `connectedDebugAndroidTest --tests ...` is not supported by this Gradle task.
- Full `connectedDebugAndroidTest` is blocked on this host because no connected emulator/device is available.
- UI test source files were added and compiled but were not executed on device.

## Review Instructions

1. Review the exact diff with `git diff 079b8e4c9a666a42434a18bb66fcde27c0b29855..02b5a01cb67d8d04dbd4e4881fb33721da7ec795`.
2. Read every changed file in full, with extra scrutiny on `LSRouteAttachmentCard.kt`, `LSLocationContextBar.kt`, and `MoleculeStoryFrame.kt`.
3. Treat the instrumentation-test environment limit as a residual risk, not an automatic approval; decide whether code/test coverage is still sufficient for approval.
4. Return only JSON matching the required reviewer verdict schema.
