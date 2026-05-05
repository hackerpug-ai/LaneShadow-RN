import CoreLocation
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
    var locationLabel: String?
    var isLocationEnabled = false
    var locationUnavailable = false

    @ObservationIgnored private let chatStore: ChatStore
    @ObservationIgnored private let sessionStore: SessionStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private let locationService: LocationService
    @ObservationIgnored private let appState: AppState?
    @ObservationIgnored private let onSessionStarted: @MainActor @Sendable (String) -> Void
    @ObservationIgnored private var observationTasks: [Task<Void, Never>] = []

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding,
        locationService: LocationService = LocationService(),
        appState: AppState? = nil,
        onSessionStarted: @escaping @MainActor @Sendable (String) -> Void = { _ in }
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
        self.locationService = locationService
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
            observeCurrentUser(convexClient: convexClient),
            observeSessions(convexClient: convexClient),
            observeFavoriteLocations(convexClient: convexClient),
            observeLocation(locationService: locationService, convexClient: convexClient),
        ]
    }

    private func observeCurrentUser(convexClient: any LaneShadowPlanningDataProviding) -> Task<Void, Never> {
        Task { [weak self] in
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
        }
    }

    private func observeSessions(convexClient: any LaneShadowPlanningDataProviding) -> Task<Void, Never> {
        Task { [weak self] in
            guard let self else { return }
            for await sessions in convexClient.subscribeToSessions() {
                if Task.isCancelled {
                    return
                }
                await MainActor.run {
                    recentSessions = sessions
                }
            }
        }
    }

    private func observeFavoriteLocations(convexClient: any LaneShadowPlanningDataProviding) -> Task<Void, Never> {
        Task { [weak self] in
            guard let self else { return }
            for await favorites in convexClient.subscribeToFavoriteLocations() {
                if Task.isCancelled {
                    return
                }
                await MainActor.run {
                    favoriteLocations = favorites
                }
            }
        }
    }

    private func observeLocation(
        locationService: LocationService,
        convexClient: any LaneShadowPlanningDataProviding
    ) -> Task<Void, Never> {
        Task { [weak self] in
            guard let self else { return }

            // Request location authorization
            locationService.requestWhenInUseAuthorization()

            // Wait for location to be available
            let locationStream = AsyncStream<CLLocation?> { continuation in
                let initialLocation = locationService.currentLocation
                continuation.yield(initialLocation)

                // Observe location changes
                let observationTask = Task { [weak locationService] in
                    guard let locationService else { return }
                    var lastLocation = initialLocation
                    while !Task.isCancelled {
                        try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
                        let currentLocation = locationService.currentLocation
                        if currentLocation?.coordinate.latitude != lastLocation?.coordinate.latitude ||
                            currentLocation?.coordinate.longitude != lastLocation?.coordinate.longitude
                        {
                            lastLocation = currentLocation
                            continuation.yield(currentLocation)
                        }
                    }
                }

                continuation.onTermination = { _ in
                    observationTask.cancel()
                }
            }

            for await location in locationStream {
                if Task.isCancelled {
                    return
                }

                guard let location else {
                    continue
                }

                // Reverse geocode the location
                do {
                    let label = try await convexClient.reverseGeocode(
                        lat: location.coordinate.latitude,
                        lng: location.coordinate.longitude
                    )
                    if Task.isCancelled {
                        return
                    }
                    await MainActor.run {
                        locationLabel = label
                        isLocationEnabled = true
                        locationUnavailable = false
                    }
                } catch {
                    NSLog("❌ IDLE_VM: reverseGeocode failed \(error.localizedDescription)")
                    await MainActor.run {
                        locationLabel = nil
                        isLocationEnabled = false
                        locationUnavailable = true
                    }
                }

                await fetchWeather(
                    lat: location.coordinate.latitude,
                    lng: location.coordinate.longitude,
                    convexClient: convexClient
                )
            }
        }
    }

    private func fetchWeather(
        lat: Double,
        lng: Double,
        convexClient: any LaneShadowPlanningDataProviding
    ) async {
        do {
            let weather = try await convexClient.fetchCurrentWeather(lat: lat, lng: lng)
            if Task.isCancelled {
                return
            }

            await MainActor.run {
                weatherSummary = weather
                metaRow = "\(weather.dayOfWeek.uppercased()) · \(weather.tempF)°F · \(weather.condition.uppercased())"

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
