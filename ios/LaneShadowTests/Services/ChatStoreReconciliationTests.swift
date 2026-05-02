import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ChatStoreReconciliationTests {
    @Test("test_clearOptimisticMessages_removesPendingAndFailedButKeepsConfirmed")
    func clearOptimisticMessagesRemovesPendingAndFailedButKeepsConfirmed() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()
        let store = ChatStore(transcript: transcript)

        let pendingMessage = store.appendPendingMessage(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )
        store.markMessageFailed(id: pendingMessage.id)

        let confirmedMessage = LaneShadowSessionMessage(
            id: "message-123",
            sessionId: "session-123",
            role: "system",
            content: "Reading your request",
            createdAt: pendingTimestamp.addingTimeInterval(1).timeIntervalSince1970 * 1000,
            kind: "planning",
            status: "streaming",
            attachments: nil,
            thinkingSteps: nil
        )
        store.reconcileSessionMessage(confirmedMessage)
        store.clearOptimisticMessages()

        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == "message-123")
        #expect(store.transcript.messages.first?.state == .streaming)
    }

    @Test("test_retryPending_replacesFailedMessageWithFreshTempId")
    func retryPendingReplacesFailedMessageWithFreshTempId() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let retryTimestamp = pendingTimestamp.addingTimeInterval(8)
        let transcript = ChatTranscript(timestampProvider: { retryTimestamp })
        let store = ChatStore(transcript: transcript)

        let pendingMessage = store.appendPendingMessage(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )
        store.markMessageFailed(id: pendingMessage.id)

        let retriedMessage = store.retryPendingMessage(id: pendingMessage.id)

        #expect(retriedMessage?.id.hasPrefix("temp-") == true)
        #expect(retriedMessage?.id != pendingMessage.id)
        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == retriedMessage?.id)
        #expect(store.transcript.messages.first?.state == .pending)
        #expect(store.transcript.messages.first?.retryable == false)
    }
}
