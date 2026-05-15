import CoreLocation
import Foundation
import Observation

// swiftlint:disable file_length type_body_length

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
    /// Monotonically increments each time CoreLocation yields a real fix (independent
    /// of reverseGeocode outcome). Idle view observes this to recenter the map once
    /// when the count transitions from 0 → 1 on cold start.
    var locationFixCount: Int = 0
    var placeAutocompleteSuggestions: [LaneShadowPlaceSuggestion] = []
    var placeAutocompleteErrorMessage: String?
    var isPlaceAutocompleteLoading = false
    var selectedPlace: LaneShadowSelectedPlace?
    var autocompletePrimedInputValue: String?
    var isAutocompleteQueryActive = false

    var showsStaticRideSuggestions: Bool {
        !isAutocompleteQueryActive
    }

    var topBarTitle: String {
        if weatherAdvisory != nil {
            return "Not the prettiest day for it."
        }

        if locationUnavailable || locationLabel == nil {
            return "Where are we starting from?"
        }

        if recentSessions.isEmpty && favoriteLocations.isEmpty {
            return "First ride? Ask me anything."
        }

        let scopeWord = greetingScope == .today ? "today" : "tonight"
        return "Where are we riding \(scopeWord), \(greetingDisplayName)?"
    }

    var topBarHeadline: AttributedString {
        switch capsuleState {
        case let .idle(headline, _):
            headline
        case let .planning(headline):
            AttributedString(headline)
        case let .route(name, _):
            name
        }
    }

    var topBarMetaText: String? {
        switch capsuleState {
        case let .idle(_, metaItems):
            metaItems.isEmpty ? nil : metaItems.joined(separator: " · ")
        case .planning, .route:
            nil
        }
    }

    var locationBadge: LocationContext? {
        if let selectedPlace {
            return LocationContext(label: selectedPlace.label, mode: .manual)
        }

        guard let locationLabel, !locationUnavailable else {
            return nil
        }

        return LocationContext(label: locationLabel, mode: isLocationEnabled ? .auto : .manual)
    }

    var chatPlaceholder: String {
        guard let locationLabel = locationBadge?.label, !locationLabel.isEmpty else {
            return "Plan a ride…"
        }

        return "Plan a ride from \(locationLabel)…"
    }

    var capsuleState: LSContextCapsule.CapsuleState {
        // Check if weather advisory (warning case)
        if weatherAdvisory != nil {
            var headline = AttributedString("Not the ")
            var prettiesPart = AttributedString("prettiest")
            var attrs = AttributeContainer()
            attrs.inlinePresentationIntent = .emphasized
            prettiesPart.setAttributes(attrs)
            headline.append(prettiesPart)
            headline.append(AttributedString(" day for it."))

            // Build meta items from metaRow (parse "DAY · TEMP°F · CONDITION · PRECIP")
            let metaItems = metaRow.split(separator: "·").map { String($0).trimmingCharacters(in: .whitespaces) }

            return .idle(headline: headline, metaItems: metaItems)
        }

        // Check if location is unavailable
        if locationUnavailable || locationLabel == nil {
            var headline = AttributedString("Where are we ")
            var startingPart = AttributedString("starting")
            var attrs = AttributeContainer()
            attrs.inlinePresentationIntent = .emphasized
            startingPart.setAttributes(attrs)
            headline.append(startingPart)
            headline.append(AttributedString(" from?"))
            return .idle(headline: headline, metaItems: [])
        }

        // Check if first ride (no recent sessions and no favorite locations)
        if recentSessions.isEmpty && favoriteLocations.isEmpty {
            var headline = AttributedString("First ride? ")
            var askPart = AttributedString("Ask")
            var attrs = AttributeContainer()
            attrs.inlinePresentationIntent = .emphasized
            askPart.setAttributes(attrs)
            headline.append(askPart)
            headline.append(AttributedString(" me anything."))
            return .idle(headline: headline, metaItems: [])
        }

        // Default case: show scope + name
        let scopeWord = greetingScope == .today ? "today" : "tonight"
        var headline = AttributedString("Where are we riding ")
        var scopePart = AttributedString(scopeWord)
        var attrs = AttributeContainer()
        attrs.inlinePresentationIntent = .emphasized
        scopePart.setAttributes(attrs)
        headline.append(scopePart)
        headline.append(AttributedString(", \(greetingDisplayName)?"))

        // Build meta items from metaRow (parse "DAY · TEMP°F · CONDITION")
        let metaItems = metaRow.split(separator: "·").map { String($0).trimmingCharacters(in: .whitespaces) }

        return .idle(headline: headline, metaItems: metaItems)
    }

    @ObservationIgnored let chatStore: ChatStore
    @ObservationIgnored let sessionStore: SessionStore
    @ObservationIgnored let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private let locationService: LocationService
    @ObservationIgnored let appState: AppState?
    @ObservationIgnored private let onSessionStarted: @MainActor @Sendable (String) -> Void
    @ObservationIgnored private var observationTasks: [Task<Void, Never>] = []
    @ObservationIgnored private var autocompleteTask: Task<Void, Never>?
    @ObservationIgnored private var autocompleteRequestRevision = 0
    @ObservationIgnored private var autocompleteSessionToken = UUID().uuidString
    @ObservationIgnored private var hasActiveAutocompleteSession = false

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
        autocompleteTask?.cancel()
        autocompleteTask = nil
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

                await MainActor.run {
                    locationFixCount += 1
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

    func startNewSession() {
        resetAutocompleteState(clearSession: true)
        selectedPlace = nil
        autocompletePrimedInputValue = nil
        errorMessage = nil
        isSubmitting = false
        appState?.cachedLastFailedInput = nil
        chatStore.dispatch(.newSession)
    }

    func loadSession(sessionId: String) {
        sessionStore.loadSession(sessionId: sessionId)
        onSessionStarted(sessionId)
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

    func updateChatInputQuery(_ value: String) {
        let query = normalizedAutocompleteQuery(from: value)

        if let selectedPlace, query != selectedPlace.label {
            self.selectedPlace = nil
        }

        if let selectedPlace, query == selectedPlace.label {
            resetAutocompleteState(clearSession: true)
            return
        }

        guard query.count >= 2 else {
            resetAutocompleteState(clearSession: true)
            return
        }

        guard let proximity = currentAutocompleteProximity else {
            // Block place-suggest until CoreLocation returns a real fix. Surface
            // a locating affordance via the existing loading flag + a placeholder
            // error message so LSChatInput renders "Locating you…" instead of
            // either nothing or a stale global result.
            beginAutocompleteSessionIfNeeded()
            _ = nextAutocompleteRequestRevision()
            isAutocompleteQueryActive = true
            isPlaceAutocompleteLoading = true
            placeAutocompleteErrorMessage = "Locating you…"
            placeAutocompleteSuggestions = []
            autocompleteTask?.cancel()
            autocompleteTask = nil
            return
        }

        beginAutocompleteSessionIfNeeded()
        let revision = nextAutocompleteRequestRevision()
        let sessionToken = autocompleteSessionToken
        let convexClient = convexClient

        isAutocompleteQueryActive = true
        isPlaceAutocompleteLoading = true
        placeAutocompleteErrorMessage = nil
        placeAutocompleteSuggestions = []

        autocompleteTask?.cancel()
        autocompleteTask = Task { [weak self, convexClient] in
            do {
                try await Task.sleep(for: .milliseconds(300))
                if Task.isCancelled {
                    return
                }

                let suggestions = try await convexClient.suggestPlaces(
                    query: query,
                    proximity: proximity,
                    sessionToken: sessionToken
                )

                if Task.isCancelled {
                    return
                }

                await MainActor.run {
                    self?.applyAutocompleteSuggestions(suggestions, revision: revision)
                }
            } catch {
                if Task.isCancelled {
                    return
                }

                await MainActor.run {
                    self?.applyAutocompleteError(error, revision: revision)
                }
            }
        }
    }

    func selectPlaceSuggestion(_ suggestion: LaneShadowPlaceSuggestion) async {
        beginAutocompleteSessionIfNeeded()
        let revision = nextAutocompleteRequestRevision()
        let sessionToken = autocompleteSessionToken

        autocompleteTask?.cancel()
        autocompleteTask = nil
        isPlaceAutocompleteLoading = false
        placeAutocompleteErrorMessage = nil

        do {
            let place = try await convexClient.retrievePlace(
                mapboxId: suggestion.id,
                sessionToken: sessionToken
            )

            guard revision == autocompleteRequestRevision else {
                return
            }

            selectedPlace = place
            autocompletePrimedInputValue = place.label
            placeAutocompleteSuggestions = []
            placeAutocompleteErrorMessage = nil
            isPlaceAutocompleteLoading = false
            isAutocompleteQueryActive = false
            hasActiveAutocompleteSession = false
            autocompleteSessionToken = UUID().uuidString
        } catch {
            guard revision == autocompleteRequestRevision else {
                return
            }

            let laneShadowError = LaneShadowError.map(error)
            placeAutocompleteSuggestions = []
            placeAutocompleteErrorMessage = laneShadowError.localizedDescription
            isPlaceAutocompleteLoading = false
            isAutocompleteQueryActive = true
        }
    }

    func consumeAutocompletePrimedInputValue() {
        autocompletePrimedInputValue = nil
    }

    private func normalizedAutocompleteQuery(from value: String) -> String {
        value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
    }

    private var currentAutocompleteProximity: LaneShadowPlaceSearchProximity? {
        guard let location = locationService.currentLocation else {
            // Without a real user fix we deliberately do NOT bias autocomplete; an
            // earlier hardcoded Santa-Cruz fallback produced "global"-feeling results
            // for users outside the Bay Area on cold start.
            return nil
        }

        return LaneShadowPlaceSearchProximity(
            lat: location.coordinate.latitude,
            lng: location.coordinate.longitude
        )
    }

    private func beginAutocompleteSessionIfNeeded() {
        guard !hasActiveAutocompleteSession else {
            return
        }

        hasActiveAutocompleteSession = true
        autocompleteSessionToken = UUID().uuidString
    }

    private func nextAutocompleteRequestRevision() -> Int {
        autocompleteRequestRevision += 1
        return autocompleteRequestRevision
    }

    private func resetAutocompleteState(clearSession: Bool) {
        autocompleteTask?.cancel()
        autocompleteTask = nil
        autocompleteRequestRevision += 1
        placeAutocompleteSuggestions = []
        placeAutocompleteErrorMessage = nil
        isPlaceAutocompleteLoading = false
        isAutocompleteQueryActive = false

        if clearSession {
            hasActiveAutocompleteSession = false
            autocompleteSessionToken = UUID().uuidString
        }
    }

    private func applyAutocompleteSuggestions(
        _ suggestions: [LaneShadowPlaceSuggestion],
        revision: Int
    ) {
        guard revision == autocompleteRequestRevision else {
            return
        }

        placeAutocompleteSuggestions = Array(suggestions.prefix(3))
        placeAutocompleteErrorMessage = nil
        isPlaceAutocompleteLoading = false
        isAutocompleteQueryActive = true
    }

    private func applyAutocompleteError(_ error: Error, revision: Int) {
        guard revision == autocompleteRequestRevision else {
            return
        }

        let laneShadowError = LaneShadowError.map(error)
        placeAutocompleteSuggestions = []
        placeAutocompleteErrorMessage = laneShadowError.localizedDescription
        isPlaceAutocompleteLoading = false
        isAutocompleteQueryActive = true
    }
}

// swiftlint:enable file_length type_body_length
