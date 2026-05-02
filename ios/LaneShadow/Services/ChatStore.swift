import Observation

@MainActor
@Observable
final class ChatStore {
    private(set) var flowState: RideFlowPhase

    private let sessionStore: SessionStore
    private let dependencies: RideFlowDependencies

    init(
        initialState: RideFlowPhase = initialState,
        sessionStore: SessionStore = SessionStore(),
        dependencies: RideFlowDependencies = .live
    ) {
        flowState = initialState
        self.sessionStore = sessionStore
        self.dependencies = dependencies
        syncSessionStore(for: initialState)
    }

    convenience init(
        flowState: RideFlowPhase,
        sessionStore: SessionStore = SessionStore(),
        dependencies: RideFlowDependencies = .live
    ) {
        self.init(initialState: flowState, sessionStore: sessionStore, dependencies: dependencies)
    }

    func dispatch(_ action: RideFlowAction) {
        flowState = reduce(flowState, action, dependencies: dependencies)
        syncSessionStore(for: flowState)
    }

    private func syncSessionStore(for state: RideFlowPhase) {
        guard let sessionId = state.sessionId else {
            sessionStore.newSession()
            return
        }

        sessionStore.loadSession(sessionId: sessionId)
    }
}
