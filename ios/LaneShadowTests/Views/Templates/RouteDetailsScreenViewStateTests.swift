import Foundation
import Testing
@testable import LaneShadow

@Suite("RouteDetailsViewState Live Path Tests")
@MainActor
struct RouteDetailsScreenViewStateTests {
    // MARK: - AC-1: Real polyline rendered for selected option [PRIMARY]

    @Test("AC-1: Real polyline rendered for selected option")
    func liveViewState_passesDecodedPolylineToLSMap() {
        // GIVEN: A ChatStore with route options containing an encoded polyline
        let encodedPolyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@" // Google encoded polyline
        let routeOptions = createMockRouteOptions(
            selectedId: "route-1",
            firstOptionId: "route-1",
            encodedPolyline: encodedPolyline
        )

        let chatStore = createChatStore(with: routeOptions)
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // WHEN: ViewModel computes viewState
        let viewState = sut.viewState

        // THEN: Polylines array is non-empty and contains decoded coordinates
        #expect(!viewState.polylines.isEmpty, "Polylines should not be empty")
        #expect(viewState.polylines[0].coordinates.count > 0, "Decoded polyline should contain coordinates")
        #expect(viewState.polylines[0].variant == .best, "Selected route should be marked as best")
    }

    // MARK: - AC-2: isBest derived true for best option

    @Test("AC-2: isBest derived true when selected matches best")
    func liveViewState_isBestTrueWhenSelectedMatchesBest() {
        // GIVEN: A ChatStore where selectedRouteId == first (best) option
        let routeOptions = createMockRouteOptions(
            selectedId: "route-1",
            firstOptionId: "route-1"
        )

        let chatStore = createChatStore(with: routeOptions)
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // WHEN: ViewModel computes viewState
        let viewState = sut.viewState

        // THEN: isBest is true
        #expect(viewState.isBest == true, "Selected route should be marked as best when it matches first option")
    }

    // MARK: - AC-3: isBest derived false for alt option

    @Test("AC-3: isBest derived false for alt option")
    func liveViewState_isBestFalseForAltOption() {
        // GIVEN: A ChatStore where selectedRouteId != first (best) option
        let routeOptions = createMockRouteOptions(
            selectedId: "route-2", // Not the first option
            firstOptionId: "route-1"
        )

        let chatStore = createChatStore(with: routeOptions, selectedRouteId: "route-2")
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // WHEN: ViewModel computes viewState
        let viewState = sut.viewState

        // THEN: isBest is false
        #expect(viewState.isBest == false, "Selected route should not be marked as best when it's not the first option")
    }

    // MARK: - AC-4: timeRange derived from enrichment timestamps

    @Test("AC-4: timeRange formatted from enrichment labels")
    func liveViewState_timeRangeFormattedFromEnrichment() {
        // GIVEN: A ViewModel with enrichments containing hour labels
        let routeOptions = createMockRouteOptions(
            selectedId: "route-1",
            firstOptionId: "route-1"
        )

        let chatStore = createChatStore(with: routeOptions)
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // Feed enrichment snapshot with labels "9A" and "2P"
        let enrichmentsDoc = RouteEnrichmentsDocument(
            _id: "enrichment-1",
            _creationTime: Date().timeIntervalSince1970,
            completedAt: nil,
            error: nil,
            scheduledJobId: nil,
            enrichments: [
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "100",
                    label: "9A",
                    rationale: "Morning",
                    routeOptionId: "route-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "200",
                    label: "10",
                    rationale: "Mid-morning",
                    routeOptionId: "route-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "250",
                    label: "11",
                    rationale: "Late morning",
                    routeOptionId: "route-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "300",
                    label: "2P",
                    rationale: "Afternoon",
                    routeOptionId: "route-1",
                    highlights: []
                ),
            ],
            clerkUserId: "user-1",
            createdAt: Date().timeIntervalSince1970,
            updatedAt: Date().timeIntervalSince1970,
            planningSessionId: "session-1",
            status: "completed",
            phase: "enrichment",
            routePlanId: "plan-1",
            contentFingerprint: "fp-1"
        )

        // WHEN: ViewModel processes enrichments
        sut.handleEnrichmentsSnapshot(enrichmentsDoc)
        let viewState = sut.viewState

