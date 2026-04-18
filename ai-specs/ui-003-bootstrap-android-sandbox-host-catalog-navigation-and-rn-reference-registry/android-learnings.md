# Android Learnings: UI-003 Sandbox Bootstrap

## Implementation Date
2026-04-18

## Edge Cases Discovered
1. `native-sandbox` is declared as `debugImplementation`; referencing its types from `src/main` breaks release/unit release compilation. Main-safe sandbox abstractions were required in `com.laneshadow.ui.sandbox`.
2. Deterministic story ordering matters for reproducible scenario navigation and comparisons; sorting by `Story.id` avoids order drift.

## API Contract Notes
- RN reference summaries should be emitted in the exact format: `RN reference: <path>#<export>`.
- Scenario IDs used for deterministic catalogs follow `<tier>.<component>.<state>` for Android task bootstrap stories.

## UI Decisions
- Sandbox bootstrap story content uses `LocalLaneShadowTheme` token values for spacing, typography, and colors (no hardcoded visual primitives).

## Gotchas for iOS Implementer
- Keep sandbox bootstrap models in non-debug targets free of debug-only package imports.
- Ensure registry metadata includes explicit accessibility/interaction fields early, so parity tests can validate behavior contracts before host wiring.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/ui/sandbox/model/SandboxStory.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/registry/RnReferenceRegistry.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/navigation/SandboxCatalogNavigation.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/host/AndroidSandboxHost.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/stories/AppStories.kt
- android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt
