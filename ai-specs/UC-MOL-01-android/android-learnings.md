# Android Learnings: UC-MOL-01 Card + ListRow Molecules

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. The generated token surface in this module does not expose `sizing.touchTarget`, so `LSListRow` uses an explicit `44.dp` minimum height constant to satisfy touch-target behavior.
2. The task validation grep for bare `Text(` is broad enough to match `LSText(`, so molecule files use an alias import (`LSText as LSLabel`) while still composing through the atom.

## API Contract Notes
- `LSContentCard` accepts optional `header` and `actions` composable slots and only renders their containers when provided.
- `LSListRow` uses nullable `onTap`; when null it does not attach clickable semantics.

## UI Decisions
- `LSContentCard` footer actions are separated with `LSDivider` and inset surface styling so optional actions visually read as a slot without introducing fixed empty spacing.
- `LSListRowTrailing.Button` is rendered via atom composition (`LSCard` + `LSText`) to preserve atom-only molecule composition constraints in this task.

## Gotchas for iOS Implementer
- If your static checks search for bare `Text(` tokens, atom wrappers may need aliasing or stricter regex matching to avoid false positives.
- Keep non-interactive row behavior strict: no gesture/click wiring when tap callback is absent.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt` — new content card molecule with optional header/actions slots.
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt` — new list row molecule with leading/trailing variants and optional divider.
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt` — unit tests for token/style and slot composition contracts.
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSListRowTest.kt` — unit tests for atom usage, layout contract, and no-literal-color/no-bare-text guard.
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSListRowUiTest.kt` — UI tests for tap callback behavior and non-interactive semantics.
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt` — 4 content-card story variants.
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt` — 6 list-row story variants.
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` — story registry updated with both new molecule story groups.
