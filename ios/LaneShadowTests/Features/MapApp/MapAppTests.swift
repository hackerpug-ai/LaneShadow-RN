import Foundation
import Testing

@testable import LaneShadow

@Suite("MapApp unified screen")
struct MapAppTests {
    // MARK: - MapAppState Tests

    @Test("MapAppState.idle case initializes without session ID")
    func testIdleStateCreation() {
        let state = MapAppState.idle
        if case .idle = state {
            #expect(true)
        } else {
            #expect(Bool(false), "Expected .idle state")
        }
    }

    @Test("MapAppState.planning case stores session ID")
    func testPlanningStateCreation() {
        let sessionId = "test-session-123"
        let state = MapAppState.planning(sessionId: sessionId)
        if case let .planning(id) = state {
            #expect(id == sessionId)
        } else {
            #expect(Bool(false), "Expected .planning state")
        }
    }

    @Test("MapAppState.routeResults case stores session and route IDs")
    func testRouteResultsStateCreation() {
        let sessionId = "test-session"
        let routePlanId = "test-route-plan"
        let state = MapAppState.routeResults(sessionId: sessionId, routePlanId: routePlanId)
        if case let .routeResults(sid, rpid) = state {
            #expect(sid == sessionId)
            #expect(rpid == routePlanId)
        } else {
            #expect(Bool(false), "Expected .routeResults state")
        }
    }

    @Test("MapAppState states are equatable")
    func testMapAppStateEquatable() {
        let state1 = MapAppState.idle
        let state2 = MapAppState.idle
        #expect(state1 == state2)

        let state3 = MapAppState.planning(sessionId: "s1")
        let state4 = MapAppState.planning(sessionId: "s1")
        #expect(state3 == state4)

        let state5 = MapAppState.planning(sessionId: "s1")
        let state6 = MapAppState.planning(sessionId: "s2")
        #expect(state5 != state6)
    }

    // MARK: - MapAppViewModel Tests

    @Test("MapAppViewModel initializes with idle state")
    @MainActor
    func testMapAppViewModelInitialState() {
        let idleViewModel = createIdleViewModel()
        let mapAppViewModel = MapAppViewModel(idleViewModel: idleViewModel)

        #expect(mapAppViewModel.currentState == .idle)
        #expect(mapAppViewModel.idleViewModel === idleViewModel)
    }

    @Test("MapAppViewModel transitions to idle state")
    @MainActor
    func testGoToIdleTransition() {
        let idleViewModel = createIdleViewModel()
        let mapAppViewModel = MapAppViewModel(idleViewModel: idleViewModel)

        mapAppViewModel.goToPlanning(sessionId: "test-session")
        #expect(mapAppViewModel.currentState == .planning(sessionId: "test-session"))

        mapAppViewModel.goToIdle()
        #expect(mapAppViewModel.currentState == .idle)
    }

    @Test("MapAppViewModel transitions to planning state with session ID")
    @MainActor
    func testGoToPlanningTransition() {
        let idleViewModel = createIdleViewModel()
        let mapAppViewModel = MapAppViewModel(idleViewModel: idleViewModel)

        let sessionId = "test-session-456"
        mapAppViewModel.goToPlanning(sessionId: sessionId)

        #expect(mapAppViewModel.currentState == .planning(sessionId: sessionId))
    }

    @Test("MapAppViewModel transitions to route results state")
    @MainActor
    func testGoToRouteResultsTransition() {
        let idleViewModel = createIdleViewModel()
        let mapAppViewModel = MapAppViewModel(idleViewModel: idleViewModel)

        let sessionId = "test-session"
        let routePlanId = "test-route-plan"
        mapAppViewModel.goToRouteResults(sessionId: sessionId, routePlanId: routePlanId)

        #expect(mapAppViewModel.currentState == .routeResults(sessionId: sessionId, routePlanId: routePlanId))
    }

    // MARK: - Helper Methods

    @MainActor
    private func createIdleViewModel() -> IdleViewModel {
        IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient(),
            appState: AppState(),
            onSessionStarted: { _ in }
        )
    }
}
