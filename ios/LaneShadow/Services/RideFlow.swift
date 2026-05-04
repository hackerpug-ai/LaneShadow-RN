import Foundation

enum RideFlowPhaseKind: String, Equatable {
    case idle = "IDLE"
    case planning = "PLANNING"
    case routeResults = "ROUTE_RESULTS"
    case routeDetails = "ROUTE_DETAILS"
    case sessionHistory = "SESSION_HISTORY"
    case error = "ERROR"
    case navigationExport = "NAVIGATION_EXPORT"
}

/// Canonical phase taxonomy for conversational planning flow.
///
/// Matches server-side phase names: parsing, searching, drafting, enriching, finalizing.
enum Phase: String, Equatable, CaseIterable {
    case parsing = "parsing"
    case searching = "searching"
    case drafting = "drafting"
    case enriching = "enriching"
    case finalizing = "finalizing"

    /// Display label for UI
    var label: String {
        switch self {
        case .parsing: "Parsing your request"
        case .searching: "Searching routes"
        case .drafting: "Drafting options"
        case .enriching: "Enriching with details"
        case .finalizing: "Finalizing your routes"
        }
    }

    /// Initialize from backend status string
    /// - Parameter status: Backend status string (e.g., "parsing", "searching")
    /// - Returns: Matching Phase, or nil if status doesn't match canonical names
    init?(fromStatus status: String?) {
        guard let status else { return nil }
        self.init(rawValue: status.lowercased())
    }
}

struct PlannedRouteOptionBounds: Equatable, Codable {
    let north: Double
    let south: Double
    let east: Double
    let west: Double
}

struct PlannedRouteOptionGeometry: Equatable, Codable {
    let format: String
    let encoding: String
    let precision: Double
    let value: String
}

struct PlannedRouteOptionStats: Equatable, Codable {
    let distanceMeters: Int
    let durationSeconds: Int
    let legsCount: Int
}

struct PlannedRouteOptionMap: Equatable, Codable {
    let bounds: PlannedRouteOptionBounds
    let overviewGeometry: PlannedRouteOptionGeometry
    let legs: [String]
}

struct PlannedRouteOptionOverlaysPreview: Equatable, Codable {
    let windSummary: String
    let rainSummary: String
    let temperatureSummary: String
    let maxTemperatureF: Double?
    let conditionsStatus: String
}

struct PlannedRouteOptionView: Equatable, Codable {
    let routeOptionId: String
    let label: String
    let rationale: String
    let stats: PlannedRouteOptionStats
    let map: PlannedRouteOptionMap
    let overlaysPreview: PlannedRouteOptionOverlaysPreview
    let favorites: String?
    let enrichment: String?
    let includedFavorites: [String]?
    let excludedFavorites: [String]?

    init(
        routeOptionId: String,
        label: String,
        rationale: String,
        stats: PlannedRouteOptionStats,
        map: PlannedRouteOptionMap,
        overlaysPreview: PlannedRouteOptionOverlaysPreview,
        favorites: String? = nil,
        enrichment: String? = nil,
        includedFavorites: [String]? = nil,
        excludedFavorites: [String]? = nil
    ) {
        self.routeOptionId = routeOptionId
        self.label = label
        self.rationale = rationale
        self.stats = stats
        self.map = map
        self.overlaysPreview = overlaysPreview
        self.favorites = favorites
        self.enrichment = enrichment
        self.includedFavorites = includedFavorites
        self.excludedFavorites = excludedFavorites
    }
}

struct PlannedRouteOptionsView: Equatable, Codable {
    let planId: String
    let options: [PlannedRouteOptionView]
    let includedFavorites: [String]?
    let excludedFavorites: [String]?

    init(
        planId: String,
        options: [PlannedRouteOptionView],
        includedFavorites: [String]? = nil,
        excludedFavorites: [String]? = nil
    ) {
        self.planId = planId
        self.options = options
        self.includedFavorites = includedFavorites
        self.excludedFavorites = excludedFavorites
    }
}

