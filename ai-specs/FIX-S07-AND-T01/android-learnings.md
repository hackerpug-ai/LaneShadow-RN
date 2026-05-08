# Android Learnings: LSMapControls Saved Route Signal Token Fix

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. `LocalLaneShadowTheme.current.colors` does not expose a `signal` group in this surface, so the saved-route chip must use the generated token accessor `LaneShadowTheme.color.Signal.default`.
2. The existing LSMapControls test only validated the saved-route accessibility label, so token regressions could slip through without a source-level contract assertion.

## API Contract Notes
- This was a UI token-parity fix only; no API or data contract changed.
- The saved-route branch continues to use `ContentColor.OnSignal` for the icon, which remains correct with the signal copper background.

## UI Decisions
- Kept the change scoped to the saved-route chip background and border only to avoid altering any unrelated map control tokens.
- Followed the repo’s existing Android token-contract test pattern by asserting the source uses the generated signal token and does not use the accent token in that branch.

## Gotchas for iOS Implementer
- Cross-platform parity for this component depends on matching semantic token intent, not just matching rendered color output.
- Generated token APIs may differ from theme convenience surfaces; confirm the platform-specific access path before swapping token names mechanically.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` — switched saved-route background and border to the signal token accessor
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` — replaced the saved-route label-only test with a token contract test plus render assertion
- `ai-specs/FIX-S07-AND-T01/android-learnings.md` — implementation notes and parity guidance
