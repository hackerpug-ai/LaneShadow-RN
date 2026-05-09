import Foundation

@MainActor
extension PlanningViewModel {
    func submitRefinement(_ message: String) async {
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedMessage.isEmpty else {
            return
        }

        guard let sessionId = resolvedSessionId else {
            errorMessage = "Planning session not ready"
            return
        }

        guard !isSending else {
            return
        }

        appState?.cachedLastFailedInput = trimmedMessage
        errorMessage = nil
        isSending = true
        let revision = beginSendRevision()
        chatStore.dispatch(.sendMessageWithSession(trimmedMessage, sessionId: sessionId))
        let pendingMessage = chatStore.appendPendingMessage(
            sessionId: sessionId,
            content: trimmedMessage,
            role: .rider
        )

        do {
            _ = try await convexClient.sendPlanningMessage(
                sessionId: sessionId,
                content: trimmedMessage,
                currentLocation: nil
            )
            guard isCurrentSend(revision) else {
                return
            }
        } catch {
            guard isCurrentSend(revision) else {
                return
            }

            let planningError = normalizedPlanningError(from: error)
            let metadata = planningFailureMetadata(for: planningError)
            chatStore.markMessageFailed(
                id: pendingMessage.id,
                errorCode: metadata.errorCode,
                retryable: metadata.retryable
            )
            errorMessage = planningError.errorDescription
            chatStore.dispatch(.planningError(planningError.rawMessage))
        }

        guard isCurrentSend(revision) else {
            return
        }

        isSending = false
        activeSendRevision = nil
    }

    func retryPending(id: String) async {
        guard !isSending else {
            return
        }

        guard let pendingMessage = chatStore.retryPendingMessage(id: id) else {
            return
        }

        let sessionId = pendingMessage.sessionId
        errorMessage = nil
        isSending = true
        let revision = beginSendRevision()
        chatStore.dispatch(.sendMessageWithSession(pendingMessage.content, sessionId: sessionId))

        do {
            _ = try await convexClient.sendPlanningMessage(
                sessionId: sessionId,
                content: pendingMessage.content,
                currentLocation: nil
            )
            guard isCurrentSend(revision) else {
                return
            }
        } catch {
            guard isCurrentSend(revision) else {
                return
            }

            let planningError = normalizedPlanningError(from: error)
            let metadata = planningFailureMetadata(for: planningError)
            chatStore.markMessageFailed(
                id: pendingMessage.id,
                errorCode: metadata.errorCode,
                retryable: metadata.retryable
            )
            errorMessage = planningError.errorDescription
        }

        guard isCurrentSend(revision) else {
            return
        }

        isSending = false
        activeSendRevision = nil
    }
}
