import Foundation
import Testing
@testable import LaneShadow

@MainActor
struct ChatStoreReconciliationTests {
    @Test("test_chatStore_compose_appendsPendingTempIdSynchronously")
    func chatStore_compose_appendsPendingTempIdSynchronously() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()
        let store = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            transcript: transcript
        )

        let pendingMessage = store.appendPendingMessage(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        #expect(pendingMessage.id.hasPrefix("temp-"))
        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == pendingMessage.id)
        #expect(store.transcript.messages.first?.state == .pending)
    }

    @Test("test_chatStore_emission_reconcilesTempIntoServerId")
    func chatStore_emission_reconcilesTempIntoServerId() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()
        let store = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            transcript: transcript
        )

        let pendingMessage = store.appendPendingMessage(
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
            createdAt: pendingTimestamp.addingTimeInterval(3).timeIntervalSince1970 * 1000,
            kind: "planning",
            status: "complete",
            attachments: nil,
            thinkingSteps: nil
        )

        store.reconcileSessionMessage(serverMessage)
        store.reconcileSessionMessage(serverMessage)

        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == "message-123")
        #expect(store.transcript.messages.first?.state == .complete)
        #expect(store.transcript.messages.first?.retryable == false)
        #expect(store.transcript.messages.first?.id != pendingMessage.id)
    }

    @Test("test_chatStore_mismatchedSession_doesNotReconcile")
    func chatStore_mismatchedSession_doesNotReconcile() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()
        let store = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            transcript: transcript
        )

        let pendingMessage = store.appendPendingMessage(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        let wrongSessionMessage = LaneShadowSessionMessage(
            id: "message-999",
            sessionId: "session-999",
            role: "user",
            content: "Find a scenic route",
            createdAt: pendingTimestamp.addingTimeInterval(2).timeIntervalSince1970 * 1000,
            kind: "planning",
            status: "complete",
            attachments: nil,
            thinkingSteps: nil
        )

        store.reconcileSessionMessage(wrongSessionMessage)

        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == pendingMessage.id)
        #expect(store.transcript.messages.first?.sessionId == "session-123")
    }

    @Test("test_chatStore_streamingAssistant_exposesStreamingState")
    func chatStore_streamingAssistant_exposesStreamingState() {
        let transcript = ChatTranscript()
        let store = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            transcript: transcript
        )

        let streamingMessage = LaneShadowSessionMessage(
            id: "message-123",
            sessionId: "session-123",
            role: "system",
            content: "Reading your request",
            createdAt: 1_700_000_001_000,
            kind: "planning",
            status: "streaming",
            attachments: nil,
            thinkingSteps: nil
        )

        store.reconcileSessionMessage(streamingMessage)

        #expect(store.messages.count == 1)
        #expect(store.messages.first?.status == .streaming)
        #expect(store.messages.first?.retryable == false)
    }

    @Test("test_chatStore_sendFailure_marksPendingFailed")
    func chatStore_sendFailure_marksPendingFailed() {
        let pendingTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let transcript = ChatTranscript()
        let store = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            transcript: transcript
        )

        let pendingMessage = store.appendPendingMessage(
            sessionId: "session-123",
            content: "Find a scenic route",
            role: .rider,
            timestamp: pendingTimestamp
        )

        store.markMessageFailed(
            id: pendingMessage.id,
            errorCode: "server",
            retryable: true
        )

        #expect(store.transcript.messages.count == 1)
        #expect(store.transcript.messages.first?.id == pendingMessage.id)
        #expect(store.transcript.messages.first?.state == .failed)
        #expect(store.transcript.messages.first?.retryable == true)
        #expect(store.transcript.messages.first?.errorCode == "server")
        #expect(store.messages.first?.status == .failed)
        #expect(store.messages.first?.retryable == true)
        #expect(store.messages.first?.errorCode == "server")
    }

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

    @Test("test_chatStore_cancelActivePlan_invokesCancelPlanMutation")
    func chatStore_cancelActivePlan_invokesCancelPlanMutation() async {
        let planId = "plan-123"
        let planningState = PlanningState(sessionId: "session-123", planId: planId)
        let initialFlowState: RideFlowPhase = .planning(planningState)
        let store = ChatStore(flowState: initialFlowState)

        var cancelPlanMutationCalled = false
        var capturedPlanId: String?

        await store.cancelActivePlan { planId in
            cancelPlanMutationCalled = true
            capturedPlanId = planId
        }

        #expect(cancelPlanMutationCalled)
        #expect(capturedPlanId == planId)
        // After .cancelPlanning is dispatched, the flowState transitions to idle
        #expect(store.flowState.phase == .idle)
    }
}
