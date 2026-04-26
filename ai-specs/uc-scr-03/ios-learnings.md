# iOS Learnings: UC-SCR-03 — RouteResultsScreen

## Implementation Date
2026-04-26

## Edge Cases Discovered

### 1. Xcode Project Registration is Critical
**Issue**: Files created on disk are NOT automatically compiled. They must be registered in `project.pbxproj`.

**Symptoms**:
- Build succeeds but new files aren't compiled
- Tests can't find the new types
- No error messages, just silent exclusion

**Solution**: Files must be added via Xcode GUI or project.pbxproj modification
- Open `LaneShadow.xcodeproj` in Xcode
- Drag new files into the Navigator panel
- Ensure files are added to correct targets (LaneShadow for source, LaneShadowTests for tests)

### 2. LSMap API Requires Camera Position
**Issue**: `LSMap` requires `camera` parameter, cannot use `cameraFit` alone.

**Resolution**: Provide default camera position even when using `cameraFit: .polylines`:
```swift
LSMap(
    mode: .interactive,
    camera: CameraPosition(
        center: LatLng(lat: 37.7749, lon: -122.4194),
        zoom: 12
    ),
    cameraFit: .polylines(padding: .spacing4),
    polylines: routePolylines,
    annotations: routeAnnotations
)
```

### 3. LSRouteAttachment Parameter Order
**Issue**: `weatherBadge` parameter must come before `isBest` in initializer.

**Correct order**:
```swift
LSRouteAttachment(
    id: ...,
    label: ...,
    description: ...,
    distance: ...,
    duration: ...,
    scenicScore: ...,
    weatherBadge: ...,  // Comes before isBest
    isBest: ...
)
```

### 4. Accessibility Identifiers for Testing
**Issue**: LSNavigatorMessage buttons lacked accessibility identifiers for ViewInspector testing.

**Solution**: Added identifiers to pin and dismiss buttons:
```swift
.accessibilityIdentifier("navigatormessage-pin")
.accessibilityIdentifier("navigatormessage-dismiss")
```

## API Contract Notes

### RouteResultsMockProvider Already Existed
The mock provider was already implemented with all required variants:
- `default` — 3 routes with full attachments
- `empty` — No routes found
- `overflow` — 12 routes (tests scrolling)
- `long-copy` — Extended Navigator prose

### LSRouteAttachment vs LSRouteAttachmentCard
- `LSRouteAttachment` — Data model (in ChatTranscript.swift)
- `LSRouteAttachmentCard` — SwiftUI view component
- RouteResultsScreen converts mock data to LSRouteAttachment for LSNavigatorMessage

### Color Tokens Referenced Correctly
Implementation uses `ColorToken` path strings for route colors:
```swift
.custom(ColorToken(path: "color.route.best"))
.custom(ColorToken(path: "color.route.alt1"))
.custom(ColorToken(path: "color.route.alt2"))
```

## UI Decisions

### Placeholder Polyline Decoding
Used placeholder coordinates since production polyline decoding wasn't in scope:
```swift
private func decodePolyline(_ encoded: String) -> [LatLng] {
    // TODO: Implement proper polyline decoding
    return [
        LatLng(lat: 37.7749, lon: -122.4194),
        LatLng(lat: 37.7849, lon: -122.4094),
        LatLng(lat: 37.7949, lon: -122.3994)
    ]
}
```

### Refine Chat Placeholder
Used the exact placeholder from design spec:
```swift
placeholder: "Refine — 'make it shorter' / 'avoid Hwy 1'"
```

### Top Bar Trailing
Set `.none` for trailing button per template pattern:
```swift
LSTopBar(
    trailing: .none,
    onMenuTap: {},
    onNewTap: {}
)
```

## Platform-Specific Notes

### SwiftUI @Observable vs ObservableObject
All new code uses `@State` for local state — no ViewModels needed for this template.

### LSMapLayer Slot API
Successfully used slot API for overlays:
- `topOverlays` — Navigator message
- `bottomOverlays` — Chat input
- `topBar` — Standard top bar

### ViewInspector Testing Pattern
Tests follow IdleScreenTests pattern:
1. Snapshot tests for visual verification
2. ViewInspector for interaction testing
3. Static grep for token verification
4. Static grep for forbidden patterns (no data fetching)

## Files Created/Modified

### Created
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (213 lines)
- `ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` (18 lines)
- `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift` (157 lines)

### Modified
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — Added accessibility identifiers to pin/dismiss buttons
- `ios/LaneShadow/Sandbox/Stories/TemplateStories.swift` — Registered RouteResultsScreenStory

### NOT Modified (Read-Only)
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` — Already existed
- `ios/LaneShadow/Sandbox/MockProviders/NavigatorDomain.swift` — Already existed
- `tokens/platforms/swift/**` — Token files (read-only per task spec)

## Next Steps

### CRITICAL: Add Files to Xcode Project
Before tests can run or build can include the new screen:

1. Open `ios/LaneShadow.xcodeproj` in Xcode
2. Add files to Navigator:
   - Drag `RouteResultsScreen.swift` to `Views/Templates` group
   - Drag `RouteResultsScreenStory.swift` to `Sandbox/Stories/Templates` group
   - Drag `RouteResultsScreenTests.swift` to `LaneShadowTests/Templates` group
3. Verify target membership:
   - Source files → LaneShadow target
   - Test files → LaneShadowTests target
4. Run `xcodebuild build` to verify compilation
5. Run tests to verify TDD cycle completion

### Future Enhancements
- Implement real polyline decoding (Google Polyline encoding format)
- Add route card selection handling (tap to select)
- Add animation recipe for route draw-on with 120ms stagger
- Add snapshot tests for light/dark modes