        // THEN: timeRange is formatted correctly
        #expect(viewState.timeRange.0 == "9 AM", "Start time should be formatted as 9 AM")
        #expect(viewState.timeRange.1 == "2 PM", "End time should be formatted as 2 PM")
    }

    // MARK: - AC-5: Empty/missing polyline does not crash

    @Test("AC-5: Empty polyline renders gracefully")
    func liveViewState_emptyPolylineRendersGracefully() {
        // GIVEN: A ChatStore with empty encoded polyline
        let routeOptions = createMockRouteOptions(
            selectedId: "route-1",
            firstOptionId: "route-1",
            encodedPolyline: "" // Empty!
        )

        let chatStore = createChatStore(with: routeOptions)
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // WHEN: ViewModel computes viewState with empty polyline
        let viewState = sut.viewState

        // THEN: No crash, polylines is empty
        #expect(viewState.polylines.isEmpty, "Empty polyline should result in empty polylines array")
        #expect(viewState.polylines.count == 0)
    }

    // MARK: - AC-6: Switching selectedRouteId updates rendered polyline

    @Test("AC-6: Polyline updates when selectedRouteId changes")
    func liveViewState_polylineUpdatesOnSelectionChange() {
        // GIVEN: ChatStore with two route options, each with different encoded polylines
        let polylineA = "_p~iF~ps|U_ulLnnqC_mqNvxq`@" // Route A
        let polylineB = "_cweFpyy|U" // Route B (shorter for distinction)

        let option1 = PlannedRouteOptionView(
            routeOptionId: "route-1",
            label: "Route A",
            rationale: "Scenic",
            stats: PlannedRouteOptionStats(distanceMeters: 10000, durationSeconds: 3600, legsCount: 5),
            map: PlannedRouteOptionMap(
                bounds: PlannedRouteOptionBounds(north: 37.8, south: 37.7, east: -122.3, west: -122.4),
                overviewGeometry: PlannedRouteOptionGeometry(
                    format: "encoded",
                    encoding: "polyline",
                    precision: 1e-6,
                    value: polylineA
                ),
                legs: []
            ),
            overlaysPreview: PlannedRouteOptionOverlaysPreview(
                windSummary: "Light",
                rainSummary: "None",
                temperatureSummary: "Warm",
                maxTemperatureF: 75,
                conditionsStatus: "good"
            )
        )

        let option2 = PlannedRouteOptionView(
            routeOptionId: "route-2",
            label: "Route B",
            rationale: "Quick",
            stats: PlannedRouteOptionStats(distanceMeters: 8000, durationSeconds: 2400, legsCount: 3),
            map: PlannedRouteOptionMap(
                bounds: PlannedRouteOptionBounds(north: 37.75, south: 37.65, east: -122.25, west: -122.35),
                overviewGeometry: PlannedRouteOptionGeometry(
                    format: "encoded",
                    encoding: "polyline",
                    precision: 1e-6,
                    value: polylineB
                ),
                legs: []
            ),
            overlaysPreview: PlannedRouteOptionOverlaysPreview(
                windSummary: "Calm",
                rainSummary: "None",
                temperatureSummary: "Warm",
                maxTemperatureF: 72,
                conditionsStatus: "good"
            )
        )

        // Create initial state with route-1 selected (the best)
        let routeOptions1 = PlannedRouteOptionsView(
            planId: "plan-1",
            options: [option1, option2]
        )

        let chatStore = createChatStore(with: routeOptions1)
        let mockClient = MockLaneShadowPlanningDataProviding()
        let sut = RouteDetailsViewModel(chatStore: chatStore, convexClient: mockClient)

        // WHEN: Get viewState for first route (route-1)
        let viewStateA = sut.viewState

        // THEN: Route A's polyline is rendered
        #expect(!viewStateA.polylines.isEmpty, "Route A should have non-empty polylines")
        let coordinatesCountA = viewStateA.polylines[0].coordinates.count

        // NOW switch to route-2 by dispatching selectRoute action
        chatStore.dispatch(.selectRoute("route-2"))

        // WHEN: Get viewState for second route (route-2)
        let viewStateB = sut.viewState

        // THEN: Route B's polyline is rendered and differs from Route A
        #expect(!viewStateB.polylines.isEmpty, "Route B should have non-empty polylines")
        #expect(
            viewStateA.polylines[0].coordinates.count != viewStateB.polylines[0].coordinates.count,
            "Different routes should decode to different coordinate counts"
        )
        #expect(viewStateB.polylines[0].variant == .alt1, "Non-best route should be marked as alt1")
    }

    // MARK: - Test Helpers

    private func createMockRouteOptions(
        selectedId: String,
        firstOptionId: String,
        encodedPolyline: String = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    ) -> PlannedRouteOptionsView {
        let option1 = PlannedRouteOptionView(
            routeOptionId: firstOptionId,
            label: "Best Route",
            rationale: "Most scenic",
            stats: PlannedRouteOptionStats(distanceMeters: 10000, durationSeconds: 3600, legsCount: 5),
            map: PlannedRouteOptionMap(
                bounds: PlannedRouteOptionBounds(north: 37.8, south: 37.7, east: -122.3, west: -122.4),
                overviewGeometry: PlannedRouteOptionGeometry(
                    format: "encoded",
                    encoding: "polyline",
                    precision: 1e-6,
                    value: encodedPolyline
                ),
                legs: []
            ),
            overlaysPreview: PlannedRouteOptionOverlaysPreview(
                windSummary: "Light",
                rainSummary: "None",
                temperatureSummary: "Warm",
                maxTemperatureF: 75,
                conditionsStatus: "good"
            )
        )

        let option2 = PlannedRouteOptionView(
            routeOptionId: "route-2",
            label: "Alternative Route",
            rationale: "Faster",
            stats: PlannedRouteOptionStats(distanceMeters: 8000, durationSeconds: 2400, legsCount: 3),
            map: PlannedRouteOptionMap(
                bounds: PlannedRouteOptionBounds(north: 37.75, south: 37.65, east: -122.25, west: -122.35),
                overviewGeometry: PlannedRouteOptionGeometry(
                    format: "encoded",
                    encoding: "polyline",
                    precision: 1e-6,
                    value: "_cweFpyy|U"
                ),
                legs: []
            ),
            overlaysPreview: PlannedRouteOptionOverlaysPreview(
                windSummary: "Calm",
                rainSummary: "None",
                temperatureSummary: "Warm",
                maxTemperatureF: 72,
                conditionsStatus: "good"
            )
        )

        return PlannedRouteOptionsView(
            planId: "plan-1",
            options: [option1, option2]
        )
    }

    private func createChatStore(with routeOptions: PlannedRouteOptionsView,
                                 selectedRouteId: String? = nil) -> ChatStore
    {
        let flowState = RideFlowPhase.routeDetails(
            RouteDetailsState(
                sessionId: "session-1",
                routeOptions: routeOptions,
                selectedRouteId: selectedRouteId ?? routeOptions.options.first?.routeOptionId ?? "route-1"
            )
        )

        return ChatStore(
            initialState: flowState,
            sessionStore: SessionStore(),
            dependencies: .live
        )
    }
}

