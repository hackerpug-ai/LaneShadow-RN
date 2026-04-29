# Android Learnings: AUTH-S03-T08 MainActivity Compose shell

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. OAuth deep-link callbacks can be published before `LaneShadowApp` starts collecting; `MutableSharedFlow(replay=0)` drops these cold-start events.
2. Replayed deep-link callbacks can be re-delivered to new collectors unless consumed explicitly after handoff.

## API Contract Notes
- Deep-link callback contract remains `laneshadow://oauth-callback` from `MainActivity` to `AuthViewModel`.
- `DeepLinkBus` now supports explicit post-handoff consumption via `consumeLatest()`.

## UI Decisions
- No visual/UI behavior changed; fix was limited to callback event transport reliability and one-time consumption semantics.

## Gotchas for iOS Implementer
- Cold-start callback timing race exists cross-platform: producer may emit before consumer is attached.
- Replay/buffering must be paired with explicit consume/ack logic to avoid duplicate callback handling.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt — replayed callback buffering + consume API
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt — consume callback after handoff to `AuthViewModel`
- android/app/src/test/java/com/laneshadow/navigation/DeepLinkBusTest.kt — late-subscriber and consume behavior tests
