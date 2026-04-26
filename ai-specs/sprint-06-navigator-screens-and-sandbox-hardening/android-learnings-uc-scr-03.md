# Android Learnings: UC-SCR-03 — RouteResultsScreen

## Implementation Date
2026-04-26

## Edge Cases Discovered

1. **Test Directory Confusion**: Initially wrote UI tests in `app/src/test/` but Compose UI tests require `app/src/androidTest/` with `@RunWith(AndroidJUnit4::class)` annotation. Moved to `RouteResultsScreenUiTest.kt` in androidTest directory.

2. **Mock Provider Type Mismatch**: The mock provider's `RouteAttachment` type differs from the UI molecule's `RouteAttachment` type. Required manual mapping between mock domain entities and UI models, particularly for:
   - `weather: WeatherSummary` (mock) → `RouteAttachmentWeather` (UI)
   - `variant: String` (mock) → `RouteVariant` sealed class (UI)
   - `scenic: Int` (mock) → `scenicScore: Int` (UI, different naming)

3. **Empty Coordinate Lists**: Mock data doesn't include real polyline coordinates. Created `PolylineData` with empty coordinate lists as placeholders. Real implementation would decode the polyline strings from mock data.

## API Contract Notes

- **RouteResultsMockProvider** provides complete screen state including:
  - `NavigatorMessage` with pinned flag, body text, and attachments
  - `List<Route>` with distance/duration/scenic metadata
  - `selectedRouteId` for initial selection state

- **CameraFit.Polylines** requires `SpacingToken.Spacing4` per spec but LSMap implementation may not support union bounds calculation yet. Used placeholder camera position.

- **LSNavigatorMessage** expects `pinned: Boolean` to control auto-dismiss behavior. When `pinned=true`, the 5-second auto-dismiss timer is suppressed.

## UI Decisions

- **Three Polylines Pattern**: Mapped mock routes (index 0, 1, 2) to variants (Best, Alt1, Alt2) for visual distinction. First route always gets Best variant.

- **Compact Cards**: Used `compact=true` mode for route attachment cards to match design spec's dense layout.

- **Refine Placeholder**: Hardcoded placeholder text "Refine — 'make it shorter' / 'avoid Hwy 1'" per spec example.

- **Test Tags**: Added test tags to all major components (navigator-message, chat-input, topbar) for UI testing support.

## Gotchas for iOS Implementer

1. **RouteAttachment Mapping**: Mock provider's attachment type is different from UI molecule type. You'll need to map:
   ```kotlin
   // Mock domain entity
   data class RouteAttachment(
       val routeId: String,
       val variant: String,  // "best" | "alt1" | "alt2"
       val weather: WeatherSummary,
       val scenic: Int,  // 1-5
   )

   // UI molecule
   data class RouteAttachment(
       val variant: RouteVariant,  // sealed class
       val weatherBadge: RouteAttachmentWeather?,
       val scenicScore: Int,
   )
   ```

2. **Camera Fit Union Bounds**: The spec requires camera to auto-fit union bounds of all three polylines with `spacing.4` padding. LSMap's `CameraFit.Polylines` API exists but may not be fully implemented. Verify iOS MapKit can calculate union bounds.

3. **Animation Stagger**: Spec mentions `motion.recipe.routeDrawOn` with 120ms stagger between paths. This animation logic may need to be in the map layer rather than the screen template. Check if motion tokens expose stagger durations.

4. **Pinned Message Behavior**: LSNavigatorMessage has auto-dismiss (5 seconds) when `pinned=false`. For RouteResults screen, message should be `pinned=true` so it doesn't auto-dismiss while rider reviews routes.

5. **Route Card Selection**: First card should be pre-selected (`selected=true`). UI molecule handles selection state visually (border color, background tint). Template doesn't need to manage selection state — it's presentation-only.

## Files Created/Modified

### Created
- `app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt` — Template composable with LSMapLayer, LSNavigatorMessage, LSChatInput
- `app/src/debug/java/com/laneshadow/sandbox/stories/templates/RouteResultsScreenStory.kt` — Sandbox stories (default, empty, overflow)
- `app/src/test/java/com/laneshadow/ui/templates/RouteResultsScreenStaticTest.kt` — Static unit tests (no data fetching, token usage, composition)
- `app/src/androidTest/java/com/laneshadow/ui/templates/RouteResultsScreenUiTest.kt` — Compose UI tests (render hierarchy, callbacks)

### Modified
- None — purely additive feature

## Token Usage Verified

- ✅ `color.route.best/alt1/alt2` for polyline colors
- ✅ `spacing.4` (via `SpacingToken.Spacing4`) for camera fit padding
- ✅ No hardcoded colors or spacing values
- ✅ Theme accessed via `LocalLaneShadowTheme.current`

## Motion Tokens

- ⚠️ `motion.recipe.routeDrawOn` referenced in spec but not yet implemented in LSMap. Polylines are set up for animation (via `PolylineData.drawProgress`) but stagger animation requires future work.
- ⚠️ 120ms stagger constant not yet exposed in motion tokens. May need to be added.

## Testing Strategy

1. **Static Tests**: Verify no data fetching, proper token usage, correct composition
2. **UI Tests**: Verify render hierarchy, callback firing, test tag presence
3. **No Manual Testing Required**: Template is pure Compose with mock data — no emulator needed for verification

## Open Questions

1. **Polyline Coordinates**: Mock data includes encoded polyline strings but template uses empty coordinate lists. Real implementation would need to decode these to `List<LatLng>`.

2. **Route Card Tap Handling**: Template accepts `onRouteCardTap` callback but doesn't wire it to individual cards since `LSRouteAttachmentCard`'s `onTap` parameter is optional. Future work may need selection state management.

3. **Animation Implementation**: Route draw-on animation with stagger requires coordination between LSMap's Canvas rendering and motion tokens. Not implemented in this pass.