struct IdleState: Equatable {
    var sessionId: String?
    var routeOptions: PlannedRouteOptionsView?
    var selectedRouteId: String?

    init(
        sessionId: String? = nil,
        routeOptions: PlannedRouteOptionsView? = nil,
        selectedRouteId: String? = nil
    ) {
        self.sessionId = sessionId
        self.routeOptions = routeOptions
        self.selectedRouteId = selectedRouteId
    }
}

struct PlanningState: Equatable {
    var sessionId: String
    var planId: String?
    var currentPhase: Phase?
    var routeOptions: PlannedRouteOptionsView?
    var selectedRouteId: String?

    init(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView? = nil,
        selectedRouteId: String? = nil,
        planId: String? = nil,
        currentPhase: Phase? = nil
    ) {
        self.sessionId = sessionId
        self.planId = planId
        self.currentPhase = currentPhase
        self.routeOptions = routeOptions
        self.selectedRouteId = selectedRouteId
    }
}

struct RouteResultsState: Equatable {
    var sessionId: String
    var routeOptions: PlannedRouteOptionsView
    var selectedRouteId: String?

    init(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String? = nil
    ) {
        self.sessionId = sessionId
        self.routeOptions = routeOptions
        self.selectedRouteId = selectedRouteId
    }
}

struct RouteDetailsState: Equatable {
    var sessionId: String
    var routeOptions: PlannedRouteOptionsView
    var selectedRouteId: String
}

struct SessionHistoryState: Equatable {
    var sessionId: String
    var routeOptions: PlannedRouteOptionsView
    var selectedRouteId: String?

    init(
        sessionId: String,
        routeOptions: PlannedRouteOptionsView,
        selectedRouteId: String? = nil
    ) {
        self.sessionId = sessionId
        self.routeOptions = routeOptions
        self.selectedRouteId = selectedRouteId
    }
}

struct ErrorState: Equatable {
    var errorMessage: String
    var sessionId: String?
    var errorTimestamp: Date

    init(errorMessage: String, sessionId: String? = nil, errorTimestamp: Date) {
        self.errorMessage = errorMessage
        self.sessionId = sessionId
        self.errorTimestamp = errorTimestamp
    }
}

struct NavigationExportState: Equatable {
    var sessionId: String
    var routeOptions: PlannedRouteOptionsView
    var selectedRouteId: String
}

enum RideFlowPhase: Equatable {
    case idle(IdleState)
    case planning(PlanningState)
    case routeResults(RouteResultsState)
    case routeDetails(RouteDetailsState)
    case sessionHistory(SessionHistoryState)
    case error(ErrorState)
    case navigationExport(NavigationExportState)

    var phase: RideFlowPhaseKind {
        switch self {
        case .idle:
            .idle
        case .planning:
            .planning
        case .routeResults:
            .routeResults
        case .routeDetails:
            .routeDetails
        case .sessionHistory:
            .sessionHistory
        case .error:
            .error
        case .navigationExport:
            .navigationExport
        }
    }

    var sessionId: String? {
        switch self {
        case let .idle(state):
            state.sessionId
        case let .planning(state):
            state.sessionId
        case let .routeResults(state):
            state.sessionId
        case let .routeDetails(state):
            state.sessionId
        case let .sessionHistory(state):
            state.sessionId
        case let .error(state):
            state.sessionId
        case let .navigationExport(state):
            state.sessionId
        }
    }

    var routeOptions: PlannedRouteOptionsView? {
        switch self {
        case let .idle(state):
            state.routeOptions
        case let .planning(state):
            state.routeOptions
        case let .routeResults(state):
            state.routeOptions
        case let .routeDetails(state):
            state.routeOptions
        case let .sessionHistory(state):
            state.routeOptions
        case .error:
            nil
        case let .navigationExport(state):
            state.routeOptions
        }
    }

