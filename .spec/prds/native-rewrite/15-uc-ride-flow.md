# Ride Flow State Machine - Native Rewrite UC

**Document ID:** UC-FLOW
**Status:** Draft
**Last Updated:** 2026-04-16

## Overview

This document defines the ride flow state machine that manages the entire ride lifecycle for LaneShadow's native rewrite. The state machine handles user journeys from map discovery through route planning, preview, navigation, recording, and completion.

## State Machine Definition

### States

```
IDLE → DISCOVERING → PLANNING → PREVIEWING → NAVIGATING → RECORDING → COMPLETED
```

### State Descriptions

| State | Description | Entry Trigger | Exit Conditions |
|-------|-------------|---------------|-----------------|
| **IDLE** | Map view, no active ride, ready to discover | App launch, ride completion, session reset | User sends message, loads saved session |
| **DISCOVERING** | Browsing routes, filtering, search UI active | User activates search/browse | User sends planning message, selects route |
| **PLANNING** | AI generating routes, processing natural language | User sends planning message | Routes generated, error occurs, user cancels |
| **PREVIEWING** | Route selected, comparing options, ride preparation | User selects route from results | User starts navigation, exports to external app |
| **NAVIGATING** | Turn-by-turn navigation active, metrics displayed | User starts ride navigation | Ride ends, user aborts navigation |
| **RECORDING** | Ride recording active, waypoints tracked | Navigation ends, recording begins | Ride completed, recording stopped |
| **COMPLETED** | Ride summary, save/share options | Recording stops with valid data | User starts new ride, returns to map |

### Transitions

| From | To | Trigger | Guard |
|------|-----|---------|-------|
| IDLE | PLANNING | SEND_MESSAGE action | Message content non-empty |
| IDLE | PREVIEWING | LOAD_SESSION action | Valid session data exists |
| DISCOVERING | PLANNING | SEND_MESSAGE action | Message content non-empty |
| DISCOVERING | PREVIEWING | SELECT_ROUTE action | Route ID exists in results |
| PLANNING | PREVIEWING | PLANNING_SUCCESS action | Routes generated successfully |
| PLANNING | IDLE | PLANNING_ERROR action | No existing routes to fallback to |
| PLANNING | PREVIEWING | CANCEL_PLANNING action | Existing routes from refinement |
| PREVIEWING | PLANNING | SEND_MESSAGE action | Refinement message |
| PREVIEWING | NAVIGATING | START_NAVIGATION action | Selected route ID exists |
| PREVIEWING | IDLE | NEW_SESSION action | User confirms reset |
| NAVIGATING | RECORDING | NAVIGATION_COMPLETE event | Valid navigation session |
| NAVIGATING | PREVIEWING | ABORT_NAVIGATION action | User cancels navigation |
| RECORDING | COMPLETED | RECORDING_COMPLETE event | Valid ride data captured |
| RECORDING | PREVIEWING | DISCARD_RECORDING action | User confirms discard |
| COMPLETED | IDLE | NEW_SESSION action | User accepts or dismisses summary |

### Guards

```typescript
// Platform-agnostic guard logic
interface Guards {
  canSendMessage(content: string): boolean
  canSelectRoute(routeId: string | null): boolean
  canStartNavigation(selectedRouteId: string | null): boolean
  canCompleteRecording(waypoints: Waypoint[]): boolean
}
```

---

## UC-FLOW-01: State Machine Overview

### Description
The ride flow state machine provides a type-safe, predictable way to manage ride lifecycle transitions. It ensures invalid states are unreachable and all transitions are explicit and guarded.

### Preconditions
- App is initialized
- Storage layer is hydrated
- User is authenticated (if applicable)

### Main Flow
1. State machine initializes in IDLE state
2. User actions trigger state transitions via dispatch
3. Guards validate transition conditions
4. State updates atomically
5. UI reacts to state changes
6. State persists to storage on each transition

### Acceptance Criteria

