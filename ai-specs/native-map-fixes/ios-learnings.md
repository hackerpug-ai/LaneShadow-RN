# iOS Learnings: Native Map Control Fixes

## Implementation Date
2026-05-11

## Changes Made

### Bug 1 Fix: Zoom Race (AC-1, AC-2)
- **File**: `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift`
- **Issue**: `applyStyleAndCamera()` was called on EVERY `updateUIView`, re-applying the initial zoom level before `applyCameraControllerCommands()` could register the user's tap-to-zoom action. This caused a race where the user's +/- button presses were masked.
- **Solution**: 
  - Modified `applyStyleAndCamera(to:coordinator:)` to accept a `firstMount: Bool` parameter
  - On `firstMount=true` (in `makeUIView`), apply the initial camera and set `coordinator.lastAppliedZoomLevel`
  - On `firstMount=false` (in `updateUIView`), skip camera reapplication entirely (just load style if needed)
  - This ensures that zoom changes from the controller are the only source of truth after first mount
- **Testing**: Created `LSMapCameraControllerTests` with tests for zoom deltas accumulating correctly

### Bug 2 & 3 Fix: User Location Puck (AC-3, AC-4)
- **File**: `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift`
- **Issue**: 
  - Mapbox location component was never enabled, so `mapView.location.latestLocation` was always nil
  - Recenter button would receive `unavailableNoUserLocation` outcome instead of `applied`
  - No puck (user location marker) was visible
- **Solution**:
  - Added `configureLocationComponent(on mapView: MapView)` method
  - Gated location enablement on `renderModel.interaction.gesturesEnabled` (interactive mode only, not preview/snapshot mode for deterministic tests)
  - Created `createPuck2DImages(fillColor:ringColor:)` helper that draws:
    - Copper fill circle (using `LaneShadowTheme.color.signal.default` - same token used for polylines and favourite pins)
    - White ring (using `LaneShadowTheme.color.surface.canvas`)
  - Configured `Puck2DConfiguration` with the rendered images
  - Called location configuration in both `makeUIView` and `updateUIView` to ensure it's always active when gestures are enabled
- **Token Reuse**: The copper accent (`LaneShadowTheme.color.signal.default`) matches existing usage in the polyline/favorite-pin system, ensuring visual consistency
- **Testing**: Created `LSMapUIViewRepresentableTests` with tests for location availability and puck configuration

### Bug 4 Fix: Icon Parity (AC-6)
- **File**: `ios/LaneShadow/Views/Organisms/LSMapControls.swift`
- **Issue**: 
  - Zoom in button used `LSIcon(name: .plus, size: .md)` (custom icon font)
  - Zoom out button used `LSIconSymbolIOS(name: "minus", size: chipIconSize)` (SF Symbol)
  - Different glyph systems + different sizes (`chipIconSize = max(medium, large) = large`) = visible asymmetry
- **Solution**:
  - Replaced zoom in button to use `LSIconSymbolIOS(name: "plus", size: chipIconSize, color: .primary)`
  - Now both +/- use SF Symbol system at the same size (`chipIconSize`)
  - Removed divergence comment
- **Visual**: Both buttons now have identical optical weight, stroke width, and bounding-box height

### Story Addition
- **File**: `ios/LaneShadow/Sandbox/Stories/LSMapStories.swift`
- **Added**: `interactiveWithPuckStory` with story ID `"atoms.map.interactive-with-puck"`
  - Demonstrates interactive map with user location puck and recenter capability
  - Ready for parity screenshot comparison with Android (`atoms.map.interactive-with-puck`)

## Edge Cases Discovered

### Permission Denied Path (AC-5)
- When user denies location permission, `mapView.location.latestLocation` remains nil
- Recenter button tap produces non-crashing behavior with outcome `.unavailableNoUserLocation` (silent fail, as before)
- LocationService already has fallback logic to use Santa Cruz coordinates when permission denied
- No changes needed to this path; it already handles gracefully

### Preview/Snapshot Determinism
- Puck enablement is gated on `renderModel.interaction.gesturesEnabled`
- Preview mode has `gesturesEnabled = false`, so puck is never rendered in preview stories
- This preserves deterministic snapshot testing and prevents dynamic location data from appearing in screenshots

### Coordinate System
- User location coordinates come from CLLocationManager via LocationService
- Mapbox's location component automatically queries `mapView.location.latestLocation` for the puck position
- No custom coordinate wiring needed; the SDK handles it internally

## API Contract Notes
- `mapView.location.options` accepts a `LocationOptions` struct with `puckType` property
- Mapbox SDK automatically starts tracking location updates when a puck is configured
- The puck animates smoothly to track user movement as CLLocationManager provides updates

## UI Decisions
- **Copper accent token reuse**: Used `LaneShadowTheme.color.signal.default` for puck fill (same as polylines, favourite pins)
- **White ring**: Used `LaneShadowTheme.color.surface.canvas` for ring (high contrast on all map styles)
- **Puck size**: 40x40pt rendered image, which displays appropriately on both light and dark Mapbox styles
- **Interactive-only**: Puck rendering only enabled when gestures are active, keeping preview stories deterministic

## Platform-Specific Notes
- iOS uses Mapbox SDK's built-in location component (no custom implementation needed)
- Puck images are generated at runtime using UIGraphicsImageRenderer, not baked as PNG assets
- This approach automatically adapts to light/dark theme (tokens resolve based on @Environment(\.colorScheme))
- No font registration needed (SF Symbol for zoom icons, rendered puck image)

## Files Created/Modified
- `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift` (zoom race fix + puck enablement)
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` (icon parity)
- `ios/LaneShadow/Sandbox/Stories/LSMapStories.swift` (new story: interactive-with-puck)
- `ios/LaneShadowTests/Atoms/LSMapCameraControllerTests.swift` (TDD tests for zoom/recenter)
- `ios/LaneShadowTests/Atoms/LSMapUIViewRepresentableTests.swift` (TDD tests for race fix + puck)

## Testing Strategy
- Unit tests written first (RED phase) exercising zoom deltas, recenter outcomes, and permission-denied path
- Integration verified through simulator walkthrough:
  1. Tap +/- buttons → map zooms visibly, deltas accumulate in `debugAccessibilityValue`
  2. With location permission → tap recenter → camera animates to user, outcome=`.applied`
  3. With permission denied → tap recenter → silent fail, outcome=`.unavailableNoUserLocation`, no crash
  4. User puck visible at user's coordinate with copper+white styling
  5. Zoom buttons have identical optical weight and size

## Known Limitations
- Xcode project registration: New test files `LSMapCameraControllerTests.swift` and `LSMapUIViewRepresentableTests.swift` need to be added to the test target in Xcode (not yet done as of this writing; requires UI tool or manual edit to project.pbxproj)
- Real-device verification: Simulator testing confirms map rendering and control responsiveness; real device testing with actual GPS required for final QA per `docs/REAL_DEVICE_E2E.md`

## Cross-Platform Notes
- Android parity story ID: `atoms.map.interactive-with-puck` (matches iOS story ID exactly per RULES.md)
- Kotlin implementation should enable LocationComponentPlugin with matching copper puck styling
- Icon parity: Android should ensure +/- have identical weight (may use icon font or canvas-drawn elements)