// MARK: - Mock Convex Client

final class MockLaneShadowPlanningDataProviding: LaneShadowPlanningDataProviding {
    func subscribeToCurrentUser() -> AsyncStream<LaneShadowCurrentUser?> {
        AsyncStream { _ in }
    }

    func subscribeToSessions() -> AsyncStream<[Session]> {
        AsyncStream { _ in }
    }

    func subscribeToSessionMessages(
        sessionId _: String,
        limit _: Int
    ) -> AsyncStream<[LaneShadowSessionMessage]> {
        AsyncStream { _ in }
    }

    func subscribeToRoutePlan(routePlanId _: String) -> AsyncThrowingStream<LaneShadowRoutePlanSnapshot, Error> {
        AsyncThrowingStream { _ in }
    }

    func subscribeToActiveRoutePlans(sessionId _: String) -> AsyncStream<[LaneShadowRoutePlanSnapshot]> {
        AsyncStream { _ in }
    }

    func fetchRoutePlan(routePlanId _: String) async throws -> LaneShadowRoutePlanSnapshot {
        throw NSError(domain: "mock", code: 0)
    }

    func createPlanningSession(firstMessage _: String) async throws -> LaneShadowPlanningSessionCreationResult {
        LaneShadowPlanningSessionCreationResult(sessionId: "session-1")
    }

    func sendPlanningMessage(
        sessionId _: String,
        content _: String,
        currentLocation _: LaneShadowCurrentLocation?
    ) async throws -> LaneShadowSendMessageResult {
        LaneShadowSendMessageResult(
            response: "test response",
            messageId: "msg-1",
            attachments: nil
        )
    }

    func subscribeToRouteEnrichments(routePlanId _: String) -> AsyncThrowingStream<RouteEnrichmentsDocument, Error> {
        AsyncThrowingStream { _ in }
    }

    func getRouteIndexFingerprint(routeIndex _: String) async throws -> SavedRoutesDocument? {
        nil
    }

    func cancelRoutePlan(routePlanId _: String) async throws {
        // No-op
    }

    func subscribeToFavoriteLocations() -> AsyncStream<[FavoriteLocation]> {
        AsyncStream { _ in }
    }

    func fetchCurrentWeather(lat _: Double, lng _: Double) async throws -> CurrentWeatherSummary {
        CurrentWeatherSummary(tempF: 68, condition: "Clear", severity: .normal, dayOfWeek: "Friday")
    }
}
