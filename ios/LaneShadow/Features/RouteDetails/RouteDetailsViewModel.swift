import Foundation
import Observation

struct RouteDetailsViewState {
    let routeTitle: String
    let distanceKm: String
    let durationFormatted: String
    let elevationM: String
    let scenicScore: String
    let weatherEntries: [WeatherEntry]
    let isSaved: Bool
    let isPendingEnrichment: Bool
    let error: LaneShadowError?
    let polylines: [PolylineData]
    let isBest: Bool
    let timeRange: (String, String)
}

@MainActor
@Observable
final class RouteDetailsViewModel {
    var error: LaneShadowError?
    var weatherEntries: [WeatherEntry] = []
    var isSaved: Bool = false
    var isPendingEnrichment: Bool = false
    var elevation: String = "0"
    var scenicScorePercentage: String = "0"
    var presentingSaveFavoriteSheet: Bool = false

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

        // Decode polyline from selected route option
        let polylines = decodePolylines(from: selectedRoute)

        // Determine isBest: First option is best
        let isBest = isSelectedRouteBest()

        // Format timeRange: Placeholder for now (enrichment timestamps not yet available)
        let timeRange = ("", "")

        return RouteDetailsViewState(
            routeTitle: routeTitle,
            distanceKm: distanceKm,
            durationFormatted: durationFormatted,
            elevationM: elevation,
            scenicScore: scenicScorePercentage,
            weatherEntries: weatherEntries,
            isSaved: isSaved,
            isPendingEnrichment: isPendingEnrichment,
            error: error,
            polylines: polylines,
            isBest: isBest,
            timeRange: timeRange
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
        presentingSaveFavoriteSheet = true
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
            elevation = "0"
            return
        }

        // Parse enrichments into WeatherEntry objects
        let entries = (enrichmentsDoc.enrichments ?? []).compactMap { enrichment in
            mapEnrichmentToWeatherEntry(enrichment)
        }.prefix(6).map { $0 }

        weatherEntries = entries

        // Extract elevation from the first enrichment entry
        if let firstEnrichment = enrichmentsDoc.enrichments?.first {
            elevation = firstEnrichment.elevation ?? "0"
        }

        // Calculate scenic score: (legsCount + 3.3) / 5 * 100 as a percentage
        if let stats = selectedOption?.stats {
            let scenicRating = Double(stats.legsCount) + 3.3
            let percentage = Int(min(max(scenicRating / 5.0 * 100, 0), 100))
            scenicScorePercentage = String(percentage)
        }
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

    func decodePolylines(from option: PlannedRouteOptionView?) -> [PolylineData] {
        guard let option else { return [] }

        // Extract encoded polyline from route option's overviewGeometry
        let encodedPolyline = option.map.overviewGeometry.value
        guard !encodedPolyline.isEmpty else { return [] }

        // Convert precision from Double (e.g., 1e-6) to exponent (e.g., 6)
        // precision = 1e-N means we need exponent N
        let precisionExponent = if option.map.overviewGeometry.precision < 0.0001 {
            6 // 1e-6
        } else if option.map.overviewGeometry.precision < 0.001 {
            5 // 1e-5
        } else {
            5 // default
        }

        // Decode the polyline
        let coordinates = PolylineDecoder.decode(encodedPolyline, precision: precisionExponent)
        guard !coordinates.isEmpty else { return [] }

        // Determine variant: if best, use .best; otherwise use .alt1
        let variant: RouteVariant = isSelectedRouteBest() ? .best : .alt1

        return [
            PolylineData(
                coordinates: coordinates,
                variant: variant,
                strokeWidth: .lg
            ),
        ]
    }

    func isSelectedRouteBest() -> Bool {
        guard case let .routeDetails(state) = chatStore.flowState else {
            return false
        }

        // First option is considered the best
        return state.routeOptions.options.first?.routeOptionId == state.selectedRouteId
    }
}
