# iOS Learnings: CHAT-S04-T05 Route Results Remediation

## Implementation Date
2026-05-02

## Edge Cases Discovered

1. `RouteResultsScreen` must not re-decode raw polyline strings after the view model has already decoded them. The screen now renders `state.routePolylines` directly so backend precision is preserved on the live data path.
2. `PolylineAnnotation` does not expose dash styling in the Mapbox annotation API used here. Dash state has to be applied through `PolylineAnnotationManager`, which required one manager per route polyline so promoted and unselected routes can render differently.
3. The route-results wiring test needed to assert the rendered dash state, not just stroke width. Width-only assertions would miss the AC-3 regression where selection promotion looked correct but never changed solid vs dashed rendering.

## API Contract Notes

- `RouteResultsViewModel` now owns the decoded polyline geometry and exposes it through `RouteResultsScreenState.routePolylines`.
- `PolylineData.lineDasharray` is the source of truth for solid vs dashed route presentation.
- Selected routes use `nil` dasharray; unselected routes use `lsMapPolylineDasharray`.

## UI Decisions

- The screen consumes live geometry from state rather than duplicating decode logic in the view layer.
- Route promotion is expressed through both stroke width and dash state so the selected route is visibly dominant and the previous route remains distinct.

## Platform-Specific Notes

- The Mapbox annotation manager API was the correct seam for dash styling, not the annotation payload itself.
- Using separate managers for each polyline keeps the line styling predictable without changing the higher-level route-results model.
- Snapshot assertions should avoid weakening precision when the source state can be preserved directly.

## Files Created/Modified

- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift`
  - Switched the screen to render decoded route polylines from state instead of re-decoding encoded strings in the view.

- `ios/LaneShadow/Views/Atoms/LSMap.swift`
  - Added dasharray support to `PolylineData` and style resolution.

- `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift`
  - Applied polyline dash styling through `PolylineAnnotationManager`.

- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift`
  - Exposed decoded route polylines in the screen state and tagged promoted vs unselected routes with the correct dash state.

- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift`
  - Added deterministic route polylines for screen and wiring tests.

- `ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift`
  - Strengthened AC-3 coverage so the test fails if promotion only changes width.

- `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift`
  - Strengthened AC-1 source assertions so hardcoded screen-side polyline re-decoding is caught.

## Verification Commands

```bash
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=56A8B79E-0D39-47EA-8453-C711B4DA3D27' -only-testing:LaneShadowTests/RouteResultsWiringTests test
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=56A8B79E-0D39-47EA-8453-C711B4DA3D27' -only-testing:LaneShadowTests/RouteResultsScreenTests test
swiftformat --lint ios/LaneShadow/Views/Atoms/LSMap.swift ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift ios/LaneShadow/Sandbox/MockProviders/NavigatorDomain.swift ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift ios/LaneShadowTests/Atoms/LSMapTests.swift ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift
bash scripts/tokens/enforce-native-compliance.sh
```
