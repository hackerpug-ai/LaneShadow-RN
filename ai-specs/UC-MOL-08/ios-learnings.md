# iOS Learnings: UC-MOL-08 Location Route Molecules

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. Compact `LSRouteAttachmentCard` padding can drift from required values when `LSCard` internal padding is combined with molecule-level padding; compact mode now uses a single rendered padding layer so effective outer padding is exactly `10pt vertical / 12pt horizontal`.
2. Scenic meter icon tokens (`circle`/`circleFill`) were present in generated Swift output but missing from token source-of-truth. Regenerating without fixing source would have removed icons and broken scenic meter rendering.

## API Contract Notes
- `LSRouteAttachmentCardRoute` still carries `elevation` for compatibility with existing route fixture payloads, but UC-MOL-08 molecule metrics composition now intentionally renders only `distance + duration + scenic meter + SCENIC label`.
- Scenic meter remains atom-path based via `LSIcon` using `IconName.circle`/`IconName.circleFill`.

## UI Decisions
- Compact card container bypasses `LSCard` internal inset and applies tokenized surface/radius/elevation directly, then uses only molecule content padding to satisfy exact compact spacing contract.
- Metrics row removed elevation display and appended explicit `SCENIC` label using label typography/content-secondary semantics.

## Platform-Specific Notes
- Swift test coverage is more reliable when asserting exposed behavior (`effectiveContentPadding`, metric/scenic semantics) rather than source-string inspection for composition.
- Token changes must be made in `tokens/semantic/icons.json` and SVG inputs, then regenerated for all platforms; direct edits in `Generated/Tokens.swift` are not durable.

## Files Created/Modified
- `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` — compact padding fix, metrics composition fix, behavior helpers for tests.
- `ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift` — behavior-first tests for compact effective padding and UC-MOL-08 metrics composition.
- `tokens/semantic/icons.json` — added `circle` and `circleFill` to source-of-truth icon manifest.
- `tokens/icons/circle.svg` — added scenic hollow circle icon source.
- `tokens/icons/circleFill.svg` — added scenic filled circle icon source.
- `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` — regenerated from pipeline.
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt` — regenerated from pipeline.
- `tokens/platforms/web/tokens.ts` — regenerated from pipeline.
- `tokens/platforms/web/mapbox.ts` — regenerated from pipeline.
- `tokens/semantic/semantic.tokens.json` — regenerated from pipeline.
- `tokens/platforms/swift/Sources/LaneShadowTheme/Resources/semantic.tokens.json` — regenerated from pipeline.
- `tokens/platforms/kotlin/src/main/assets/semantic.tokens.json` — regenerated from pipeline.
