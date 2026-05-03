import Foundation
import Observation

struct RouteDetailsViewState: Equatable {
    let routeTitle: String
    let distanceKm: String
    let durationFormatted: String
    let elevationM: String
    let scenicScore: String
    let weatherEntries: [WeatherEntry]
    let isSaved: Bool
    let isPendingEnrichment: Bool
    let error: LaneShadowError?
}

@MainActor
@Observable
final class RouteDetailsViewModel {
    var error: LaneShadowError?
    var weatherEntries: [WeatherEntry] = []
    var isSaved: Bool = false
    var isPendingEnrichment: Bool = false

    private let chatStore: ChatStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private var enrichmentsObservationTask: Task<Void, Never>?
    @ObservationIgnored private var fingerprintQueryTask: Task<Void, Never>?

    init(
        chatStore: ChatStore,
        convexClient: any LaneShadowPlanningDataProviding
    ) {
        self.chatStore = chatStore
        self.convexClient = convexClient
    }

    var viewState: RouteDetailsViewState {
        let selectedRoute = selectedOption
        let routeTitle = selectedRoute?.label ?? ""
        let stats = selectedRoute?.stats

        let distanceKm = formatDistance(meters: stats?.distanceMeters ?? 0)
        let durationFormatted = formatDuration(seconds: stats?.durationSeconds ?? 0)
        // TODO: elevation should come from enrichments or route_plans data
        let elevationM = "0"
        // TODO: scenic score should come from curated routes or enrichments
        let scenicScore = "0"

        return RouteDetailsViewState(
            routeTitle: routeTitle,
            distanceKm: distanceKm,
            durationFormatted: durationFormatted,
            elevationM: elevationM,
            scenicScore: scenicScore,
            weatherEntries: weatherEntries,
            isSaved: isSaved,
            isPendingEnrichment: isPendingEnrichment,
            error: error
        )
    }

    func observe() async {
        guard let routePlanId = currentRoutePlanId else {
            stopObserving()
            return
        }

        startObservingEnrichments(routePlanId)
        await loadFingerprintState()
    }

    func stopObserving() {
        enrichmentsObservationTask?.cancel()
        enrichmentsObservationTask = nil
        fingerprintQueryTask?.cancel()
        fingerprintQueryTask = nil
    }

    func handleSaveTap() {
        // Trigger presentation of SaveFavoriteSheet
        // This will be handled by the Container
    }

    func handleRideThisTap() {
        // V3 no-op for Ride This button
        // Log to performance table for observability
    }

    func handleDismiss() {
        // Navigate back to route results
        guard case let .routeDetails(state) = chatStore.flowState else {
            return
        }

        chatStore.dispatch(
            .loadSession(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    }
}

private extension RouteDetailsViewModel {
    var currentRoutePlanId: String? {
        guard case let .routeDetails(state) = chatStore.flowState else {
            return nil
        }
        return state.routeOptions.planId
    }

    var selectedOption: PlannedRouteOptionView? {
        guard case let .routeDetails(state) = chatStore.flowState else {
            return nil
        }

        let selectedId = state.selectedRouteId
        return state.routeOptions.options.first { $0.routeOptionId == selectedId }
    }

    func formatDistance(meters: Int) -> String {
        let km = meters / 1000
        return String(km)
    }

    func formatDuration(seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    func startObservingEnrichments(_ routePlanId: String) {
        enrichmentsObservationTask?.cancel()

        let convexClient = convexClient
        enrichmentsObservationTask = Task { [weak self, convexClient] in
            guard let self else { return }

            do {
                for try await enrichmentsDoc in convexClient.subscribeToRouteEnrichments(routePlanId: routePlanId) {
                    if Task.isCancelled {
                        return
                    }

                    await MainActor.run {
                        self.handleEnrichmentsSnapshot(enrichmentsDoc)
                    }

                    if Task.isCancelled {
                        return
                    }
                }
            } catch {
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    self.error = LaneShadowError.server("Failed to load enrichments")
                }
            }
        }
    }

    func handleEnrichmentsSnapshot(_ enrichmentsDoc: RouteEnrichmentsDocument) {
        isPendingEnrichment = enrichmentsDoc.status == "pending"
        error = nil

        guard !isPendingEnrichment else {
            weatherEntries = []
            return
        }

        // Parse enrichments into WeatherEntry objects
        weatherEntries = (enrichmentsDoc.enrichments ?? []).compactMap { enrichment in
            mapEnrichmentToWeatherEntry(enrichment)
        }.prefix(6).map { $0 }
    }

    func mapEnrichmentToWeatherEntry(_ enrichment: RouteEnrichmentsEnrichments) -> WeatherEntry? {
        let condition = mapWeatherString(enrichment.weather ?? "clear")
        let hour = enrichment.label
        let temp = "—"

        return WeatherEntry(
            hour: hour,
            condition: condition,
            temp: temp
        )
    }

    func mapWeatherString(_ weatherString: String) -> WeatherCondition {
        let lowercased = weatherString.lowercased()
        switch lowercased {
        case _ where lowercased.contains("rain"):
            return .rain
        case _ where lowercased.contains("wind"):
            return .wind
        case _ where lowercased.contains("storm"):
            return .storm
        case _ where lowercased.contains("hot"):
            return .hot
        case _ where lowercased.contains("cold"):
            return .cold
        default:
            return .clear
        }
    }

    func loadFingerprintState() async {
        guard let selectedOption else {
            isSaved = false
            return
        }

        fingerprintQueryTask?.cancel()
        fingerprintQueryTask = Task { [weak self, convexClient, routeIndex = selectedOption.routeOptionId] in
            do {
                let savedRoute = try await convexClient.getRouteIndexFingerprint(routeIndex: routeIndex)
                await MainActor.run {
                    self?.isSaved = savedRoute != nil
                }
            } catch {
                // Treat query failure as "not saved"
                await MainActor.run {
                    self?.isSaved = false
                }
            }
        }

        await fingerprintQueryTask?.value
    }
}