    var selectedRouteId: String? {
        switch self {
        case let .idle(state):
            state.selectedRouteId
        case let .planning(state):
            state.selectedRouteId
        case let .routeResults(state):
            state.selectedRouteId
        case let .routeDetails(state):
            state.selectedRouteId
        case let .sessionHistory(state):
            state.selectedRouteId
        case .error:
            nil
        case let .navigationExport(state):
            state.selectedRouteId
        }
    }

    var currentPhase: Phase? {
        switch self {
        case let .planning(state):
            state.currentPhase
        default:
            nil
        }
    }

    var errorMessage: String? {
        switch self {
        case let .error(state):
            state.errorMessage
        default:
            nil
        }
    }

    var errorTimestamp: Date? {
        switch self {
        case let .error(state):
            state.errorTimestamp
        default:
            nil
        }
    }
}

enum RideFlowAction: Equatable {
    case sendMessage(String)
    case sendMessageWithSession(String, sessionId: String)
    case planningSuccess(PlannedRouteOptionsView)
    case planningError(String)
    case cancelPlanning
    case selectRoute(String)
    case viewHistory
    case closeHistory
    case navigateExport
    case closeExport
    case newSession
    case loadSession(sessionId: String, routeOptions: PlannedRouteOptionsView, selectedRouteId: String?)
    case clearError
}

struct RideFlowDependencies {
    let makeSessionId: @Sendable () -> String
    let makeTimestamp: @Sendable () -> Date

    static let live = RideFlowDependencies(
        makeSessionId: { "session-\(UUID().uuidString.lowercased())" },
        makeTimestamp: { Date() }
    )
}

let initialState = RideFlowPhase.idle(IdleState())

func reduce(
    _ state: RideFlowPhase,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies = .live
) -> RideFlowPhase {
    switch state {
    case let .idle(idleState):
        reduceIdle(idleState, action, dependencies: dependencies)
    case let .planning(planningState):
        reducePlanning(planningState, action, dependencies: dependencies)
    case let .routeResults(routeResultsState):
        reduceRouteResults(routeResultsState, action, dependencies: dependencies)
    case let .routeDetails(routeDetailsState):
        reduceRouteDetails(routeDetailsState, action, dependencies: dependencies)
    case let .sessionHistory(sessionHistoryState):
        reduceSessionHistory(sessionHistoryState, action, dependencies: dependencies)
    case let .error(errorState):
        reduceError(errorState, action, dependencies: dependencies)
    case let .navigationExport(navigationExportState):
        reduceNavigationExport(navigationExportState, action, dependencies: dependencies)
    }
}

func reduce(
    state: RideFlowPhase,
    action: RideFlowAction,
    dependencies: RideFlowDependencies = .live
) -> RideFlowPhase {
    reduce(state, action, dependencies: dependencies)
}

private func reduceIdle(
    _ state: IdleState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case let .sendMessage(content):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .idle(state)
        }

        return .planning(
            PlanningState(
                sessionId: dependencies.makeSessionId(),
                routeOptions: nil,
                selectedRouteId: nil
            )
        )
    case let .sendMessageWithSession(content, sessionId):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .idle(state)
        }

        return .planning(
            PlanningState(
                sessionId: sessionId,
                routeOptions: nil,
                selectedRouteId: nil
            )
        )
    case let .loadSession(sessionId, routeOptions, selectedRouteId):
        return .routeResults(
            RouteResultsState(
                sessionId: sessionId,
                routeOptions: routeOptions,
                selectedRouteId: selectedRouteId
            )
        )
    case .newSession:
        return initialState
    default:
        return .idle(state)
    }
}

