import Testing
import XCTest
@testable import LaneShadow

@MainActor
struct SessionStoreTests {
    @Test("test_sessionStore_loadSession_andNewSession_updateActiveSessionId")
    func sessionStoreLoadSessionAndNewSessionUpdateActiveSessionId() {
        let store = SessionStore()

        #expect(store.activeSessionId == nil)

        store.loadSession(sessionId: "session-123")

        #expect(store.activeSessionId == "session-123")

        store.newSession()

        #expect(store.activeSessionId == nil)
    }
}
