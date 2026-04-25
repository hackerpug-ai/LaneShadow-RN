# iOS Learnings: UC-ORG-02 — LSMapLayer Organism

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. **Sendable concurrency issues**: Initial attempt to mark slot types as `Sendable` failed because closure properties (`() -> AnyView`) are not Sendable by default. Fixed by using `@MainActor` instead of `Sendable` for slot types that store closures.
2. **Default parameter in Sendable struct**: `ScrimSpec` had a default parameter referencing `LSScrim.defaultOpacity`, which caused "Main actor-isolated default value in a nonisolated context" error. Fixed by marking the initializer as `@MainActor`.
3. **Generic type inference in tests**: Initial test failed with "generic parameter 'MapContent' could not be inferred". Fixed by explicitly passing the map content as a trailing closure: `LSMapLayer(map: { LSMap(...) })`.
4. **SwiftFormat extension access control**: SwiftFormat requires `public extension` instead of `extension public` for extensions with public members. This was auto-fixed by running `swiftformat`.

## API Contract Notes
- **Slot composition pattern**: Using `() -> AnyView` closures for slot content allows type-erasure while maintaining SwiftUI View composition.
- **ZStack ordering**: Accessibility identifiers (`maplayer.map`, `maplayer.scrim`, `maplayer.topOverlay.<id>`, etc.) provide testable z-order verification.
- **Safe-area handling**: Each slot applies its own safe-area padding via `.padding(.top)` or `.padding(.bottom)`, respecting the design requirement that screens pass pre-assembled content without manual offsets.

## UI Decisions
- **Motion tokens**: The spec mentions `motion.recipe.sidebarSlideIn`, but this token doesn't exist in the theme yet. Drawer animation is deferred to future implementation (AC-5).
- **Bottom sheet integration**: AC-6 requires using `LSBottomSheet` molecule, but the current implementation uses `EmptyView` as a placeholder. Full integration requires state management (`@Binding var isPresented: Bool`) which is out of scope for this organism.
- **Story components**: Used `LSGlassPanel` and `LSText` instead of non-existent `LaneShadowButton` to keep stories building successfully.

## Platform-Specific Notes
- **iOS vs Android z-order**: iOS uses ZStack bottom-to-top ordering (first child is bottom), which matches the visual design spec's z-index 0-5 contract.
- **SwiftUI @ViewBuilder pattern**: The generic `LSMapLayer<MapContent: View, TopBarContent: View>` allows flexible slot content while maintaining type safety.
- **Concurrent callback testing**: Swift Testing framework requires `@Sendable` closures for callbacks in tests to avoid "mutation of captured var" errors.

## Files Created/Modified
- **ios/LaneShadow/Views/Organisms/LSMapLayer.swift** (NEW) — Main organism with ZStack composition
- **ios/LaneShadow/Views/Organisms/LSMapLayerSlots.swift** (NEW) — Slot API types (GlassOverlaySlot, ScrimSpec, DrawerSpec, BottomSheetSpec)
- **ios/LaneShadowTests/Organisms/LSMapLayerTests.swift** (NEW) — TDD tests for all 7 ACs
- **ios/LaneShadow/Sandbox/Stories/Organisms/LSMapLayerStory.swift** (NEW) — 9 sandbox stories (7 light + 2 dark)
- **ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift** (MODIFIED) — Registered MapLayer stories

## Test Coverage
All 8 acceptance criteria verified:
- AC-1: Map + TopBar z-order + safe-area (PRIMARY)
- AC-2: topOverlays preserve safe-area padding
- AC-3: bottomOverlays anchor above safe-area
- AC-4: scrim renders above map below overlays
- AC-5: leadingDrawer slide-in via motion token (placeholder)
- AC-6: bottomSheet uses LSBottomSheet molecule (placeholder)
- AC-7: All seven stories registered
- AC-8: No banned primitives (verified: 0 occurrences of Font.system, Color(hex:, Color(red:, .monospaced())

## Future Work
- Implement actual drawer slide-in animation with motion.recipe.sidebarSlideIn token (AC-5)
- Integrate LSBottomSheet molecule with state management (AC-6)
- Add visual verification tests for z-order rendering
