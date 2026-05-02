import Foundation
import Observation

private let chatTranscriptReconciliationTolerance: TimeInterval = 5

@MainActor
@Observable
final class ChatTranscript {
    enum State: Equatable {
        case pending
        case streaming
        case complete
        case failed
    }

    struct Message: Identifiable, Equatable {
        let id: String
        let sessionId: String
        let role: LSChatMessageRole
        let content: String
        let timestamp: Date
        let kind: String?
        let status: String?
        var state: State

        var retryable: Bool {
            state == .failed
        }

        var isOptimistic: Bool {
            state == .pending || state == .failed
        }
    }

    private(set) var messages: [Message] = []

    private let timestampProvider: @MainActor () -> Date

    init(timestampProvider: @escaping @MainActor () -> Date = Date.init) {
        self.timestampProvider = timestampProvider
    }

    @discardableResult
    func appendPending(
        sessionId: String,
        content: String,
        role: LSChatMessageRole,
        timestamp: Date? = nil
    ) -> Message {
        let timestamp = timestamp ?? timestampProvider()
        let message = Message(
            id: Self.tempId(for: timestamp),
            sessionId: sessionId,
            role: role,
            content: content,
            timestamp: timestamp,
            kind: nil,
            status: nil,
            state: .pending
        )

        messages.append(message)
        return message
    }

    func reconcile(_ serverMessage: LaneShadowSessionMessage) {
        let incoming = Message(
            id: serverMessage.id,
            sessionId: serverMessage.sessionId,
            role: chatTranscriptRole(from: serverMessage.role),
            content: serverMessage.content,
            timestamp: Date(timeIntervalSince1970: serverMessage.createdAt / 1000),
            kind: serverMessage.kind,
            status: serverMessage.status,
            state: chatTranscriptState(from: serverMessage.status)
        )

        if let existingIndex = messages.firstIndex(where: { $0.id == incoming.id }) {
            messages[existingIndex] = incoming
            return
        }

        if let optimisticIndex = messages.firstIndex(where: { existing in
            Self.matchesOptimisticMessage(existing, incoming)
        }) {
            messages[optimisticIndex] = incoming
            return
        }

        if incoming.role == .rider,
           messages.contains(where: { Self.matchesConfirmedMessage($0, incoming) }) {
            return
        }

        messages.append(incoming)
    }

    func reconcile(_ serverMessages: [LaneShadowSessionMessage]) {
        serverMessages
            .sorted(by: { $0.createdAt < $1.createdAt })
            .forEach(reconcile(_:))
    }

    func markFailed(id: String) {
        guard let index = messages.firstIndex(where: { $0.id == id }) else {
            return
        }

        messages[index].state = .failed
    }

    @discardableResult
    func retryPending(id: String) -> Message? {
        guard let index = messages.firstIndex(where: { $0.id == id }) else {
            return nil
        }

        let current = messages[index]
        guard current.state == .failed else {
            return nil
        }

        let timestamp = timestampProvider()
        let retried = Message(
            id: Self.tempId(for: timestamp),
            sessionId: current.sessionId,
            role: current.role,
            content: current.content,
            timestamp: timestamp,
            kind: current.kind,
            status: nil,
            state: .pending
        )

        messages[index] = retried
        return retried
    }

    func clearOptimisticMessages() {
        messages.removeAll { $0.isOptimistic }
    }

    func reset() {
        messages.removeAll()
    }

    var uiMessages: [LSChatMessage] {
        messages.map { message in
            LSChatMessage(
                id: message.id,
                role: message.role,
                content: Self.displayContent(for: message),
                timestamp: message.timestamp,
                status: Self.displayStatus(for: message),
                kind: Self.displayKind(for: message),
                routeAttachments: nil,
                attachments: nil,
                thinkingSteps: nil
            )
        }
    }

    private static func tempId(for timestamp: Date) -> String {
        let milliseconds = Int64(timestamp.timeIntervalSince1970 * 1000)
        return "temp-\(milliseconds)"
    }

    private static func matchesOptimisticMessage(
        _ pending: Message,
        _ confirmed: Message
    ) -> Bool {
        guard pending.isOptimistic,
              pending.role == .rider,
              confirmed.role == .rider
        else {
            return false
        }

        return pending.sessionId == confirmed.sessionId &&
            pending.content == confirmed.content &&
            abs(pending.timestamp.timeIntervalSince(confirmed.timestamp)) <= chatTranscriptReconciliationTolerance
    }

    private static func matchesConfirmedMessage(
        _ existing: Message,
        _ incoming: Message
    ) -> Bool {
        guard existing.role == .rider, incoming.role == .rider else {
            return false
        }

        return existing.sessionId == incoming.sessionId &&
            existing.content == incoming.content &&
            abs(existing.timestamp.timeIntervalSince(incoming.timestamp)) <= chatTranscriptReconciliationTolerance
    }

    private static func displayContent(for message: Message) -> String {
        guard message.kind == "planning",
              let payload = try? JSONDecoder().decode(
                  PlanningContentPayload.self,
                  from: Data(message.content.utf8)
              ),
              !payload.statusLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            return message.content
        }

        return payload.statusLine
    }

    private static func displayStatus(for message: Message) -> LSChatMessageStatus {
        if let status = message.status {
            switch status {
            case "streaming":
                return .streaming
            case "running":
                return .running
            case "failed":
                return .failed
            default:
                return .complete
            }
        }

        switch message.state {
        case .pending:
            return .running
        case .streaming:
            return .streaming
        case .complete:
            return .complete
        case .failed:
            return .failed
        }
    }

    private static func displayKind(for message: Message) -> LSChatMessageKind? {
        guard let kind = message.kind else {
            return nil
        }

        return LSChatMessageKind(rawValue: kind)
    }
}

internal func chatTranscriptRole(from serverRole: String) -> LSChatMessageRole {
    serverRole == "rider" || serverRole == "user" ? .rider : .agent
}

internal func chatTranscriptState(from status: String?) -> ChatTranscript.State {
    switch status {
    case "streaming", "running":
        .streaming
    case "failed":
        .failed
    default:
        .complete
    }
}

internal func planningDisplayText(for message: LaneShadowSessionMessage) -> String {
    guard message.kind == "planning",
          let payload = try? JSONDecoder().decode(
              PlanningContentPayload.self,
              from: Data(message.content.utf8)
          ),
          !payload.statusLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    else {
        return message.content
    }

    return payload.statusLine
}

private struct PlanningContentPayload: Decodable {
    let statusLine: String
    let thinkingText: String?
}
