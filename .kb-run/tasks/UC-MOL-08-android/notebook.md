# Notebook: UC-MOL-08-android

Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-android-location-route-molecules.md`
Status: planned
Unit: `UC-MOL-08-android`
Dependencies: `ALIGN-03-android` waived with baseline risk, `UC-MOL-05-android`
Runtime: `cd android && ./gradlew detekt` · `cd android && ./gradlew :app:compileDebugKotlin` · `cd android && ./gradlew test`

## 2026-04-24 Dispatch

- Worktree branch: `kb-run/sprint-04-UC-MOL-08-android`
- Base commit: `079b8e4c9a666a42434a18bb66fcde27c0b29855` from approved `UC-MOL-05-android`
- Reason for non-main base: root `main` is still dirty and `UC-MOL-05-android` is not yet safely merged there, so this dependent Android unit is being advanced from the approved task-branch head instead of the root worktree

## 2026-04-24 Iteration 001

- Original reviewer child failed to emit a compliant verdict artifact, so the remediation loop was recovered host-side from the reviewer transcript and task spec.
- Findings carried into remediation:
  - route card container still used raw `Surface` instead of `LSCard`
  - route/location tests leaned too heavily on source-text inspection and did not enforce composition/runtime contracts strongly enough

## 2026-04-24 Iteration 002

- Implementer recovery commit: `b4e54fc01f2aef0c3148bf1756cf5e6e7f85cadb` (`Fix Android route card composition contracts`)
- Host reviewer verdict: `APPROVED`
- Validation passed:
  - `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.molecules.LSRouteAttachmentCardTest --tests com.laneshadow.ui.molecules.LSLocationContextBarTest`
  - `cd android && ./gradlew :app:compileDebugKotlin`
  - `cd android && ./gradlew :app:compileDebugAndroidTestKotlin`
  - `cd android && ./gradlew detekt`
  - inline-color grep gate across `LSLocationContextBar.kt` and `LSRouteAttachmentCard.kt` returned `0`
  - story-ID grep across the two molecule story files returned `9`
- Outcome:
  - `LSRouteAttachmentCard` now composes through `LSCard` with border/radius/shadow overrides instead of a raw `Surface`
  - scenic dots remain aligned with the Android task spec as named-constant filled/hollow Box circles, and the new `LSRouteAttachmentCardUiTest` assertions compile against runtime semantics rather than source text alone
  - location-context and route-card tests now enforce stronger accessibility/tag/composition contracts without changing story registration
- Residual environment note:
  - connected-device `androidTest` execution remains unavailable on this host, so exact-once UI assertions were compile-validated rather than executed on emulator/device
