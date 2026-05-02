import Foundation
import Observation

struct RouteResultsPolylineState: Equatable {
    let routeId: String
    let coordinates: [LatLng]
    let colorTokenPath: String
    let mapVariant: RouteVariant
    let isSelected: Bool
    let strokeWidth: StrokeSize
    let lineDasharray: [Double]?
}

struct RouteResultsViewState: Equatable {
    let screenState: RouteResultsScreenState
    let routePolylines: [RouteResultsPolylineState]
    let isLoading: Bool
    let error: LaneShadowError?
    let errorMessage: String?
    let isEmptyState: Bool
}

@MainActor
@Observable
final class RouteResultsViewModel {
    private static let visibleRouteLimit = 3
    private static let routeColorTokenPaths = [
        lsMapSignalDefaultColorTokenPath,
        lsMapSignalWhisperColorTokenPath,
        lsMapSignalTouringColorTokenPath,
    ]

    var isLoading = false
    var error: LaneShadowError?

    private let chatStore: ChatStore
    @ObservationIgnored private let sessionStore: SessionStore
    @ObservationIgnored private let convexClient: any LaneShadowPlanningDataProviding
    @ObservationIgnored private var routePlanObservationTask: Task<Void, Never>?
    @ObservationIgnored private var activeRoutePlanId: String?

    init(
        chatStore: ChatStore,
        sessionStore: SessionStore,
        convexClient: any LaneShadowPlanningDataProviding
    ) {
        self.chatStore = chatStore
        self.sessionStore = sessionStore
        self.convexClient = convexClient
    }

    var viewState: RouteResultsViewState {
        let flowState = chatStore.flowState
        let screenState = Self.makeScreenState(from: flowState)

        return RouteResultsViewState(
            screenState: screenState,
            routePolylines: Self.makeRoutePolylines(from: flowState),
            isLoading: isLoading,
            error: error,
            errorMessage: error?.localizedDescription,
            isEmptyState: screenState.routes.isEmpty
        )
    }

    func observe() async {
        guard let routePlanId = currentRoutePlanId else {
            stopObserving()
            return
        }

        startObservingRoutePlan(routePlanId)
        await refreshRoutePlan(routePlanId)
    }

    func stopObserving() {
        routePlanObservationTask?.cancel()
        routePlanObservationTask = nil
        activeRoutePlanId = nil
        isLoading = false
    }

    func handleRouteCardTap(_ routeId: String) {
        guard case let .routeResults(state) = chatStore.flowState else {
            return
        }

        guard state.selectedRouteId != routeId else {
            return
        }

        chatStore.dispatch(
            .loadSession(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: routeId
            )
        )
    }

    private var currentRoutePlanId: String? {
        guard case let .routeResults(state) = chatStore.flowState else {
            return nil
        }

        return state.routeOptions.planId
    }

