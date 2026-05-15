import Foundation
import SwiftUI

/// Thin coordinator ViewModel for the unified MapApp screen.
/// Owns IdleViewModel always-alive and accepts a state enum that drives
/// overlay composition. Delegates to appropriate child ViewModels based on state.
@Observable
@MainActor
final class MapAppViewModel {
    /// Current state of the MapApp unified screen
    var currentState: MapAppState = .idle

    /// Always-alive IdleViewModel for idle state composition and re-entry
    private(set) var idleViewModel: IdleViewModel

    // MARK: - Initialization

    init(
        idleViewModel: IdleViewModel
    ) {
        self.idleViewModel = idleViewModel
    }

    // MARK: - State Transitions

    /// Transition to idle state
    func goToIdle() {
        currentState = .idle
    }

    /// Transition to planning state (Cycle 2+)
    /// - Parameter sessionId: The session ID to plan
    func goToPlanning(sessionId: String) {
        currentState = .planning(sessionId: sessionId)
    }

    /// Transition to route results state (Cycle 3+)
    /// - Parameters:
    ///   - sessionId: The session ID
    ///   - routePlanId: The route plan ID
    func goToRouteResults(sessionId: String, routePlanId: String) {
        currentState = .routeResults(sessionId: sessionId, routePlanId: routePlanId)
    }
}
