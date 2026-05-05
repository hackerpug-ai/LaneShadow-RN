import Foundation
import Observation

@MainActor
@Observable
final class IdleViewModel {
    var greetingDisplayName: String = "rider"
    var greetingScope: GreetingScope = .today
    var metaRow: String = ""
    var weatherSummary: CurrentWeatherSummary?
    var weatherAdvisory: WeatherAdvisory?
    var favoriteLocations: [FavoriteLocation] = []
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

        // Determine greeting scope based on current hour
        let hour = Calendar.current.component(.hour, from: Date())
        greetingScope = GreetingScope.from(hour: hour)

        observationTasks = [
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await currentUser in convexClient.subscribeToCurrentUser() {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        // Extract firstName by splitting on first whitespace
                        let displayName = currentUser?.displayName ?? "rider"
                        if let firstName = displayName.components(separatedBy: .whitespaces).first {
                            greetingDisplayName = firstName.isEmpty ? "rider" : firstName
                        } else {
                            greetingDisplayName = "rider"
                        }
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
            Task { [weak self, convexClient] in
                guard let self else { return }
                // Default Santa Cruz coordinates
                let lat = 36.97
                let lng = -122.03
                do {
                    let weather = try await convexClient.fetchCurrentWeather(lat: lat, lng: lng)
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        weatherSummary = weather
                        // Compose metaRow from weather data
                        metaRow = "\(weather.dayOfWeek) · \(weather.tempF)°F · \(weather.condition.uppercased())"
                        // Set weather advisory if severity is advisory or warning
                        if weather.severity == .advisory || weather.severity == .warning {
                            weatherAdvisory = WeatherAdvisory(
                                label: weather.severity.rawValue.uppercased(),
                                body: "Weather conditions may affect your ride."
                            )
                        } else {
                            weatherAdvisory = nil
                        }
                    }
                } catch {
                    NSLog("❌ IDLE_VM: fetchCurrentWeather failed \(error.localizedDescription)")
                }
            },
            Task { [weak self, convexClient] in
                guard let self else { return }
                for await favorites in convexClient.subscribeToFavoriteLocations() {
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        favoriteLocations = favorites
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