private func reducePlanning(
    _ state: PlanningState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case let .planningSuccess(routeOptions):
        let selectedRouteId = routeOptions.options.first?.routeOptionId
        return .routeResults(
            RouteResultsState(
                sessionId: state.sessionId,
                routeOptions: routeOptions,
                selectedRouteId: selectedRouteId
            )
        )
    case let .sendMessageWithSession(content, sessionId):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .planning(state)
        }

        return .planning(
            PlanningState(
                sessionId: sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId,
                planId: state.planId,
                currentPhase: state.currentPhase
            )
        )
    case let .planningError(errorMessage):
        return .error(
            ErrorState(
                errorMessage: errorMessage,
                sessionId: state.sessionId,
                errorTimestamp: dependencies.makeTimestamp()
            )
        )
    case .cancelPlanning:
        if let routeOptions = state.routeOptions {
            return .routeResults(
                RouteResultsState(
                    sessionId: state.sessionId,
                    routeOptions: routeOptions,
                    selectedRouteId: state.selectedRouteId
                )
            )
        }
        return initialState
    case .newSession:
        return initialState
    default:
        return .planning(state)
    }
}

private func reduceRouteResults(
    _ state: RouteResultsState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case let .sendMessage(content):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .routeResults(state)
        }

        return .planning(
            PlanningState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case let .sendMessageWithSession(content, sessionId):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .routeResults(state)
        }

        return .planning(
            PlanningState(
                sessionId: sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case let .selectRoute(routeId):
        return .routeDetails(
            RouteDetailsState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: routeId
            )
        )
    case .navigateExport:
        guard let selectedRouteId = state.selectedRouteId else {
            return .routeResults(state)
        }

        return .navigationExport(
            NavigationExportState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: selectedRouteId
            )
        )
    case .viewHistory:
        return .sessionHistory(
            SessionHistoryState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case .newSession:
        return initialState
    case let .loadSession(sessionId, routeOptions, selectedRouteId):
        return .routeResults(
            RouteResultsState(
                sessionId: sessionId,
                routeOptions: routeOptions,
                selectedRouteId: selectedRouteId
            )
        )
    default:
        return .routeResults(state)
    }
}

private func reduceRouteDetails(
    _ state: RouteDetailsState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case let .sendMessage(content):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .routeDetails(state)
        }

        return .planning(
            PlanningState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case let .sendMessageWithSession(content, sessionId):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .routeDetails(state)
        }

        return .planning(
            PlanningState(
                sessionId: sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case let .selectRoute(routeId):
        return .routeDetails(
            RouteDetailsState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: routeId
            )
        )
    case .navigateExport:
        return .navigationExport(
            NavigationExportState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case .viewHistory:
        return .sessionHistory(
            SessionHistoryState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case .newSession:
        return initialState
    default:
        return .routeDetails(state)
    }
}

private func reduceSessionHistory(
    _ state: SessionHistoryState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case .closeHistory:
        .routeResults(
            RouteResultsState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case let .selectRoute(routeId):
        .routeDetails(
            RouteDetailsState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: routeId
            )
        )
    case .newSession:
        initialState
    default:
        .sessionHistory(state)
    }
}

private func reduceNavigationExport(
    _ state: NavigationExportState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case .closeExport:
        .routeDetails(
            RouteDetailsState(
                sessionId: state.sessionId,
                routeOptions: state.routeOptions,
                selectedRouteId: state.selectedRouteId
            )
        )
    case .newSession:
        initialState
    default:
        .navigationExport(state)
    }
}

private func reduceError(
    _ state: ErrorState,
    _ action: RideFlowAction,
    dependencies: RideFlowDependencies
) -> RideFlowPhase {
    switch action {
    case .clearError:
        return initialState
    case let .sendMessage(content):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .error(state)
        }

        return .planning(
            PlanningState(
                sessionId: dependencies.makeSessionId(),
                routeOptions: nil,
                selectedRouteId: nil
            )
        )
    case let .sendMessageWithSession(content, sessionId):
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .error(state)
        }

        return .planning(
            PlanningState(
                sessionId: sessionId,
                routeOptions: nil,
                selectedRouteId: nil
            )
        )
    case .newSession:
        return initialState
    default:
        return .error(state)
    }
}
