# Android Learnings: Android map controls zoom-bottom parity

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. Compose semantics bounds for stacked chips can be better compared by vertical center than by requiring non-overlapping edges; this made the order regression tests stable.
2. The zoom cluster already rendered vertically, but the inner zoom buttons did not expose the declared stable test tags; parity tests needed those tags to verify accessibility and orientation without relying only on content descriptions.
3. A compliant inner tap target still fails if the parent cluster keeps a narrower fixed width or underestimates stacked spacing; the outer zoom cluster dimensions must budget for both 48dp buttons and both divider gaps.

## API Contract Notes
- `LSMapControls` omits chips entirely when handlers are null; tests should assert absence rather than disabled placeholders.
- Chat mode remains a strict toggle-only variant, so zoom semantics must stay absent there even when zoom handlers exist elsewhere.

## UI Decisions
- Kept the Android zoom cluster vertical and moved it below the mode toggle to match the corrected cross-platform bottom-most control ordering without changing the cluster’s visual structure.
- Expanded the Android zoom cluster shell to preserve 48dp touch targets for both zoom controls without changing their existing tags or accessibility labels.

## Gotchas for iOS Implementer
- Cross-platform parity here is conceptual ordering, not identical layout; Android preserves the vertical zoom cluster while iOS can use its own visual implementation as long as zoom is bottom-most.
- Stable test identifiers matter for parity remediation because ordering assertions often need tags in addition to accessibility labels.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` — moved zoom cluster below toggle and added zoom button tags
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` — added parity regression tests for ordering, accessibility, and chat-mode behavior
- `ai-specs/PLAN-S08-REM-AND-T01/android-learnings.md` — captured implementation notes for future native work
