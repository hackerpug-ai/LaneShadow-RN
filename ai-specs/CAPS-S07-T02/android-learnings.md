# Android Learnings: LSContextCapsule

## Implementation Date
2026-05-07

## Edge Cases Discovered
1. The task contract is internally inconsistent on story count: it says "10 stories" but also enumerates 8 canonical variants across light/dark. The implementation follows the explicit canonical ID list, which yields 16 stories.
2. The planning-state reduced-motion requirement was easiest to keep testable by allowing a local override flag on the composable while leaving the default path stateless.

## API Contract Notes
- `CapsuleState` is a pure UI contract for this task. There is no ViewModel or backend wiring in scope.
- `Idle` carries both a `headline` and the `highlightedWord` so the italic span can stay data-driven instead of inferring substring rules from presentation text.

## UI Decisions
- The capsule uses the same blur-strategy helper as `LSGlassPanel`, but keeps its own padding, corner radius, and 14dp blur recipe so the molecule matches the design contract instead of inheriting chat-input spacing.
- Route metrics use `theme.typography.instrument.sm` directly so the mono override is explicit and easy for the iOS implementation to mirror.

## Gotchas for iOS Implementer
- The saved route modifier is modeled as an overlay border only; the base chrome remains unchanged.
- Warning state only tints the meta row. The italic headline accent stays tied to the state family rather than the warning modifier.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — new molecule implementation.
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsuleTypes.kt` — sealed UI state contract.
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContextCapsuleStory.kt` — sandbox stories for all canonical variants.
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` — story registry wiring.
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSContextCapsuleTest.kt` — Compose behavior tests for capsule semantics and theme re-resolution.
- `android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt` — canonical story registry coverage.