#### Android (Given/When/Then)
- **Given** the app is launched
- **When** the state machine initializes
- **Then** the initial state is IDLE with no active session
- **And** the state is exposed via StateFlow<RideFlowState>
- **And** all states are represented as sealed class subclasses
- **And** transitions are validated by guards before state changes

#### iOS (Given/When/Then)
- **Given** the app is launched
- **When** the state machine initializes
- **Then** the initial state is IDLE with no active session
- **And** the state is exposed via @Published var state: RideFlowState
- **And** all states are represented as enum with associated values
- **And** transitions are validated by guards before state changes

---

## UC-FLOW-02: IDLE State

### Description
The IDLE state is the resting state of the app. The map is visible, no ride is active, and the user can discover routes or start planning.

### Preconditions
- App is in foreground
- No active ride session
- Map is loaded and centered on user location

### Main Flow
1. User views map with their location
2. Search/browse button is available
3. Saved sessions can be loaded
4. Chat input is available for natural language planning

### Acceptance Criteria

#### Android
- **Given** the state machine is in IDLE
- **When** the user views the screen
- **Then** a full-bleed map is displayed with user location marker
- **And** a floating search button is visible
- **And** a chat input placeholder shows "Describe the ride you want..."
- **And** tapping search transitions to DISCOVERING state
- **And** sending a message transitions to PLANNING state

#### iOS
- **Given** the state machine is in IDLE
- **When** the user views the screen
- **Then** a full-bleed map is displayed with user location marker
- **And** a floating search button is visible
- **And** a chat input placeholder shows "Describe the ride you want..."
- **And** tapping search transitions to DISCOVERING state
- **And** sending a message transitions to PLANNING state

---

## UC-FLOW-03: DISCOVERING State

### Description
The DISCOVERING state allows users to browse routes, filter by criteria, and search for specific ride types without entering the planning flow.

### Preconditions
- State machine is in IDLE or DISCOVERING
- User has tapped search or browse

### Main Flow
1. Search UI slides up from bottom
2. Filters displayed (distance, terrain, difficulty)
3. User browses suggested routes
4. User selects route or returns to planning

### Acceptance Criteria

#### Android
- **Given** the state machine enters DISCOVERING
- **When** the search UI appears
- **Then** a bottom sheet slides up with filter options
- **And** route cards display in a scrollable list
- **And** tapping a route card transitions to PREVIEWING
- **And** tapping the chat input transitions to PLANNING
- **And** pressing back transitions to IDLE

#### iOS
- **Given** the state machine enters DISCOVERING
- **When** the search UI appears
- **Then** a bottom sheet slides up with filter options
- **And** route cards display in a scrollable list
- **And** tapping a route card transitions to PREVIEWING
- **And** tapping the chat input transitions to PLANNING
- **And** swiping down on the sheet transitions to IDLE

---

## UC-FLOW-04: PLANNING State

### Description
The PLANNING state is active while the AI processes natural language input and generates route options. This is the core planning experience.

### Preconditions
- State machine is in IDLE, DISCOVERING, PREVIEWING, or ROUTE_DETAILS
- User has sent a non-empty message

### Main Flow
1. User sends natural language message
2. State transitions to PLANNING
3. Loading indicator displays
4. AI processes request and generates routes
5. On success: transition to PREVIEWING with routes
6. On error: transition to ERROR state with message
7. On cancel: return to previous state with existing routes

### Acceptance Criteria

#### Android
- **Given** the user sends a planning message
- **When** the state transitions to PLANNING
- **Then** a loading indicator displays in the chat area
- **And** the message is visible in the conversation history
- **And** a cancel button is available
- **And** successful planning transitions to ROUTE_RESULTS
- **And** failed planning transitions to ERROR
- **And** canceling returns to ROUTE_RESULTS if routes exist, or IDLE if not

