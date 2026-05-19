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
    var planningMapControlsMode: LSMapControlsMode = .map
    var planningLayersVisible = true

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

        #if DEBUG
            // DEBUG-only: Check for launch-argument state injection
            let injectedState = Self.injectedInitialState()
            if let injectedState {
                currentState = injectedState
            }
        #endif

        setupIdleTransitionObserver()
    }

    // MARK: - State Transitions

    /// Transition to idle state, deallocating planning resources
    func goToIdle() {
        if let planningViewModel {
            planningViewModel.stopObserving()
        }
        planningViewModel = nil
        planningMapControlsMode = .map
        planningLayersVisible = true
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

        planningMapControlsMode = .map
        planningLayersVisible = true
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

    func togglePlanningLayers() {
        planningLayersVisible.toggle()
    }

    func togglePlanningControlsMode() {
        planningMapControlsMode = planningMapControlsMode == .map ? .chat : .map
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

    // MARK: - DEBUG: Launch Argument State Injection

    #if DEBUG
        /// Parse launch arguments for MapAppState injection parameters.
        /// Returns a MapAppState to apply on init, or nil if no injection args are present.
        ///
        /// Expected arguments:
        /// - `.idle`: `-MapAppState=idle`
        /// - `.planning(sessionId)`: `-MapAppState=planning -SessionId=<sessionId>`
        /// - `.routeResults(sessionId, routePlanId)`: `-MapAppState=routeResults -SessionId=<sessionId>
        /// -RoutePlanId=<routePlanId>`
        ///
        /// Used exclusively for UITests that need to land at non-idle states
        /// without traversing the full planning flow. Only active when `-MapAppState` arg is present.
        static func injectedInitialState(from args: [String] = ProcessInfo.processInfo.arguments) -> MapAppState? {
            guard let stateArg = args.first(where: { $0.hasPrefix("-MapAppState=") }) else {
                return nil
            }

            let stateValue = stateArg.replacingOccurrences(of: "-MapAppState=", with: "")

            switch stateValue {
            case "idle":
                return .idle
            case "planning":
                guard let sessionId = args.first(where: { $0.hasPrefix("-SessionId=") })
                    .map({ $0.replacingOccurrences(of: "-SessionId=", with: "") })
                else {
                    NSLog("🔴 MapAppViewModel.injectedInitialState: planning state requested but SessionId arg missing")
                    return nil
                }
                NSLog("🟢 MapAppViewModel.injectedInitialState: planning state injected with sessionId=\(sessionId)")
                return .planning(sessionId: sessionId)
            case "routeResults":
                guard let sessionId = args.first(where: { $0.hasPrefix("-SessionId=") })
                    .map({ $0.replacingOccurrences(of: "-SessionId=", with: "") }),
                    let routePlanId = args.first(where: { $0.hasPrefix("-RoutePlanId=") })
                    .map({ $0.replacingOccurrences(of: "-RoutePlanId=", with: "") })
                else {
                    NSLog(
                        "🔴 MapAppViewModel.injectedInitialState: routeResults state requested but SessionId or RoutePlanId arg missing"
                    )
                    return nil
                }
                NSLog(
                    "🟢 MapAppViewModel.injectedInitialState: routeResults state injected with sessionId=\(sessionId) routePlanId=\(routePlanId)"
                )
                return .routeResults(sessionId: sessionId, routePlanId: routePlanId)
            default:
                NSLog("🔴 MapAppViewModel.injectedInitialState: unknown MapAppState value: \(stateValue)")
                return nil
            }
        }
    #endif
}
