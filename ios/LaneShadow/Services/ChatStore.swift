import Foundation
import Observation

@MainActor
@Observable
final class ChatStore {
    private(set) var flowState: RideFlowPhase
    private(set) var transcript: ChatTranscript

    private let sessionStore: SessionStore
    private let dependencies: RideFlowDependencies
    @ObservationIgnored private var currentTranscriptSessionId: String?

    init(
        initialState: RideFlowPhase = initialState,
        sessionStore: SessionStore = SessionStore(),
        dependencies: RideFlowDependencies = .live,
        transcript: ChatTranscript = ChatTranscript()
    ) {
        flowState = initialState
        self.transcript = transcript
        self.sessionStore = sessionStore
        self.dependencies = dependencies
        syncSessionStore(for: initialState)
    }

    convenience init(
        flowState: RideFlowPhase,
        sessionStore: SessionStore = SessionStore(),
        dependencies: RideFlowDependencies = .live,
        transcript: ChatTranscript = ChatTranscript()
    ) {
        self.init(
            initialState: flowState,
            sessionStore: sessionStore,
            dependencies: dependencies,
            transcript: transcript
        )
    }

    func dispatch(_ action: RideFlowAction) {
        flowState = reduce(flowState, action, dependencies: dependencies)
        syncSessionStore(for: flowState)
    }

    var messages: [LSChatMessage] {
        transcript.uiMessages
    }

    @discardableResult
    func appendPendingMessage(
        sessionId: String,
        content: String,
        role: LSChatMessageRole,
        timestamp: Date? = nil
    ) -> ChatTranscript.Message {
        transcript.appendPending(
            sessionId: sessionId,
            content: content,
            role: role,
            timestamp: timestamp
        )
    }

    func reconcileSessionMessage(_ message: LaneShadowSessionMessage) {
        guard let currentTranscriptSessionId else {
            transcript.reconcile(message)
            return
        }

        transcript.reconcile(message, activeSessionId: currentTranscriptSessionId)
    }

    func reconcileSessionMessages(_ messages: [LaneShadowSessionMessage]) {
        guard let currentTranscriptSessionId else {
            transcript.reconcile(messages)
            return
        }

        transcript.reconcile(messages, activeSessionId: currentTranscriptSessionId)
    }

    func markMessageFailed(
        id: String,
        errorCode: String? = nil,
        retryable: Bool = true
    ) {
        transcript.markFailed(id: id, errorCode: errorCode, retryable: retryable)
    }

    @discardableResult
    func retryPendingMessage(id: String) -> ChatTranscript.Message? {
        transcript.retryPending(id: id)
    }

    func clearOptimisticMessages() {
        transcript.clearOptimisticMessages()
    }

    func cancelActivePlan(
        cancelPlanMutation: @escaping (String) async throws -> Void = { _ in }
    ) async {
        guard case let .planning(planningState) = flowState, let planId = planningState.planId
        else {
            return
        }

        do {
            try await cancelPlanMutation(planId)
        } catch {
            // Log error but still dispatch the cancel action
            // The error will be handled by the UI layer
        }

        dispatch(.cancelPlanning)
    }

    private func syncSessionStore(for state: RideFlowPhase) {
        guard let sessionId = state.sessionId else {
            sessionStore.newSession()
            currentTranscriptSessionId = nil
            return
        }

        if currentTranscriptSessionId != sessionId {
            currentTranscriptSessionId = sessionId
            transcript.reset()
        }

        sessionStore.loadSession(sessionId: sessionId)
    }
}
