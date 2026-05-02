import Foundation
import Observation

struct PlanningScreenLiveState {
    var messages: [LSChatMessage]
    var phases: [PlanningPhase]
    var errorMessage: String?
    var isThinking: Bool
    var shouldRenderMap: Bool
}

@MainActor
@Observable
final class PlanningViewModel {
    var messages: [LSChatMessage] = []
    var phases: [PlanningPhase] = []
    var errorMessage: String?
    var isThinking = false
    var shouldRenderMap = true

    @ObservationIgnored private let chatStore: ChatStore
    @ObservationIgnored private let sessionStore: SessionStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private var activeRoutePlanId: String?
    @ObservationIgnored private var didDispatchTerminalState = false
    @ObservationIgnored private var observationTasks: [Task<Void, Never>] = []

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
        phases = Self.makePhases(activeIndex: 0)
    }

    var screenState: PlanningScreenLiveState {
        PlanningScreenLiveState(
            messages: messages,
            phases: phases,
            errorMessage: errorMessage,
            isThinking: isThinking,
            shouldRenderMap: shouldRenderMap
        )
    }

    func observe() async {
        guard let sessionId = chatStore.flowState.sessionId ?? sessionStore.activeSessionId else {
            return
        }

        startObserving(sessionId: sessionId)
    }

    func stopObserving() {
        observationTasks.forEach { $0.cancel() }
        observationTasks.removeAll()
    }

    private func startObserving(sessionId: String) {
        stopObserving()
        let convexClient = convexClient

        observationTasks = [
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await rawMessages in convexClient.subscribeToSessionMessages(
                    sessionId: sessionId,
                    limit: 100
                ) {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        updateMessages(rawMessages)
                    }
                }
            },
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await routePlans in convexClient.subscribeToActiveRoutePlans(
                    sessionId: sessionId
                ) {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        updateRoutePlans(routePlans)
                    }
                }
            },
        ]
    }

    func cancelPlanning() async {
        do {
            if let activeRoutePlanId {
                try await convexClient.cancelRoutePlan(routePlanId: activeRoutePlanId)
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        chatStore.dispatch(.cancelPlanning)
    }

    private func updateMessages(_ rawMessages: [LaneShadowSessionMessage]) {
        messages = rawMessages.map(Self.convertMessage(_:))
        isThinking = rawMessages.contains {
            $0.status == "streaming" || $0.status == "running"
        }

        let activeIndex = Self.phaseIndex(from: rawMessages)
        phases = Self.makePhases(activeIndex: activeIndex)
    }

    private func updateRoutePlans(_ routePlans: [LaneShadowRoutePlanSnapshot]) {
        guard !didDispatchTerminalState else {
            return
        }

        if let activePlan = routePlans.first(where: {
            $0.status == "pending" || $0.status == "running"
        }) {
            activeRoutePlanId = activePlan.id
        }

        if let completedPlan = routePlans.first(where: { $0.status == "completed" }),
           let routeOptions = completedPlan.routeOptions,
           !routeOptions.options.isEmpty
        {
            didDispatchTerminalState = true
            isThinking = false
            phases = Self.makePhases(activeIndex: Self.finalizingPhaseIndex)
            chatStore.dispatch(.planningSuccess(routeOptions))
            return
        }

        if let failedPlan = routePlans.first(where: { $0.status == "failed" }) {
            didDispatchTerminalState = true
            isThinking = false
            errorMessage = failedPlan.errorMessage ?? failedPlan.statusMessage ?? "Planning failed"
            chatStore.dispatch(.planningError(errorMessage ?? "Planning failed"))
        }
    }

    private static func convertMessage(_ message: LaneShadowSessionMessage) -> LSChatMessage {
        let content = planningDisplayText(for: message)
        let status = lsChatMessageStatus(from: message.status)

        return LSChatMessage(
            id: message.id,
            role: message.role == "rider" ? .rider : .agent,
            content: content,
            timestamp: Date(timeIntervalSince1970: message.createdAt / 1000),
            status: status,
            kind: nil,
            routeAttachments: nil,
            attachments: nil,
            thinkingSteps: nil
        )
    }

    private static func planningDisplayText(for message: LaneShadowSessionMessage) -> String {
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

    private static func phaseIndex(from rawMessages: [LaneShadowSessionMessage]) -> Int {
        guard let latestPlanningMessage = rawMessages.last(where: {
            $0.role != "rider"
        }) else {
            return 0
        }

        if latestPlanningMessage.status == "complete" {
            return finalizingPhaseIndex
        }

        let statusLine = planningDisplayText(for: latestPlanningMessage).lowercased()
        if statusLine.contains("final") || statusLine.contains("done") {
            return finalizingPhaseIndex
        }
        if statusLine.contains("enrich") || statusLine.contains("weather") || statusLine.contains("condition") {
            return 3
        }
        if statusLine.contains("draft") || statusLine.contains("build") || statusLine.contains("plan") {
            return 2
        }
        if statusLine.contains("search") || statusLine.contains("look") || statusLine.contains("find") {
            return 1
        }
        if statusLine.contains("parse") || statusLine.contains("read") || statusLine.contains("analy") {
            return 0
        }
        return 0
    }

    private static func makePhases(activeIndex: Int) -> [PlanningPhase] {
        phaseLabels.enumerated().map { index, label in
            let state: PhaseState = if index < activeIndex {
                .done
            } else if index == activeIndex {
                .active
            } else {
                .pending
            }

            return PlanningPhase(
                id: label.lowercased(),
                label: label,
                state: state
            )
        }
    }

    private static func lsChatMessageStatus(from status: String?) -> LSChatMessageStatus {
        switch status {
        case "streaming":
            .streaming
        case "running":
            .running
        case "failed":
            .failed
        default:
            .complete
        }
    }

    private static let phaseLabels = [
        "Parsing",
        "Searching",
        "Drafting",
        "Enriching",
        "Finalizing",
    ]

    private static let finalizingPhaseIndex = phaseLabels.count - 1
}

private struct PlanningContentPayload: Decodable {
    let statusLine: String
    let thinkingText: String?
}