#### iOS
- **Given** the user sends a planning message
- **When** the state transitions to PLANNING
- **Then** a loading indicator displays in the chat area
- **And** the message is visible in the conversation history
- **And** a cancel button is available
- **And** successful planning transitions to ROUTE_RESULTS
- **And** failed planning transitions to ERROR
- **And** canceling returns to ROUTE_RESULTS if routes exist, or IDLE if not

---

## UC-FLOW-05: PREVIEWING State

### Description
The PREVIEWING state displays generated routes and allows the user to compare options, view details, and prepare to ride.

### Preconditions
- State machine is in PLANNING (success) or ROUTE_DETAILS
- Route options are available

### Main Flow
1. Routes display as cards in a bottom sheet
2. Each card shows distance, elevation, estimated time
3. Tapping a card opens route details (ROUTE_DETAILS)
4. User can refine routes with chat (returns to PLANNING)
5. User can start navigation (transitions to NAVIGATING)
6. User can export to external nav app (NAVIGATION_EXPORT)

### Acceptance Criteria

#### Android
- **Given** routes have been generated
- **When** the state is ROUTE_RESULTS
- **Then** route cards display in a bottom sheet
- **And** the first route is auto-selected
- **And** tapping a card transitions to ROUTE_DETAILS
- **And** tapping "Start Riding" transitions to NAVIGATING
- **And** sending a refinement message transitions to PLANNING
- **And** the session ID persists across refinements

#### iOS
- **Given** routes have been generated
- **When** the state is ROUTE_RESULTS
- **Then** route cards display in a bottom sheet
- **And** the first route is auto-selected
- **And** tapping a card transitions to ROUTE_DETAILS
- **And** tapping "Start Riding" transitions to NAVIGATING
- **And** sending a refinement message transitions to PLANNING
- **And** the session ID persists across refinements

---

## UC-FLOW-06: NAVIGATING State

### Description
The NAVIGATING state is active during turn-by-turn navigation. The user is following the planned route.

### Preconditions
- State machine is in ROUTE_DETAILS or NAVIGATION_EXPORT
- A route is selected
- User has confirmed "Start Riding"

### Main Flow
1. Navigation mode activates
2. Turn-by-turn instructions display
3. Current speed, distance, elevation show in overlay
4. Map follows user location
5. Route path highlights on map
6. Navigation completes or user aborts

### Acceptance Criteria

#### Android
- **Given** the user starts navigation
- **When** the state is NAVIGATING
- **Then** the map locks to user location with heading up
- **And** turn instructions display in a top banner
- **And** metrics overlay shows speed, distance, elevation
- **And** the route path is highlighted on the map
- **And** completing navigation transitions to RECORDING
- **And** aborting navigation transitions to PREVIEWING
- **And** the navigation session is tracked for completion

#### iOS
- **Given** the user starts navigation
- **When** the state is NAVIGATING
- **Then** the map locks to user location with heading up
- **And** turn instructions display in a top banner
- **And** metrics overlay shows speed, distance, elevation
- **And** the route path is highlighted on the map
- **And** completing navigation transitions to RECORDING
- **And** aborting navigation transitions to PREVIEWING
- **And** the navigation session is tracked for completion

---

## UC-FLOW-07: RECORDING State

### Description
The RECORDING state captures ride data after navigation completes. Waypoints, metrics, and route data are saved.

### Preconditions
- State machine is in NAVIGATING
- Navigation session completed successfully

### Main Flow
1. Navigation ends naturally
2. Recording begins automatically
3. Waypoints tracked at intervals
4. Metrics captured (speed, elevation, heart rate if available)
5. User can stop recording manually
6. Recording completes on ride end

### Acceptance Criteria

#### Android
- **Given** navigation completes
- **When** the state transitions to RECORDING
- **Then** a recording indicator displays in the status bar
- **And** waypoints are captured every 5 seconds
- **And** current metrics display in an overlay
- **And** a "Stop Recording" button is available
- **And** stopping transitions to COMPLETED with ride data
- **And** the recording persists if app is backgrounded

