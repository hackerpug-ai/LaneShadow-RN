import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ChatTranscriptTests {
    @Test("test_appendPending_generatesTempId_and_reconcile_replacesPendingWithoutDuplicate")
    func appendPendingGeneratesTempIdAndReconcileReplacesPendingWithoutDuplicate() {
        let transcript = ChatTranscript()
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)

        let pendingMessage = transcript.appendPending(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        #expect(pendingMessage.id.hasPrefix("temp-"))
        #expect(transcript.messages.count == 1)
        #expect(transcript.messages.first?.id == pendingMessage.id)
        #expect(transcript.messages.first?.state == .pending)

        let serverMessage = LaneShadowSessionMessage(
            id: "message-123",
            sessionId: "session-123",
            role: "user",
            content: "Find a scenic route",
            createdAt: pendingTimestamp.addingTimeInterval(3).timeIntervalSince1970 * 1000,
            kind: "planning",
            status: "complete",
            attachments: nil,
            thinkingSteps: nil
        )

        transcript.reconcile(serverMessage)
        transcript.reconcile(serverMessage)

        #expect(transcript.messages.count == 1)
        #expect(transcript.messages.first?.id == "message-123")
        #expect(transcript.messages.first?.state == .complete)
        #expect(transcript.messages.first?.retryable == false)
    }

    @Test("test_reconcile_outsideTolerance_keepsPendingAndConfirmedSeparate")
    func reconcileOutsideToleranceKeepsPendingAndConfirmedSeparate() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()

        let pendingMessage = transcript.appendPending(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        let serverMessage = LaneShadowSessionMessage(
            id: "message-123",
            sessionId: "session-123",
            role: "user",
            content: "Find a scenic route",
            createdAt: pendingTimestamp.addingTimeInterval(6).timeIntervalSince1970 * 1000,
            kind: "planning",
            status: "complete",
            attachments: nil,
            thinkingSteps: nil
        )

        transcript.reconcile(serverMessage)

        #expect(transcript.messages.count == 2)
        #expect(transcript.messages.contains(where: { $0.id == pendingMessage.id && $0.state == .pending }))
        #expect(transcript.messages.contains(where: { $0.id == "message-123" && $0.state == .complete }))
    }

    @Test("test_markFailed_and_retryPending_replacesFailedMessageWithFreshTempId")
    func markFailedAndRetryPendingReplacesFailedMessageWithFreshTempId() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let retryTimestamp = pendingTimestamp.addingTimeInterval(8)
        let transcript = ChatTranscript(timestampProvider: { retryTimestamp })

        let pendingMessage = transcript.appendPending(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        transcript.markFailed(id: pendingMessage.id)

        #expect(transcript.messages.count == 1)
        #expect(transcript.messages.first?.id == pendingMessage.id)
        #expect(transcript.messages.first?.state == .failed)
        #expect(transcript.messages.first?.retryable == true)

        let retriedMessage = transcript.retryPending(id: pendingMessage.id)

        #expect(retriedMessage?.id.hasPrefix("temp-") == true)
        #expect(retriedMessage?.id != pendingMessage.id)
        #expect(transcript.messages.count == 1)
        #expect(transcript.messages.first?.id == retriedMessage?.id)
        #expect(transcript.messages.first?.state == .pending)
        #expect(transcript.messages.first?.retryable == false)
    }
}
