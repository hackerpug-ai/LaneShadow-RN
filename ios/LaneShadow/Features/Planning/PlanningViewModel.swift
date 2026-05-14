import Foundation
import Observation

@MainActor
@Observable
final class PlanningViewModel {
    var phaseSteps: [LSPhaseIndicator.Phase] = []
    var capsuleHeadline: String
    var cancelConfirmationVisible = false
    var errorMessage: String?
    var isThinking = false
    var isSending = false
    var shouldRenderMap = true

    let chatStore: ChatStore
    @ObservationIgnored let sessionStore: SessionStore
    @ObservationIgnored let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored let fallbackSessionId: String?
    @ObservationIgnored let appState: AppState?
    @ObservationIgnored var activeRoutePlanId: String?
    @ObservationIgnored var didDispatchTerminalState = false
    @ObservationIgnored var routePlanObservationTask: Task<Void, Never>?
    @ObservationIgnored var observationTasks: [Task<Void, Never>] = []
    @ObservationIgnored var activeSendRevision: Int?
    @ObservationIgnored var sendRevisionCounter = 0

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding,
        fallbackSessionId: String? = nil,
        appState: AppState? = nil
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
        self.fallbackSessionId = fallbackSessionId
        self.appState = appState
        let initialPhase = PlanningPhase.parsing
        phaseSteps = PlanningPhase.indicatorSteps(activePhase: initialPhase)
        capsuleHeadline = initialPhase.capsuleHeadline
    }

    var screenState: PlanningScreenLiveState {
        PlanningScreenLiveState(
            messages: messages,
            phases: phaseSteps,
            errorMessage: errorMessage,
            isThinking: isThinking,
            isSending: isSending,
            shouldRenderMap: shouldRenderMap,
            capsuleHeadline: capsuleHeadline
        )
    }

    var phases: [LSPhaseIndicator.Phase] {
        phaseSteps
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
        requestCancelConfirmation()
        await confirmCancellation()
    }

    func requestCancelConfirmation() {
        cancelConfirmationVisible = true
    }

    func dismissCancelConfirmation() {
        cancelConfirmationVisible = false
    }

    func confirmCancellation() async {
        cancelConfirmationVisible = false
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

    private func updateMessages(_ rawMessages: [LaneShadowSessionMessage]) {
        chatStore.reconcileSessionMessages(rawMessages)
        isThinking = rawMessages.contains {
            $0.status == "streaming" || $0.status == "running"
        }

        let activePhase = PlanningPhase.latest(in: rawMessages)
        phaseSteps = PlanningPhase.indicatorSteps(activePhase: activePhase)
        capsuleHeadline = activePhase.capsuleHeadline

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
                let laneShadowError = LaneShadowError.map(error)
                await MainActor.run {
                    dispatchRoutePlanFailure(
                        laneShadowError.localizedDescription,
                        rawMessage: laneShadowError.rawMessage
                    )
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
                let message = routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning results unavailable"
                dispatchRoutePlanFailure(message, rawMessage: message)
            }
        case "failed":
            let message = routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning failed"
            dispatchRoutePlanFailure(message, rawMessage: message)
        case "pending", "running":
            activeRoutePlanId = routePlan.id
        default:
            break
        }
    }

    private func dispatchRoutePlanFailure(_ message: String, rawMessage: String? = nil) {
        didDispatchTerminalState = true
        isThinking = false
        errorMessage = message
        chatStore.dispatch(.planningError(rawMessage ?? message))
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

    var resolvedSessionId: String? {
        chatStore.flowState.sessionId ?? sessionStore.activeSessionId ?? fallbackSessionId
    }
}

extension PlanningViewModel {
    func beginSendRevision() -> Int {
        sendRevisionCounter += 1
        activeSendRevision = sendRevisionCounter
        return sendRevisionCounter
    }

    func isCurrentSend(_ revision: Int) -> Bool {
        activeSendRevision == revision
    }

    func normalizedPlanningError(from error: Error) -> LaneShadowError {
        (error as? LaneShadowError) ?? LaneShadowError.map(error)
    }

    func planningFailureMetadata(for error: LaneShadowError) -> (errorCode: String, retryable: Bool) {
        switch error {
        case .unauthenticated:
            (errorCode: "unauthenticated", retryable: false)
        case .convex:
            (errorCode: "convex", retryable: true)
        case .server:
            (errorCode: "server", retryable: true)
        case .internalError:
            (errorCode: "internal", retryable: true)
        case .unknown:
            (errorCode: "unknown", retryable: true)
        default:
            // Most planning-related errors are transient and retryable
            (errorCode: error.rawMessage, retryable: true)
        }
    }
}
