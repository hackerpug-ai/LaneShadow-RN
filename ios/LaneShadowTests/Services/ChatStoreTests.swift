import Foundation
import Observation
import Testing
import XCTest
@testable import LaneShadow

@MainActor
struct ChatStoreTests {
    @Test("test_chatStore_dispatch_updatesFlowState_andSessionStore")
    func chatStoreDispatchUpdatesFlowStateAndSessionStore() {
        final class ObservationChangeTracker: @unchecked Sendable {
            var didEmitChange = false
        }

        let sessionStore = SessionStore()
        let fixedTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let store = ChatStore(
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "session-123" },
                makeTimestamp: { fixedTimestamp }
            )
        )

        let tracker = ObservationChangeTracker()
        withObservationTracking {
            _ = store.flowState
        } onChange: {
            tracker.didEmitChange = true
        }

        store.dispatch(.sendMessage("plan a ride"))

        #expect(tracker.didEmitChange)
        #expect(store.flowState.phase == .planning)
        #expect(store.flowState.sessionId == "session-123")
        #expect(store.flowState.currentPhase == "analyzing")
        #expect(sessionStore.activeSessionId == "session-123")
    }
}
