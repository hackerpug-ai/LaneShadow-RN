import Foundation
import Testing
import XCTest
@testable import LaneShadow

@MainActor
struct RideFlowTests {
    @Test("test_reduce_idle_sendMessage_transitionsToPlanning")
    func reduceIdleSendMessageTransitionsToPlanning() {
        let dependencies = makeDependencies()

        let nextState = reduce(
            initialState,
            .sendMessage("Plan a scenic ride"),
            dependencies: dependencies
        )

        #expect(nextState.phase == .planning)
        #expect(nextState.sessionId == "session-123")
        #expect(nextState.currentPhase == nil)
        #expect(nextState.routeOptions == nil)
        #expect(nextState.selectedRouteId == nil)
    }

    @Test("test_reduce_idle_sendMessage_emptyContent_isNoOp")
    func reduceIdleSendMessageEmptyContentIsNoOp() {
        let nextState = reduce(
            initialState,
            .sendMessage("   "),
            dependencies: makeDependencies()
        )

        #expect(nextState == initialState)
    }

    @Test("test_reduce_planning_planningSuccess_transitionsToRouteResults_preservesSession")
    func reducePlanningPlanningSuccessTransitionsToRouteResultsPreservesSession() {
        let routeOptions = makeRouteOptions()
        let planningState = RideFlowPhase.planning(
            PlanningState(
                sessionId: "session-123",
                routeOptions: nil,
                selectedRouteId: nil
            )
        )

        let nextState = reduce(
            planningState,
            .planningSuccess(routeOptions),
            dependencies: makeDependencies()
        )

        #expect(nextState.phase == .routeResults)
        #expect(nextState.sessionId == "session-123")
        #expect(nextState.routeOptions == routeOptions)
        #expect(nextState.selectedRouteId == "route-1")
    }

    @Test("test_reduce_planning_planningError_transitionsToError_preservesSession")
    func reducePlanningPlanningErrorTransitionsToErrorPreservesSession() {
        let fixedTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let planningState = RideFlowPhase.planning(
            PlanningState(
                sessionId: "session-123",
                routeOptions: nil,
                selectedRouteId: nil
            )
        )

        let nextState = reduce(
            planningState,
            .planningError("AGENT_TIMEOUT"),
            dependencies: makeDependencies(timestamp: fixedTimestamp)
        )

        #expect(nextState.phase == .error)
        #expect(nextState.errorMessage == "AGENT_TIMEOUT")
        #expect(nextState.sessionId == "session-123")
        #expect(nextState.errorTimestamp == fixedTimestamp)
    }

    @Test("test_reduce_routeResults_sendMessage_reusesSession_carriesForwardOptions")
    func reduceRouteResultsSendMessageReusesSessionCarriesForwardOptions() {
        let routeOptions = makeRouteOptions()
        let routeResultsState = RideFlowPhase.routeResults(
            RouteResultsState(
                sessionId: "session-123",
                routeOptions: routeOptions,
                selectedRouteId: "route-1"
            )
        )

        let nextState = reduce(
            routeResultsState,
            .sendMessage("make it shorter"),
            dependencies: makeDependencies()
        )

        #expect(nextState.phase == .planning)
        #expect(nextState.sessionId == "session-123")
        #expect(nextState.routeOptions == routeOptions)
        #expect(nextState.selectedRouteId == "route-1")
    }

    @Test("test_reduce_planning_cancelPlanning_branchesOnExistingOptions")
    func reducePlanningCancelPlanningBranchesOnExistingOptions() {
        let routeOptions = makeRouteOptions()
        let planningWithOptions = RideFlowPhase.planning(
            PlanningState(
                sessionId: "session-123",
                routeOptions: routeOptions,
                selectedRouteId: "route-1"
            )
        )
        let planningWithoutOptions = RideFlowPhase.planning(
            PlanningState(
                sessionId: "session-123",
                routeOptions: nil,
                selectedRouteId: nil
            )
        )

        let nextWithOptions = reduce(
            planningWithOptions,
            .cancelPlanning,
            dependencies: makeDependencies()
        )
        let nextWithoutOptions = reduce(
            planningWithoutOptions,
            .cancelPlanning,
            dependencies: makeDependencies()
        )

        #expect(nextWithOptions.phase == .routeResults)
        #expect(nextWithOptions.routeOptions == routeOptions)
        #expect(nextWithOptions.selectedRouteId == "route-1")
        #expect(nextWithoutOptions == initialState)
    }

    private func makeDependencies(
        sessionId: String = "session-123",
        timestamp: Date = Date(timeIntervalSince1970: 1_700_000_000)
    ) -> RideFlowDependencies {
        RideFlowDependencies(
            makeSessionId: { sessionId },
            makeTimestamp: { timestamp }
        )
    }

    private func makeRouteOptions() -> PlannedRouteOptionsView {
        PlannedRouteOptionsView(
            planId: "plan-123",
            options: [
                PlannedRouteOptionView(
                    routeOptionId: "route-1",
                    label: "Scenic Route",
                    rationale: "Best views",
                    stats: PlannedRouteOptionStats(
                        distanceMeters: 10000,
                        durationSeconds: 1800,
                        legsCount: 2
                    ),
                    map: PlannedRouteOptionMap(
                        bounds: PlannedRouteOptionBounds(
                            north: 1,
                            south: 2,
                            east: 3,
                            west: 4
                        ),
                        overviewGeometry: PlannedRouteOptionGeometry(
                            format: "polyline",
                            encoding: "utf8",
                            precision: 6,
                            value: "encoded_polyline_string"
                        ),
                        legs: []
                    ),
                    overlaysPreview: PlannedRouteOptionOverlaysPreview(
                        windSummary: "moderate",
                        rainSummary: "light",
                        temperatureSummary: "mild",
                        maxTemperatureF: nil,
                        conditionsStatus: "ok"
                    ),
                    favorites: nil,
                    enrichment: nil,
                    includedFavorites: nil,
                    excludedFavorites: nil
                ),
            ],
            includedFavorites: nil,
            excludedFavorites: nil
        )
    }
}
