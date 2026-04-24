# Notebook: UC-MOL-05-android

Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-android-pill-semantics-family.md`
Status: planned
Unit: `UC-MOL-05-android`
Dependencies: `ALIGN-03-android` waived with baseline risk
Runtime: `cd android && ./gradlew detekt` · `cd android && ./gradlew :app:compileDebugKotlin` · `cd android && ./gradlew test`

## 2026-04-24 Iteration 001

- Implementer commit: `8262cb5b64c314930d42b81fb6df6896b801f554` (`feat(uc-mol-05-android): add pill semantics molecules and stories`)
- Host checkpoint commit: `ae98746fcc6cef1235b04723af7520a09987b7ed` (`checkpoint: UC-MOL-05-android`)
- Host validation passed:
  - `cd android && ./gradlew detekt`
  - `cd android && ./gradlew :app:compileDebugKotlin`
  - `cd android && ./gradlew test`
- Reviewer child shell stalled without emitting a verdict file, so host deterministic review recorded iteration `001` at `.kb-run/tasks/UC-MOL-05-android/iterations/001/reviewer-response.json`.
- Reviewer verdict: `NEEDS_FIXES`

### Findings

- High: `LSWeatherBadge` routes the badge label through `ContentColor.Primary` instead of the condition-specific weather foreground token, so AC-4's required weather foreground rendering is incorrect.
- Medium: the current `LSWeatherBadge` tests stop at the style resolver and do not exercise the composable wiring strongly enough to catch the wrong label color path.
- Residual environment risk remains: connected-device UI tests are still unavailable on this host, so AC-3 and AC-8 keep their prior device-availability note rather than acting as code-blocking defects in this remediation round.

### Runner Note

- Shared `.kb-run/state.json` was repurposed by a separate Sprint 03 remediation run while this Sprint 04 unit was in review. Sprint 04 progress is therefore being advanced from task notebooks and iteration artifacts until state ownership is reconciled.

## 2026-04-24 Iteration 002

- Implementer commit: `079b8e4c9a666a42434a18bb66fcde27c0b29855` (`Fix weather badge text token wiring`)
- Host reviewer verdict: `APPROVED`
- Validation passed:
  - `cd android && ./gradlew detekt`
  - `cd android && ./gradlew :app:compileDebugKotlin`
  - `cd android && ./gradlew test`
  - `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon'`
  - `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints'`
  - equivalent zero-inline-color count check for the four pill-family molecule files
- Outcome:
  - `LSWeatherBadge` now keeps its label on the `LSText` atom path while resolving weather-specific foreground tokens through `style.iconColor.asTextColor()`
  - `LSText` gained the minimal typed weather-color support required to preserve atom composition
  - regression coverage now fails if the weather badge falls back to `ContentColor.Primary`
- Residual environment note:
  - connected-device instrumentation tests remain unavailable on this host, so the exact-once UI assertions still carry an environment limitation rather than a code defect
