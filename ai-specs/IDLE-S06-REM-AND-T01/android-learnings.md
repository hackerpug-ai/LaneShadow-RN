# Android Learnings: Android live idle plumbing repair

## Implementation Date
2026-05-05

## Edge Cases Discovered
1. Reverse-geocode success can accidentally wipe unrelated subscription errors if location recovery blindly clears all errors; only location-specific errors should be cleared.
2. Suggestion chips must prime the idle input without triggering planning immediately, otherwise the live idle screen skips the rider-visible “review/edit before send” state.

## API Contract Notes
- `IdleUiState` needs an explicit `locationUnavailable` flag in addition to `isLocationEnabled`; template projection cannot infer recovery state reliably from `locationLabel` alone.
- The Android E2E idle test was referencing tags that did not match production (`planning-phase-indicator`, `sessions-drawer-root`); aligning tests to existing stable production tags avoided unnecessary UI churn.

## UI Decisions
- `IdleScreen` now treats `inputValue` as route-owned state instead of maintaining a local `remember` shadow, preserving unidirectional data flow from `IdleViewModel`.
- Favorite map pins now render from a generated copper-dot bitmap using the existing favorite pin specs, which removes the fallback default marker path while keeping token-defined colors.

## Gotchas for iOS Implementer
- If the idle template still accepts sandbox/provider state, the projection layer must remain lossless for favorites, advisory, no-location, and chat state or the live screen will silently drift from the ViewModel.
- Suggestion chip behavior is a subtle contract: tap should update input affordances, not navigate. Preserve that distinction when mirroring the flow on iOS.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` — added recovery state for location availability.
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — rewired suggestion/manual-mode/location recovery behavior.
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` — made template projection lossless for sprint-critical live fields.
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — removed local input shadow state and added live greeting tag/mode callback wiring.
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` — connected manual/auto mode changes.
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt` — added stable production tag.
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — replaced default favorite marker path with copper-dot bitmap annotations.
- `android/app/src/androidTest/java/com/laneshadow/e2e/mapview/IdleStateE2ETest.kt` — aligned E2E tags to production.
- `android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt` — added/updated idle plumbing tests.
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` — added favorite pin regression test.
- `android/app/src/testDebug/java/com/laneshadow/ui/templates/IdleScreenTest.kt` — added route/template advisory and tag coverage.