    private func startObservingRoutePlan(_ routePlanId: String) {
        guard activeRoutePlanId != routePlanId else {
            return
        }

        activeRoutePlanId = routePlanId
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

                    if Task.isCancelled {
                        return
                    }
                }
            } catch {
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    handleRoutePlanFetchFailure(error)
                }
            }
        }
    }

    private func refreshRoutePlan(_ routePlanId: String) async {
        isLoading = true
        error = nil

        do {
            let routePlan = try await convexClient.fetchRoutePlan(routePlanId: routePlanId)
            handleRoutePlanSnapshot(routePlan)
        } catch {
            handleRoutePlanFetchFailure(error)
        }
    }

    private func handleRoutePlanSnapshot(_ routePlan: LaneShadowRoutePlanSnapshot) {
        guard case let .routeResults(state) = chatStore.flowState else {
            isLoading = false
            return
        }

        switch routePlan.status {
        case "completed":
            guard let routeOptions = routePlan.routeOptions else {
                handleRoutePlanFetchFailure(
                    LaneShadowError.internalError(
                        routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning results unavailable"
                    )
                )
                return
            }

            let selectedRouteId = state.selectedRouteId ?? routeOptions.options.first?.routeOptionId
            chatStore.dispatch(
                .loadSession(
                    sessionId: state.sessionId,
                    routeOptions: routeOptions,
                    selectedRouteId: selectedRouteId
                )
            )
            isLoading = false
            error = nil
        case "pending", "running":
            isLoading = true
        case "failed":
            handleRoutePlanFetchFailure(
                LaneShadowError.internalError(
                    routePlan.errorMessage ?? routePlan.statusMessage ?? "Planning failed"
                )
            )
        default:
            break
        }
    }

    private func handleRoutePlanFetchFailure(_ error: Error) {
        if let laneShadowError = error as? LaneShadowError {
            self.error = laneShadowError
        } else {
            self.error = LaneShadowError.map(error)
        }
        isLoading = false
    }

    private static func makeScreenState(from flowState: RideFlowPhase) -> RouteResultsScreenState {
        guard case let .routeResults(state) = flowState else {
            return emptyScreenState()
        }

        let routeOptions = state.routeOptions
        let selectedRouteId = state.selectedRouteId ?? routeOptions.options.first?.routeOptionId
        let routes = makeRoutes(from: routeOptions, selectedRouteId: selectedRouteId)
        let routePolylines = makeRoutePolylines(from: flowState)
        let message = makeNavigatorMessage(
            from: routeOptions,
            routes: routes,
            selectedRouteId: selectedRouteId
        )

        return RouteResultsScreenState(
            message: message,
            routes: routes,
            selectedRouteId: selectedRouteId,
            routePolylines: routePolylines.map(\.screenPolyline)
        )
    }

    private static func makeRoutePolylines(from flowState: RideFlowPhase) -> [RouteResultsPolylineState] {
        guard case let .routeResults(state) = flowState else {
            return []
        }

        let selectedRouteId = state.selectedRouteId ?? state.routeOptions.options.first?.routeOptionId

        return Array(state.routeOptions.options.prefix(Self.visibleRouteLimit)).enumerated().map { index, option in
            let routeId = option.routeOptionId
            let isSelected = routeId == selectedRouteId

            return RouteResultsPolylineState(
                routeId: routeId,
                coordinates: decodeCoordinates(
                    from: option.map.overviewGeometry.value,
                    precision: option.map.overviewGeometry.precision
                ),
                colorTokenPath: routeColorTokenPath(for: index),
                mapVariant: routeVariant(for: index),
                isSelected: isSelected,
                strokeWidth: isSelected ? .lg : .md,
                lineDasharray: isSelected ? nil : lsMapPolylineDasharray
            )
        }
    }

    private static func makeRoutes(
        from routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String?
    ) -> [Route] {
        Array(routeOptions.options.prefix(visibleRouteLimit)).enumerated().map { index, option in
            let routeId = option.routeOptionId
            let selected = routeId == selectedRouteId

            return Route(
                id: routeId,
                name: option.label,
                via: option.rationale,
                distance: option.stats.distanceMeters,
                estimatedTime: option.stats.durationSeconds,
                climb: max(0, option.stats.legsCount * 850),
                scenicScore: scenicScore(for: option, selected: selected),
                difficulty: difficultyLabel(for: option, index: index),
                polyline: option.map.overviewGeometry.value,
                variant: routeVariantLabel(for: index)
            )
        }
    }

    private static func makeNavigatorMessage(
        from routeOptions: PlannedRouteOptionsView,
        routes: [Route],
        selectedRouteId: String?
    ) -> NavigatorMessage {
        let attachments = routeAttachments(
            from: routeOptions.options,
            routes: routes,
            selectedRouteId: selectedRouteId
        )

        let body = if let firstRoute = routes.first {
            "Found \(routes.count) great routes for your ride. \(firstRoute.name) is ready to review."
        } else {
            "Couldn't find any routes matching your criteria."
        }

        return NavigatorMessage(
            id: "route-results-message-\(routeOptions.planId)",
            sessionId: routeOptions.planId,
            body: body,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            kind: routes.isEmpty ? "error" : "response",
            attachments: attachments.isEmpty ? nil : attachments,
            detail: routeOptions.includedFavorites?.first.map { "Includes your favorite: \($0)" }
                ?? routeOptions.excludedFavorites?.first.map { "Excluded: \($0)" }
                ?? "All routes updated from live plan data.",
            pinned: true
        )
    }

    private static func routeAttachments(
        from options: [PlannedRouteOptionView],
        routes: [Route],
        selectedRouteId: String?
    ) -> [RouteAttachment] {
        Array(options.prefix(visibleRouteLimit)).enumerated().compactMap { index, option in
            guard routes.indices.contains(index) else {
                return nil
            }

            let weather = option.overlaysPreview
            let weatherSummary = WeatherSummary(
                condition: weather.conditionsStatus,
                label: weather.temperatureSummary
            )

            return RouteAttachment(
                routeId: option.routeOptionId,
                variant: routeVariantLabel(for: index),
                isBest: index == 0,
                weather: weatherSummary,
                scenic: scenicScore(for: option, selected: option.routeOptionId == selectedRouteId),
                includesFavorite: option.includedFavorites?.isEmpty == false,
                includesFavoriteLabel: option.favorites
            )
        }
    }

    private static func emptyScreenState() -> RouteResultsScreenState {
        RouteResultsScreenState(
            message: NavigatorMessage(
                id: "route-results-empty",
                sessionId: "route-results-empty",
                body: "No route results are available yet.",
                timestamp: ISO8601DateFormatter().string(from: Date()),
                kind: "error",
                attachments: nil,
                detail: "Try adjusting your route preferences.",
                pinned: false
            ),
            routes: [],
            selectedRouteId: nil
        )
    }

    private static func scenicScore(
        for option: PlannedRouteOptionView,
        selected: Bool
    ) -> Int {
        let base = min(max(option.stats.legsCount + 2, 1), 5)
        return selected ? min(base + 1, 5) : base
    }

    private static func difficultyLabel(
        for option: PlannedRouteOptionView,
        index: Int
    ) -> String {
        let legs = option.stats.legsCount

        if index == 0 || legs >= 3 {
            return "advanced"
        }

        if option.stats.distanceMeters > 50000 {
            return "moderate"
        }

        return "easy"
    }

    private static func routeVariantLabel(for index: Int) -> String {
        switch index {
        case 0:
            "best"
        case 1:
            "alt1"
        default:
            "alt2"
        }
    }

    private static func routeVariant(for index: Int) -> RouteVariant {
        switch index {
        case 0:
            .best
        case 1:
            .alt1
        default:
            .alt2
        }
    }

    private static func routeColorTokenPath(for index: Int) -> String {
        routeColorTokenPaths[min(index, routeColorTokenPaths.count - 1)]
    }

    private static func decodeCoordinates(
        from encodedPolyline: String,
        precision: Double
    ) -> [LatLng] {
        decodePolyline(encodedPolyline, precision: precision)
    }

    private static func decodePolyline(
        _ encodedPolyline: String,
        precision: Double
    ) -> [LatLng] {
        guard !encodedPolyline.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }

        let factor = pow(10.0, precision)
        let bytes = Array(encodedPolyline.utf8)
        var index = 0
        var latitude = 0
        var longitude = 0
        var coordinates: [LatLng] = []

        func decodeValue() -> Int? {
            var result = 0
            var shift = 0

            while index < bytes.count {
                let byte = Int(bytes[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5

                if byte < 0x20 {
                    return (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
                }
            }

            return nil
        }

        while index < bytes.count {
            guard let deltaLat = decodeValue(),
                  let deltaLon = decodeValue()
            else {
                return []
            }

            latitude += deltaLat
            longitude += deltaLon

            coordinates.append(
                LatLng(
                    lat: Double(latitude) / factor,
                    lon: Double(longitude) / factor
                )
            )
        }

        return coordinates.count >= 2 ? coordinates : []
    }
}

private extension RouteResultsPolylineState {
    var screenPolyline: PolylineData {
        PolylineData(
            coordinates: coordinates,
            variant: mapVariant,
            strokeWidth: strokeWidth,
            lineDasharray: lineDasharray
        )
    }
}
