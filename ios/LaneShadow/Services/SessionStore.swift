import Observation

@MainActor
@Observable
final class SessionStore {
    private(set) var activeSessionId: String?

    init(activeSessionId: String? = nil) {
        self.activeSessionId = activeSessionId
    }

    func newSession() {
        activeSessionId = nil
    }

    func loadSession(sessionId: String) {
        activeSessionId = sessionId
    }
}