#### iOS
- **Given** navigation completes
- **When** the state transitions to RECORDING
- **Then** a recording indicator displays in the status bar
- **And** waypoints are captured every 5 seconds
- **And** current metrics display in an overlay
- **And** a "Stop Recording" button is available
- **And** stopping transitions to COMPLETED with ride data
- **And** the recording persists if app is backgrounded

---

## UC-FLOW-08: COMPLETED State

### Description
The COMPLETED state shows the ride summary with metrics, route map, and options to save or share the ride.

### Preconditions
- State machine is in RECORDING
- Recording stopped with valid ride data

### Main Flow
1. Recording stops
2. Ride summary screen displays
3. Metrics shown (distance, time, elevation, avg speed)
4. Route map displays with path
5. Save to profile option available
6. Share options available
7. User dismisses to return to IDLE

### Acceptance Criteria

#### Android
- **Given** a ride recording completes
- **When** the state is COMPLETED
- **Then** a summary screen displays with metrics
- **And** the route is visualized on a map
- **And** a "Save Ride" button is available
- **And** share options are accessible
- **And** dismissing the summary transitions to IDLE
- **And** the ride data is persisted to storage

#### iOS
- **Given** a ride recording completes
- **When** the state is COMPLETED
- **Then** a summary screen displays with metrics
- **And** the route is visualized on a map
- **And** a "Save Ride" button is available
- **And** share options are accessible
- **And** dismissing the summary transitions to IDLE
- **And** the ride data is persisted to storage

---

## UC-FLOW-09: State Persistence

### Description
The state machine must survive app restarts and restore to the last active state, preserving session data and route options.

### Preconditions
- State machine has active state
- App is backgrounded or killed

### Main Flow
1. State persists on each transition
2. App is killed or restarted
3. On launch, storage layer hydrates
4. Last state is restored
5. Session data is available
6. UI reflects restored state

### Acceptance Criteria

#### Android
- **Given** the app is in PLANNING state
- **When** the app is killed and relaunched
- **Then** the state machine restores to PLANNING
- **And** the session ID is preserved
- **And** route options are restored if available
- **And** the chat history is restored
- **And** Room database queries complete before UI renders
- **And** a loading indicator displays during hydration

#### iOS
- **Given** the app is in PLANNING state
- **When** the app is killed and relaunched
- **Then** the state machine restores to PLANNING
- **And** the session ID is preserved
- **And** route options are restored if available
- **And** the chat history is restored
- **And** SwiftData fetches complete before UI renders
- **And** a loading indicator displays during hydration

---

## UC-FLOW-10: Invalid State Recovery

### Description
The state machine must handle corrupt or invalid persisted state gracefully, resetting to IDLE without crashing.

### Preconditions
- Persisted state is corrupted
- App launches or attempts to hydrate

### Main Flow
1. Storage layer attempts to hydrate state
2. Validation fails (missing fields, invalid phase)
3. State machine catches error
4. Invalid state is logged
5. State resets to IDLE
6. User can continue normally

### Acceptance Criteria

#### Android
- **Given** persisted state is corrupted
- **When** the app attempts to hydrate
- **Then** the error is caught and logged
- **And** the state machine resets to IDLE
- **And** a toast message shows "Session restored to default"
- **And** the app does not crash
- **And** corrupted data is cleared from Room

#### iOS
- **Given** persisted state is corrupted
- **When** the app attempts to hydrate
- **Then** the error is caught and logged
- **And** the state machine resets to IDLE
- **And** an alert shows "Session restored to default"
- **And** the app does not crash
- **And** corrupted data is cleared from SwiftData

---

## UC-FLOW-11: Navigation Between States

### Description
Screen transitions must match state changes, providing smooth visual feedback as users move through the ride flow.

### Preconditions
- State machine transitions
- Navigation system is active

