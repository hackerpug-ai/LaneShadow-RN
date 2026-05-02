import Foundation
import Observation

struct PlanningScreenLiveState {
    var messages: [LSChatMessage]
    var phases: [PlanningPhase]
    var errorMessage: String?
    var isThinking: Bool
    var isSending: Bool
    var shouldRenderMap: Bool
}

@MainActor
@Observable
final class PlanningViewModel {
    var phases: [PlanningPhase] = []
    var errorMessage: String?
    var isThinking = false
    var isSending = false
    var shouldRenderMap = true

    private let chatStore: ChatStore
    @ObservationIgnored private let sessionStore: SessionStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private let fallbackSessionId: String?
    @ObservationIgnored private var activeRoutePlanId: String?
    @ObservationIgnored private var didDispatchTerminalState = false
    @ObservationIgnored private var routePlanObservationTask: Task<Void, Never>?
    @ObservationIgnored private var observationTasks: [Task<Void, Never>] = []
    @ObservationIgnored private var activeSendRevision: Int?
    @ObservationIgnored private var sendRevisionCounter = 0

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding,
        fallbackSessionId: String? = nil
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
        self.fallbackSessionId = fallbackSessionId
        phases = Self.makePhases(activeIndex: 0)
    }

    var screenState: PlanningScreenLiveState {
        PlanningScreenLiveState(
            messages: messages,
            phases: phases,
            errorMessage: errorMessage,
            isThinking: isThinking,
            isSending: isSending,
            shouldRenderMap: shouldRenderMap
        )
    }

    var messages: [LSChatMessage] {
        chatStore.messages
    }

    func observe() async {
        guard let sessionId = resolvedSessionId else {
            return
        }

        startObserving(sessionId: sessionId)
    }

    func stopObserving() {
        observationTasks.forEach { $0.cancel() }
        observationTasks.removeAll()
        routePlanObservationTask?.cancel()
        routePlanObservationTask = nil
    }

    private func startObserving(sessionId: String) {
        stopObserving()
        let convexClient = convexClient
        didDispatchTerminalState = false
        activeRoutePlanId = nil

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
        activeSendRevision = nil
        isSending = false
        isThinking = false
        errorMessage = nil
        chatStore.clearOptimisticMessages()

        do {
            if let activeRoutePlanId {
                try await convexClient.cancelRoutePlan(routePlanId: activeRoutePlanId)
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        activeRoutePlanId = nil
        chatStore.dispatch(.cancelPlanning)
    }

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

            chatStore.markMessageFailed(id: pendingMessage.id)
            errorMessage = error.localizedDescription
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

            chatStore.markMessageFailed(id: pendingMessage.id)
            errorMessage = error.localizedDescription
        }

        guard isCurrentSend(revision) else {
            return
        }

        isSending = false
        activeSendRevision = nil
    }

    private func updateMessages(_ rawMessages: [LaneShadowSessionMessage]) {
        chatStore.reconcileSessionMessages(rawMessages)
        isThinking = rawMessages.contains {
            $0.status == "streaming" || $0.status == "running"
        }

        let activeIndex = Self.phaseIndex(from: rawMessages)
        phases = Self.makePhases(activeIndex: activeIndex)

        if let routePlanId = Self.routePlanId(from: rawMessages) {
            startObservingRoutePlan(routePlanId)
        }
    }

    private func updateRoutePlans(_ routePlans: [LaneShadowRoutePlanSnapshot]) {
        guard !didDispatchTerminalState else {
            return
        }

        if let activePlan = routePlans.first(where: {
            $0.status == "pending" || $0.status == "running"
        }) {
            startObservingRoutePlan(activePlan.id)
        }

        if let failedPlan = routePlans.first(where: { $0.status == "failed" }) {
            dispatchRoutePlanFailure(
                failedPlan.errorMessage ?? failedPlan.statusMessage ?? "Planning failed"
            )
        }
    }

    private func startObservingRoutePlan(_ routePlanId: String) {
        guard activeRoutePlanId != routePlanId else {
            return
        }

        activeRoutePlanId = routePlanId
        didDispatchTerminalState = false
        routePlanObservationTask?.cancel()

        let convexClient = convexClient
        routePlanObservationTask = Task { [weak self, convexClient] in
            guard let self else { return }
            do {
                for try await routePlan in convexClient.subscribeToRoutePlan(routePlanId: routePlanId) {
                    if Task.isCancelled {
                        return
                    }

                    await MainActor.run {
                        handleRoutePlanSnapshot(routePlan)
                    }

                    if await MainActor.run(body: { didDispatchTerminalState }) {
                        return
                    }
                }
            } catch {
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    dispatchRoutePlanFailure(LaneShadowError.map(error).localizedDescription)
                }
            }
        }
    }

    private func handleRoutePlanSnapshot(_ routePlan: LaneShadowRoutePlanSnapshot) {
        guard !didDispatchTerminalState else {
            return
        }

        switch routePlan.status {
        case "completed":
            if let routeOptions = routePlan.routeOptions, !routeOptions.options.isEmpty {
                didDispatchTerminalState = true
                isThinking = false
                errorMessage = nil
                chatStore.dispatch(.planningSuccess(routeOptions))
            } else {
                dispatchRoutePlanFailure(
                    routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning results unavailable"
                )
            }
        case "failed":
            dispatchRoutePlanFailure(
                routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning failed"
            )
        case "pending", "running":
            activeRoutePlanId = routePlan.id
        default:
            break
        }
    }

    private func dispatchRoutePlanFailure(_ message: String) {
        didDispatchTerminalState = true
        isThinking = false
        errorMessage = message
        chatStore.dispatch(.planningError(message))
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

    private static func routePlanId(from rawMessages: [LaneShadowSessionMessage]) -> String? {
        for message in rawMessages.reversed() {
            guard let attachments = message.attachments else {
                continue
            }

            if let routePlanId = attachments.first(where: { $0.type == "route_options" })?.routePlanId {
                return routePlanId
            }
        }

        return nil
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

    private static let phaseLabels = [
        "Parsing",
        "Searching",
        "Drafting",
        "Enriching",
        "Finalizing",
    ]

    private static let finalizingPhaseIndex = phaseLabels.count - 1

    private var resolvedSessionId: String? {
        chatStore.flowState.sessionId ?? sessionStore.activeSessionId ?? fallbackSessionId
    }

    private func beginSendRevision() -> Int {
        sendRevisionCounter += 1
        activeSendRevision = sendRevisionCounter
        return sendRevisionCounter
    }

    private func isCurrentSend(_ revision: Int) -> Bool {
        activeSendRevision == revision
    }
}
