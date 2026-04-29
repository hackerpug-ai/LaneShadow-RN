# Android Learnings: AUTH-S03-T12 compile remediation

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. `./gradlew test` compiles both debug and release variants; debug-only mock domain models caused release compile failure even though `assembleDebug` passed.
2. Reflection-based fallback in `SessionsScreen` masked source-set contract drift and reduced type safety; once release domain parity was restored, direct typed access was safer and cleaner.

## API Contract Notes
- `com.laneshadow.sandbox.mockproviders` domain/state types are a shared contract consumed by `main` templates, so they must exist in both `debug` and `release` source sets.
- Fixture provider objects remain debug-only; only domain/state definitions were required in release.

## UI Decisions
- Replaced reflective section/dialog resolution in `SessionsScreen` with typed `state.sections` and `state.showConfirmDialog` usage to align with the canonical `SessionsScreenState` model.

## Gotchas for iOS Implementer
- Variant/source-set parity issues can surface only in full test/CI tasks; debug-only builds may hide missing contract types.
- Avoid reflection workarounds for compile gaps when a shared model contract can be fixed at the source-set boundary.

## Files Created/Modified
- android/app/src/release/java/com/laneshadow/sandbox/mockproviders/NavigatorDomain.kt — release-safe mirror of shared mock domain/state types
- android/app/src/main/java/com/laneshadow/ui/templates/SessionsScreen.kt — removed reflection and restored typed state mapping
