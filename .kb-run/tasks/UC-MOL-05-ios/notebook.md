# Notebook: UC-MOL-05-ios

Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-ios-pill-semantics-family.md`
Status: planned
Unit: `UC-MOL-05-ios`
Dependencies: `ALIGN-03-ios`
Runtime: `swiftformat --lint ios/LaneShadow/` · `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` · `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

## 2026-04-24 Iteration 001

- Implementer checkpoint commit: `3237dab41889e8992485e6f4109a01d23f7365e4` (`checkpoint: UC-MOL-05-ios`)
- Host validation passed:
  - `swiftformat --lint ios/LaneShadow/`
  - `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
  - `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests -only-testing:LaneShadowTests/LSFilterChipTests -only-testing:LaneShadowTests/LSSuggestionChipTests -only-testing:LaneShadowTests/LSWeatherBadgeTests`
- Reviewer child shell stalled without emitting a verdict file, so host deterministic review recorded iteration `001` at `.kb-run/tasks/UC-MOL-05-ios/iterations/001/reviewer-response.json`.
- Reviewer verdict: `NEEDS_FIXES`

### Findings

- High: `LSTagPill`, `LSFilterChip`, and `LSSuggestionChip` attach background/border styling to inner content instead of the `LSPill` container, so the rendered pill surface is wrong even though token helpers and grep gates pass.
- High: `LSWeatherBadge` applies weather tint/border to the inner `HStack` instead of the `LSPill` surface, so the badge does not satisfy the required weather pill rendering contract.
- Medium: the current tests are too source- and token-helper-driven to catch that misplaced surface styling; they need stronger composition coverage.

### Runner Note

- Shared `.kb-run/state.json` was repurposed by a separate Sprint 03 remediation run while this Sprint 04 unit was in review. Sprint 04 progress is therefore being advanced from task notebooks and iteration artifacts until state ownership is reconciled.

## 2026-04-24 Iteration 002

- Implementer commit: `69917ef488ed3ef95e8ec9318251d95193528634` (`Fix iOS pill surface styling regressions`)
- Host reviewer verdict: `APPROVED`
- Validation passed:
  - `swiftformat --lint ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift ios/LaneShadowTests/Molecules/LSTagPillTests.swift ios/LaneShadowTests/Molecules/LSFilterChipTests.swift ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift`
  - `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
  - `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests -only-testing:LaneShadowTests/LSFilterChipTests -only-testing:LaneShadowTests/LSSuggestionChipTests -only-testing:LaneShadowTests/LSWeatherBadgeTests`
  - grep gate for `Capsule()/Color(red:)/Color(hex:)/Font.system`
- Outcome:
  - the pill surface modifiers now live on the outer `LSPill` view in all four molecules
  - regression tests now assert that the `LSPill` closure stays content-only while the surface modifiers remain on the trailing container chain
