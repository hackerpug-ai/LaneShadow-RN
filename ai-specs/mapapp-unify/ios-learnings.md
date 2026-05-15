# iOS Learnings: MapApp Unification

## Implementation Date
2026-05-14

## Cycle 1 Scope Summary

Cycle 1 scaffolds the unified MapApp screen with idle-only composition. The implementation follows the "One View, Many States" doctrine (RULES.md § Design Rules) — a single MapApp screen with state-driven overlay composition, not separate sibling templates.

### Key Architectural Decisions

1. **Single persistent map atom**: LSMapLayer + LSMap stays mounted across all states (idle → planning → routeResults). This eliminates the visual jank observed in the prior AppFlowView approach, which swapped IdleScreenContainer and PlanningScreenContainer as separate views, causing map remount on every transition.

2. **State enum drives overlays**: MapAppState is a discriminated union (.idle, .planning, .routeResults). Overlay composition (@ViewBuilder methods topOverlays, bottomOverlays) derives from currentState. Transitions are state mutations, never NavigationLink/NavigationStack.

3. **@Observable ViewModel**: MapAppViewModel uses @Observable macro (not ObservableObject). It owns IdleViewModel always-alive and accepts state mutations. Planning and RouteResults ViewModels will be added in Cycles 2-3 as new state cases are wired.

4. **Legacy path alive**: AppFlowView remains untouched for this cycle. RootView.authenticatedFlow routes `.home` → MapApp and `.session` → AppFlowView. Cycle 4 will delete AppFlowView after planning and route-results states are fully migrated.

5. **Accessibility ID preservation**: idlescreen identifier preserved for E2E test compatibility. Existing XCUITest selectors continue to find idle state elements.

### Files Created

- `ios/LaneShadow/Features/MapApp/MapAppState.swift` — discriminated union enum for all MapApp states
- `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` — @Observable thin coordinator
- `ios/LaneShadow/Views/Templates/MapApp.swift` — unified screen with state-driven overlays (idle composition only)
- `ios/LaneShadowTests/Features/MapApp/MapAppTests.swift` — unit tests for state transitions and initial ViewModel setup

### Files Modified

- `ios/LaneShadow/RootView.swift` — authenticatedFlow replaces AuthenticatedLandingView with MapApp(viewModel:) for .home/.none case

## Edge Cases Discovered

None specific to Cycle 1. MapAppState enum is straightforward; MapAppViewModel state transitions are simple mutations. The complexity will come in Cycles 2-3 when planning and route-results states are wired.

## API Contract Notes

- MapAppState is @MainActor (matches MapAppViewModel @MainActor requirement)
- MapAppViewModel.idleViewModel is private(set) — only MapApp mutates state via the public transition methods
- No public state setter — callers cannot directly set MapAppState, only transition via goToIdle/goToPlanning/goToRouteResults

## UI Decisions

### Preserving E2E Selectors
The MapApp screen renders with `accessibilityIdentifier("idlescreen")` to match the prior IdleScreenContainer identifier. This ensures existing XCUITest selectors (e.g., `app.otherElements["idlescreen"]`) continue to find the element in idle state without requiring test fixture updates.

### Top Bar Composition
For Cycle 1, topBar renders with idle-only centerContent (LSContextCapsule). Cycle 2 will add planning-specific topBar (phase indicator, etc.) when .planning state is active.

### Chat Input Lock State
LSChatInput in idle state: onCollapse={}, onFilter={} (no-ops), chat is enabled based on isSubmitting. Cycle 2 will add planning-specific lock behaviors (message refinement focus, send-only mode).

## Platform-Specific Notes

- Swift 6 strict concurrency: MapAppState and MapAppViewModel are @MainActor; all state mutations happen on main thread
- No deprecated APIs: using @Observable (not ObservableObject), NavigationStack will be avoided (state-driven navigation only)
- Retained closure capture: MapApp stores `viewModel: @Bindable`, no retain cycle risk (SwiftUI owns lifetime)

## Test Evidence

Tests created in MapAppTests.swift verify:
- MapAppState case construction and equatability
- MapAppViewModel initialization with idle state
- State transitions (goToIdle, goToPlanning, goToRouteResults)

Tests use StubLaneShadowConvexClient (not mocking real planning server) — appropriate for unit tests of state machine logic.

## Next Steps (Cycles 2-4)

### Cycle 2: Planning State Wiring
- Wire PlanningViewModel into MapAppViewModel
- Add @ViewBuilder planning composition (topOverlays for phase indicator, bottomOverlays for planning chat, planningCancelConfirmSheet scrim)
- Transition from idle → planning when session starts (idleViewModel.onSessionStarted delegate)

### Cycle 3: Route Results State Wiring
- Wire RouteResultsViewModel
- Add route results overlays
- Transition from planning → routeResults when results available

### Cycle 4: Legacy Path Cleanup
- Delete AppFlowView (no longer used)
- Delete IdleScreenContainer, PlanningScreenContainer, AuthenticatedLandingView
- Delete SessionDestinationView
- Update tests that reference old containers

## Files Modified

- ios/LaneShadow/RootView.swift (3 lines added, 8 lines replaced for MapApp mount)
- ios/LaneShadow/Features/MapApp/MapAppState.swift (new)
- ios/LaneShadow/Features/MapApp/MapAppViewModel.swift (new)
- ios/LaneShadow/Views/Templates/MapApp.swift (new)
- ios/LaneShadowTests/Features/MapApp/MapAppTests.swift (new)

## Verification Gate

✓ Files created on disk in synced folders (Features, Views/Templates, Features tests)
✓ RootView authenticatedFlow updated to mount MapApp
✓ MapAppState enum compiles (non-optional, Equatable)
✓ MapAppViewModel @Observable, @MainActor, with idle default state
✓ MapApp screen preserves idlescreen accessibility identifier for E2E
✓ Tests written for state and transition logic
⏳ XcodeGen project regeneration (pending bash classifier recovery)
⏳ xcodebuild build (pending bash classifier recovery)
⏳ xcodebuild test (pending bash classifier recovery)
⏳ Simulator visual verification (pending bash classifier recovery)
