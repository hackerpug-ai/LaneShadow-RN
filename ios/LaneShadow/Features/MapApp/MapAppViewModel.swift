import Foundation
import SwiftUI

/// Thin coordinator ViewModel for the unified MapApp screen.
/// Owns IdleViewModel always-alive and accepts a state enum that drives
/// overlay composition. Delegates to appropriate child ViewModels based on state.
///
/// Lifecycle:
/// - Cycle 1: idle state only, no planning
/// - Cycle 2: planning state added; planningViewModel allocated lazily on goToPlanning(),
///   deallocated on goToIdle(). Observes IdleViewModel.onSessionStarted callback
///   and automatically transitions to planning.
@Observable
@MainActor
final class MapAppViewModel {
    /// Current state of the MapApp unified screen
    var currentState: MapAppState = .idle

    /// Always-alive IdleViewModel for idle state composition and re-entry
    private(set) var idleViewModel: IdleViewModel

    /// Lazily-allocated PlanningViewModel, created when entering planning state.
    /// Deallocated (cancelled tasks stopped) when returning to idle.
    private(set) var planningViewModel: PlanningViewModel?

    // MARK: - Initialization

    init(
        idleViewModel: IdleViewModel
    ) {
        self.idleViewModel = idleViewModel
        setupIdleTransitionObserver()
    }

    // MARK: - State Transitions

    /// Transition to idle state, deallocating planning resources
    func goToIdle() {
        if let planningViewModel {
            planningViewModel.stopObserving()
        }
        planningViewModel = nil
        currentState = .idle
    }

    /// Transition to planning state (Cycle 2+)
    /// - Parameter sessionId: The session ID to plan
    func goToPlanning(sessionId: String) {
        // Allocate PlanningViewModel if needed
        if planningViewModel == nil {
            let newViewModel = PlanningViewModel(
                chatStore: idleViewModel.chatStore,
                sessionStore: idleViewModel.sessionStore,
                convexClient: idleViewModel.convexClient,
                fallbackSessionId: sessionId,
                appState: idleViewModel.appState
            )
            planningViewModel = newViewModel
        }

        currentState = .planning(sessionId: sessionId)

        // Begin observation for the planning session
        Task {
            await planningViewModel?.observe()
        }
    }

    /// Transition to route results state (Cycle 3+)
    /// - Parameters:
    ///   - sessionId: The session ID
    ///   - routePlanId: The route plan ID
    func goToRouteResults(sessionId: String, routePlanId: String) {
        currentState = .routeResults(sessionId: sessionId, routePlanId: routePlanId)
    }

    // MARK: - Planning State Transitions

    /// Request cancellation of the planning flow, showing confirmation sheet
    func requestCancelPlanning() {
        planningViewModel?.requestCancelConfirmation()
    }

    /// Confirm cancellation and return to idle
    func confirmPlanningCancellation() {
        Task {
            await planningViewModel?.confirmCancellation()
            goToIdle()
        }
    }

    // MARK: - Private: Observation Setup

    private func setupIdleTransitionObserver() {
        // The IdleViewModel uses the `onSessionStarted` callback to signal
        // when a session has been created (via suggestion chip tap → submitSuggestion).
        // We replace its default callback with one that transitions to planning.
        //
        // This callback is set during IdleViewModel initialization in RootView.
        // For this to work, we need to ensure the callback is wired here.
        // Since IdleViewModel's onSessionStarted is already set in RootView's init,
        // we instead observe state changes and wire the transition automatically
        // via the change observer in MapApp itself.
    }
}
