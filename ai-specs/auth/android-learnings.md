# Android Learnings: Auth Primitives Parity

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. Story-parity tests can miss valid registrations when stories are split across files; include registry file checks, not only ID text scans in one story file.
2. Auth field state requirements (helper vs error text, disabled vs focused) are easier to keep correct when `LSFormField` computes effective `InputState` centrally.

## API Contract Notes
- No backend/API contract changes were required for this task.
- This task only updated UI primitives, stories, and snapshot baselines.

## UI Decisions
- `LSAuthProviderButton` now sets semantic `contentDescription` from provider copy for accessibility consistency.
- Provider visual split uses existing lane tokens via button variants: Apple `Primary`, Google `Secondary`.
- `LSFormField` gained auth-state support with optional helper text, icon slots, disabled state, and explicit visual state pass-through.

## Gotchas for iOS Implementer
- Canonical story IDs are the parity key; if an ID changes, snapshots/parity tooling treats it as a new component.
- Snapshot baseline updates may require seed placeholders before emulator capture in isolated worktrees.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt
- android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt
- android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSAuthProviderButtonStory.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt
- android/app/src/test/java/com/laneshadow/ui/atoms/AuthIconCoverageTest.kt
- android/app/src/test/java/com/laneshadow/ui/components/LSAuthProviderButtonTest.kt
- android/app/src/test/java/com/laneshadow/ui/molecules/LSFormFieldTest.kt
- android/app/src/test/java/com/laneshadow/sandbox/AuthStoryParityTest.kt
- android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/*.png (auth primitives)
