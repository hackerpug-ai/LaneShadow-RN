import Foundation
import Observation

@MainActor
@Observable
final class IdleViewModel {
    var greetingDisplayName: String = "rider"
    var recentSessions: [Session] = []
    var suggestionLabels: [String] = [
        "Plan a scenic 2-hour ride",
        "Twisty back roads",
        "Half-day loop",
        "Mountain passes",
    ]
    var errorMessage: String?
    var isSubmitting = false

    @ObservationIgnored private let chatStore: ChatStore
    @ObservationIgnored private let sessionStore: SessionStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private let appState: AppState?
    @ObservationIgnored private let onSessionStarted: @MainActor @Sendable (String) -> Void
    @ObservationIgnored private var observationTasks: [Task<Void, Never>] = []

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding,
        appState: AppState? = nil,
        onSessionStarted: @escaping @MainActor @Sendable (String) -> Void = { _ in }
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
        self.appState = appState
        self.onSessionStarted = onSessionStarted
    }

    func observe() async {
        startObserving()
    }

    func stopObserving() {
        observationTasks.forEach { $0.cancel() }
        observationTasks.removeAll()
    }

    private func startObserving() {
        stopObserving()
        let convexClient = convexClient

        observationTasks = [
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await currentUser in convexClient.subscribeToCurrentUser() {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        greetingDisplayName = currentUser?.displayName ?? "rider"
                    }
                }
            },
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await sessions in convexClient.subscribeToSessions() {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        recentSessions = sessions
                    }
                }
            },
        ]
    }

    func submitSuggestion(_ message: String) async {
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedMessage.isEmpty else {
            return
        }

        appState?.cachedLastFailedInput = trimmedMessage
        errorMessage = nil
        isSubmitting = true

        let prefix = String(trimmedMessage.prefix(40))
        NSLog("🟡 IDLE_VM: createPlanningSession start firstMessage='\(prefix)'")

        do {
            let session = try await convexClient.createPlanningSession(firstMessage: trimmedMessage)
            NSLog("🟢 IDLE_VM: createPlanningSession ok sessionId=\(session.sessionId)")
            chatStore.dispatch(.sendMessageWithSession(trimmedMessage, sessionId: session.sessionId))
            NSLog("🟡 IDLE_VM: dispatched sendMessageWithSession")
            onSessionStarted(session.sessionId)
            NSLog("🟢 IDLE_VM: onSessionStarted called sessionId=\(session.sessionId)")

            let sessionId = session.sessionId
            let message = trimmedMessage
            Task { [convexClient] in
                do {
                    _ = try await convexClient.sendPlanningMessage(
                        sessionId: sessionId,
                        content: message,
                        currentLocation: nil
                    )
                } catch {
                    let laneShadowError = LaneShadowError.map(error)
                    NSLog("❌ IDLE_VM: sendPlanningMessage failed \(laneShadowError.localizedDescription)")
                    await MainActor.run { [weak self] in
                        self?.errorMessage = laneShadowError.localizedDescription
                        self?.chatStore.dispatch(.planningError(laneShadowError.rawMessage))
                    }
                }
            }
        } catch {
            NSLog("❌ IDLE_VM: createPlanningSession failed \(error.localizedDescription)")
            errorMessage = error.localizedDescription
        }

        isSubmitting = false
    }
}