### Main Flow
1. State transition occurs
2. Navigation component observes state change
3. Screen transition animates
4. New screen renders with new state
5. Back button behavior matches state graph

### Acceptance Criteria

#### Android
- **Given** the state transitions from PLANNING to ROUTE_RESULTS
- **When** the navigation observes the change
- **Then** the route results screen slides in from the right
- **And** the transition animation is 300ms
- **And** the back button returns to PLANNING if routes were refined, or IDLE if not
- **And** Navigation Compose handles the back stack correctly

#### iOS
- **Given** the state transitions from PLANNING to ROUTE_RESULTS
- **When** the navigation observes the change
- **Then** the route results screen slides in from the right
- **And** the transition animation is 300ms
- **And** the back button returns to PLANNING if routes were refined, or IDLE if not
- **And** NavigationStack handles the path correctly

---

## Platform-Specific Implementation

### Android

```kotlin
// Sealed class state machine
sealed class RideFlowState {
    data class Idle(
        val sessionId: String? = null,
        val routeOptions: PlannedRouteOptionsView? = null,
        val selectedRouteId: String? = null
    ) : RideFlowState()

    data class Planning(
        val sessionId: String,
        val planId: String? = null,
        val currentPhase: String,
        val routeOptions: PlannedRouteOptionsView? = null,
        val selectedRouteId: String? = null
    ) : RideFlowState()

    data class Error(
        val errorMessage: String,
        val sessionId: String? = null,
        val errorTimestamp: Long = System.currentTimeMillis()
    ) : RideFlowState()

    // ... other states
}

// StateFlow exposure
class RideFlowViewModel : ViewModel() {
    private val _state = MutableStateFlow<RideFlowState>(RideFlowState.Idle())
    val state: StateFlow<RideFlowState> = _state.asStateFlow()

    fun dispatch(action: RideFlowAction) {
        _state.value = rideFlowReducer(_state.value, action)
        persistState(_state.value)
    }
}

// Room persistence
@Entity(tableName = "ride_flow_state")
data class RideFlowStateEntity(
    @PrimaryKey val id: String = "current",
    val phase: String,
    val sessionId: String?,
    val serializedData: String // JSON blob
)
```

### iOS

```swift
// Enum with associated values
enum RideFlowState: Equatable {
    case idle(sessionId: String?, routeOptions: PlannedRouteOptionsView?, selectedRouteId: String?)
    case planning(sessionId: String, planId: String?, currentPhase: String, routeOptions: PlannedRouteOptionsView?, selectedRouteId: String?)
    case error(errorMessage: String, sessionId: String?, errorTimestamp: TimeInterval)
    case routeResults(sessionId: String, routeOptions: PlannedRouteOptionsView, selectedRouteId: String?)
    case routeDetails(sessionId: String, routeOptions: PlannedRouteOptionsView, selectedRouteId: String)
    case sessionHistory(sessionId: String, routeOptions: PlannedRouteOptionsView, selectedRouteId: String?)
    case navigationExport(sessionId: String, routeOptions: PlannedRouteOptionsView, selectedRouteId: String)
}

// @Observable state machine
@Observable
class RideFlowStateMachine {
    var state: RideFlowState = .idle(sessionId: nil, routeOptions: nil, selectedRouteId: nil) {
        didSet {
            persistState(state)
        }
    }

    func dispatch(_ action: RideFlowAction) {
        state = rideFlowReducer(state, action)
    }
}

// SwiftData persistence
@Model
final class RideFlowStateEntity {
    var id: String = "current"
    var phase: String
    var sessionId: String?
    var serializedData: Data // JSON blob

    init(phase: String, sessionId: String?, serializedData: Data) {
        self.phase = phase
        self.sessionId = sessionId
        self.serializedData = serializedData
    }
}
```

---

## References

- Existing React Native implementation: `/hooks/use-ride-flow.ts`
- Component guidelines: `/components/CLAUDE.md`
- Settings store pattern: `/stores/settings-store.ts`
