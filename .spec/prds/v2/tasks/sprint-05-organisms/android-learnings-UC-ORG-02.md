# Android Learnings: UC-ORG-02 — LSMapLayer Organism

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. **LSMap native dependency**: LSMap uses Mapbox native libraries which cause `UnsatisfiedLinkError` in unit tests. Solution: Wrap LSMap in a Box with test tag for testing purposes instead of calling LSMap directly.
2. **Safe-area padding per slot**: Each overlay slot needs its own WindowInsets padding. Top overlays use `statusBarsPadding()`, bottom overlays use `navigationBarsPadding()`. This ensures each slot respects safe areas independently.
3. **Scrim tap handling**: When drawer is present, scrim must be `blocking = true` and tap should invoke drawer's `onDismiss`. This requires passing the drawer's dismiss callback to the scrim.
4. **Motion recipe token access**: Sidebar slide-in animation uses `theme.motion.duration["standard"]` and `theme.motion.easing["decelerated"]` tokens. These return `Double?` and need null-safe conversion to `Int` and `List<Float>`.

## API Contract Notes
- **Slot-based architecture**: LSMapLayer uses composable slots (`@Composable () -> Unit`) instead of direct component references. This allows screens to compose any content into slots while LSMapLayer handles positioning.
- **Z-index via Box ordering**: In Compose, z-index is determined by child order in Box. Last child = topmost. The implementation follows this strictly: map → scrim → overlays → sheet → drawer → topBar.
- **BottomSheetDetent mapping**: LSMapLayer uses its own `SheetDetent` enum (Small/Medium/Large) and maps to LSBottomSheet's `BottomSheetDetent` enum. This keeps LSMapLayer's API stable if LSBottomSheet's internal detent representation changes.

## UI Decisions
- **AnimatedVisibility for drawer**: Used `AnimatedVisibility` with `slideInHorizontally`/`slideOutHorizontally` instead of manual offset animation. This provides built-in enter/exit state management.
- **Token-based motion**: All animation timing and easing come from `LaneShadowTheme.motion` tokens, specifically `sidebarSlideIn` recipe (`duration: "standard"`, `easing: "decelerated"`).
- **Test tags for debugging**: Each slot gets a test tag (e.g., `"GlassOverlaySlot:$id"`, `"LSScrim"`, `"LeadingDrawerSlot"`) for UI testing and debugging.

## Gotchas for iOS Implementer
1. **LSMap native testing**: Mapbox native libraries won't work in unit tests. Wrap map in test container or use preview mode.
2. **WindowInsets per platform**: Android uses `WindowInsets.statusBars`/`WindowInsets.navigationBars`. iOS uses `safeAreaInsets`/`UIEdgeInsets`. Ensure each slot applies its own safe-area padding.
3. **Z-index in SwiftUI vs Compose**: SwiftUI uses `.zIndex()` modifier. Compose uses child order in Box. Last composables added = topmost.
4. **Motion recipe format**: Android stores motion as `Map<String, Int>` (duration) and `Map<String, List<Double>>` (easing cubic bezier points). iOS may use different structure.
5. **Sheet detent enums**: Both platforms should have their own detent enums internally. Don't expose platform-specific detent types in LSMapLayer's public API.

## Files Created/Modified
- **Created**: `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` — Main organism with 7 slots
- **Created**: `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayerSlots.kt` — Slot types: GlassOverlaySlot, ScrimSpec, DrawerSpec, BottomSheetSpec, SheetDetent
- **Created**: `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt` — 7 tests covering all ACs
- **Created**: `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSMapLayerStory.kt` — 7 sandbox stories (Map Only, Map+TopBar, Map+Top Overlay, Map+Bottom Overlay, Map+Scrim+Drawer, Map+Sheet, Full Stack)
- **Modified**: `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt` — Registered LSMapLayerStory.all

## Test Coverage Summary
- AC-1: Map + TopBar renders with statusBarsPadding ✓
- AC-2: topOverlays preserve safe-area padding ✓
- AC-3: bottomOverlays anchor above navigation bar ✓
- AC-4: scrim renders above map below overlays ✓
- AC-5: leadingDrawer slides in via motion.recipe.sidebarSlideIn ✓
- AC-6: bottomSheet delegates to LSBottomSheet ✓
- AC-7: Z-order contract enforced (map < scrim < overlays < sheet < drawer < topBar) ✓
- AC-8: 7 sandbox stories registered ✓

## Resource Management Verification
- No hardcoded colors (all use `LaneShadowTheme` tokens)
- No hardcoded spacing (all use `theme.space.*` tokens)
- No hardcoded typography (all use `theme.typography.*` or component defaults)
- No hardcoded motion durations (all use `theme.motion.*` tokens)
- LSMap properly handles Mapbox access token via `R.string.mapbox_access_token`
- All test tags follow `ls-*` or descriptive naming convention
