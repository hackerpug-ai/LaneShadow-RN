# iOS Learnings: CHAT-S04-T05 Route Results Remediation

## Implementation Date
2026-05-02

## TDD State

RED/GREEN complete for the reviewer remediation pass.

- RED evidence: focused `RouteResultsWiringTests` initially failed after tests were strengthened to require `LSMapPolylineStyle.colorTokenPath` and exact `color.signal.*` route token paths. The branch still exposed route token styling and could not satisfy the new contract.
- GREEN evidence: focused `RouteResultsWiringTests` and `RouteResultsScreenTests` pass after production changes removed fabricated geometry, propagated route-plan stream failures, preserved selected route state through recall, and moved variant color resolution to the signal token render seam.

## Edge Cases Discovered

1. `RouteResultsScreen` must not re-decode raw polyline strings after the view model has already decoded them. The screen now renders `state.routePolylines` directly so backend precision is preserved on the live data path.
2. `PolylineAnnotation` does not expose dash styling in the Mapbox annotation API used here. Dash state has to be applied through `PolylineAnnotationManager`, which required one manager per route polyline so promoted and unselected routes can render differently.
3. The route-results wiring test needed to assert the rendered dash state, not just stroke width. Width-only assertions would miss the AC-3 regression where selection promotion looked correct but never changed solid vs dashed rendering.
4. Invalid geometry must not fabricate route coordinates. Decode failures now produce an empty polyline instead of the previous San Francisco fallback, and wiring coverage asserts the fallback coordinate is absent.
5. Route-plan subscription failures must remain errors, not silent stream completion. The route-plan path now uses `AsyncThrowingStream`, maps failures through `LaneShadowError`, and leaves non-critical subscribers on the existing non-throwing wrapper.

## API Contract Notes

- `RouteResultsViewModel` now owns the decoded polyline geometry and exposes it through `RouteResultsScreenState.routePolylines`.
- `PolylineData.lineDasharray` is the source of truth for solid vs dashed route presentation.
- Selected routes use `nil` dasharray; unselected routes use `lsMapPolylineDasharray`.
- Route variants render through `color.signal.default`, `color.signal.whisper`, and `color.signal.touring` token paths at the `LSMap` seam. `signal.touring` is represented as an iOS semantic alias backed by the existing generated success status token until the shared token package adds a generated signal touring token.
- `LaneShadowPlanningDataProviding.subscribeToRoutePlan` is throwing so live route-plan stream failures can surface as typed `LaneShadowError` in route results.

## UI Decisions

- The screen consumes live geometry from state rather than duplicating decode logic in the view layer.
- Route promotion is expressed through both stroke width and dash state so the selected route is visibly dominant and the previous route remains distinct.
- The recall chip test selects an alternate route before dismissal and asserts the same selected attachment and selected route id after recall.

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

- `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift`
  - Added selected/not-selected accessibility value so recall tests can assert selected route attachment state.

- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift`
  - Exposed decoded route polylines in the screen state, tagged promoted vs unselected routes with the correct dash state, removed fabricated fallback geometry, and propagated route-plan stream failures.

- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift`
  - Updated the shared route-plan observer to handle the throwing subscription protocol without a tight retry loop.

- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift`
  - Added a throwing route-plan subscription path while preserving the existing non-throwing subscription wrapper for other streams.

- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift`
  - Added deterministic route polylines for screen and wiring tests.

- `ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift`
  - Added stream-failure support for route-plan observation tests.

- `ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift`
  - Strengthened AC-1, AC-3, AC-5, and AC-6 coverage for no fabricated geometry, exact signal tokens, solid/dashed selection transitions, selected recall state, and stream failures.

- `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift`
  - Strengthened AC-1 source assertions so hardcoded screen-side polyline re-decoding is caught and replaced a local absolute path assertion with `#filePath` repo-relative resolution.

- `ios/LaneShadowTests/Atoms/LSMapTests.swift`
  - Added exact signal token/color assertions at the LSMap render seam.

- `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift`
  - Updated the local fake to match the throwing route-plan subscription protocol.

## Verification Commands

```bash
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=56A8B79E-0D39-47EA-8453-C711B4DA3D27' -only-testing:LaneShadowTests/RouteResultsWiringTests test
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=56A8B79E-0D39-47EA-8453-C711B4DA3D27' -only-testing:LaneShadowTests/RouteResultsScreenTests test
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=56A8B79E-0D39-47EA-8453-C711B4DA3D27' build
swiftformat --lint ios/LaneShadow/Views/Atoms/LSMap.swift ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift ios/LaneShadow/Features/Planning/PlanningViewModel.swift ios/LaneShadow/Services/ConvexClient+LaneShadow.swift ios/LaneShadowTests/Atoms/LSMapTests.swift ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift
bash scripts/tokens/enforce-native-compliance.sh
```
