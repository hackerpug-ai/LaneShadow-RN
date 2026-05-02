@preconcurrency import Combine
import ConvexMobile
import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Route Results Wiring Tests")
@MainActor
struct RouteResultsWiringTests {
    @Test("test_routeResults_subscribesGetPlanById_renders3Polylines")
    func routeResults_subscribesGetPlanById_renders3Polylines() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        let viewState = context.viewModel.viewState

        #expect(viewState.routePolylines.count == 3)
        #expect(viewState.routePolylines.map(\.routeId) == [
            "route-001",
            "route-002",
            "route-003",
        ])
        #expect(viewState.routePolylines.map(\.colorTokenPath) == [
            "color.signal.default",
            "color.signal.whisper",
            "color.signal.touring",
        ])
        #expect(viewState.screenState.routes.count == 3)

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_camera_tracksRouteGeometry")
    func routeResults_camera_tracksRouteGeometry() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        let routeCamera = try #require(context.viewModel.viewState.routeCamera)
        #expect(abs(routeCamera.center.lat - 37.8) < 0.0001)
        #expect(abs(routeCamera.center.lon + 122.45) < 0.0001)
        #expect(routeCamera.zoom == 9)
        #expect(routeCamera.center.lat != 37.7749)
        #expect(routeCamera.center.lon != -122.4194)

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_attachesThreeCards_inOrder")
    func routeResults_attachesThreeCards_inOrder() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        let attachments = try #require(context.viewModel.viewState.screenState.message.attachments)
        #expect(attachments.count == 3)
        #expect(attachments.map(\.routeId) == [
            "route-001",
            "route-002",
            "route-003",
        ])

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_onRouteCardTap_promotesAltSelection")
    func routeResults_onRouteCardTap_promotesAltSelection() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()
        await pumpMainActor()

        context.viewModel.handleRouteCardTap("route-002")
        await pumpMainActor()

        #expect(context.chatStore.flowState.selectedRouteId == "route-002")
        #expect(context.viewModel.viewState.routePolylines.first(where: { $0.routeId == "route-001" })?
            .isSelected == false)
        #expect(context.viewModel.viewState.routePolylines.first(where: { $0.routeId == "route-002" })?
            .isSelected == true)
        #expect(context.viewModel.viewState.routePolylines.first(where: { $0.routeId == "route-002" })?
            .strokeWidth == .lg)
        #expect(context.viewModel.viewState.routePolylines.first(where: { $0.routeId == "route-001" })?
            .lineDasharray != nil)
        #expect(context.viewModel.viewState.routePolylines.first(where: { $0.routeId == "route-002" })?
            .lineDasharray == nil)

        let renderedPolylines = context.viewModel.viewState.screenState.routePolylines
        #expect(renderedPolylines.count == 3)
        #expect(renderedPolylines.first?.lineDasharray != nil)
        #expect(renderedPolylines.dropFirst().first?.lineDasharray == nil)

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_invalidGeometry_doesNotFabricateFallbackPolyline")
    func routeResults_invalidGeometry_doesNotFabricateFallbackPolyline() async throws {
        let context = makeRouteResultsContext(
            routeOptions: makeRouteOptions(geometryValues: ["not-a-polyline"])
        )
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        let firstPolyline = try #require(context.viewModel.viewState.routePolylines.first)
        #expect(firstPolyline.coordinates.isEmpty)
        #expect(!firstPolyline.coordinates.contains(LatLng(lat: 37.7749, lon: -122.4194)))
        #expect(context.viewModel.viewState.screenState.routePolylines.first?.coordinates.isEmpty == true)

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_emptyOptions_showsEmptyState")
    func routeResults_emptyOptions_showsEmptyState() async throws {
        let context = makeRouteResultsContext(routeOptions: makeRouteOptions(optionCount: 0))
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        #expect(context.viewModel.viewState.isEmptyState)
        #expect(context.viewModel.viewState.screenState.routes.isEmpty)
        #expect(context.viewModel.viewState.screenState.message.attachments?.isEmpty ?? true)

        let inspected = try screen.inspect()
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lsemptystate")

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_recallChip_restoresCallout")
    func routeResults_recallChip_restoresCallout() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }
        context.viewModel.handleRouteCardTap("route-002")

        let inspection = Inspection<RouteResultsScreen>()
        let screen = RouteResultsContainer(
            viewModel: context.viewModel,
            inspection: inspection
        )
        .laneShadowTheme()
        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }

        await pumpMainActor()

        try await inspection.inspect(after: .seconds(0)) { view in
            try assertSelectedRouteCard("Coastal Highway Classic", in: view)
            #expect(context.viewModel.viewState.screenState.selectedRouteId == "route-002")
        }

        try await inspection.inspect(after: .seconds(0)) { view in
            let navigatorMessage = try view.find(
                viewWithAccessibilityIdentifier: "maplayer.topOverlay.navigator-message"
            )
            let dismissButton = try navigatorMessage.find(
                viewWithAccessibilityIdentifier: "navigatormessage-dismiss"
            )
            try dismissButton.button().tap()
        }

        try await inspection.inspect(after: .seconds(0)) { view in
            let navigatorMessage = try view.find(
                viewWithAccessibilityIdentifier: "maplayer.topOverlay.navigator-message"
            )
            _ = try navigatorMessage.find(viewWithAccessibilityIdentifier: "routeresultsscreen-recall")
            #expect(
                (try? navigatorMessage.find(viewWithAccessibilityIdentifier: "navigatormessage-dismiss")) == nil
            )
        }

        try await inspection.inspect(after: .seconds(0)) { view in
            let recallButton = try view.find(
                viewWithAccessibilityIdentifier: "routeresultsscreen-recall"
            )
            try recallButton.button().tap()
        }

        try await inspection.inspect(after: .seconds(0)) { view in
            let restoredNavigatorMessage = try view.find(
                viewWithAccessibilityIdentifier: "maplayer.topOverlay.navigator-message"
            )
            let attachmentCards = restoredNavigatorMessage.findAll {
                try $0.accessibilityIdentifier() == "lsrouteattachmentcard"
            }

            _ = try restoredNavigatorMessage.find(
                viewWithAccessibilityIdentifier: "navigatormessage-dismiss"
            )
            #expect(attachmentCards.count == 3)
            try assertSelectedRouteCard("Coastal Highway Classic", in: view)
            #expect(context.viewModel.viewState.screenState.selectedRouteId == "route-002")
        }

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_streamFailure_surfacesTypedError")
    func routeResults_streamFailure_surfacesTypedError() async throws {
        let context = makeRouteResultsContext()
        context.client.sendRoutePlan(
            makeRoutePlanSnapshot(
                planId: context.routeOptions.planId,
                routeOptions: context.routeOptions
            )
        )
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()
        #expect(await waitForRoutePlanSubscription(
            context.client,
            routePlanId: context.routeOptions.planId
        ))
        context.client.failRoutePlanObservation(
            routePlanId: context.routeOptions.planId,
            error: ClientError.ServerError(msg: "STREAM_DOWN")
        )
        #expect(await waitForRoutePlanError(
            context.viewModel,
            expectedMessage: "STREAM_DOWN"
        ))

        #expect(context.viewModel.viewState.errorMessage == "STREAM_DOWN")
        #expect(context.viewModel.viewState.error == .server("STREAM_DOWN"))
        #expect(context.viewModel.viewState.isLoading == false)
        #expect(context.client.routePlanSubscriptionCalls == ["plan-123"])

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test("test_routeResults_subscriptionError_surfacesTypedError")
    func routeResults_subscriptionError_surfacesTypedError() async throws {
        let context = makeRouteResultsContext()
        context.client.stubFetchRoutePlanError = ClientError.ServerError(msg: "PLAN_NOT_FOUND")
        let observationTask = Task {
            await context.viewModel.observe()
        }

        let screen = RouteResultsContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        await pumpMainActor()

        #expect(context.client.fetchRoutePlanCalls == ["plan-123"])
        #expect(context.viewModel.viewState.errorMessage == "PLAN_NOT_FOUND")
        #expect(context.viewModel.viewState.isLoading == false)

        context.client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }
}

private struct RouteResultsTestContext {
    let client: StubLaneShadowConvexClient
    let sessionStore: SessionStore
    let chatStore: ChatStore
    let viewModel: RouteResultsViewModel
    let routeOptions: PlannedRouteOptionsView
}

@MainActor
private func makeRouteResultsContext(
    routeOptions: PlannedRouteOptionsView? = nil
) -> RouteResultsTestContext {
    let routeOptions = routeOptions ?? makeRouteOptions()
    let client = StubLaneShadowConvexClient()
    let sessionStore = SessionStore()
    let timestampSeconds: TimeInterval = 60 * 60 * 24 * 19700
    let chatStore = ChatStore(
        flowState: .routeResults(
            RouteResultsState(
                sessionId: "session-123",
                routeOptions: routeOptions,
                selectedRouteId: routeOptions.options.first?.routeOptionId
            )
        ),
        sessionStore: sessionStore,
        dependencies: RideFlowDependencies(
            makeSessionId: { "flow-session-456" },
            makeTimestamp: { Date(timeIntervalSince1970: timestampSeconds) }
        )
    )
    let viewModel = RouteResultsViewModel(
        chatStore: chatStore,
        sessionStore: sessionStore,
        convexClient: client
    )

    return RouteResultsTestContext(
        client: client,
        sessionStore: sessionStore,
        chatStore: chatStore,
        viewModel: viewModel,
        routeOptions: routeOptions
    )
}

private func makeRoutePlanSnapshot(
    planId: String,
    routeOptions: PlannedRouteOptionsView
) -> LaneShadowRoutePlanSnapshot {
    LaneShadowRoutePlanSnapshot(
        id: planId,
        status: "completed",
        statusMessage: "Route options ready",
        phase: nil,
        routeOptions: routeOptions,
        errorMessage: nil
    )
}

private func makeRouteOptions(
    optionCount: Int = 3,
    geometryValues: [String] = []
) -> PlannedRouteOptionsView {
    let baseOptions = [
        makePrimaryRouteOption(geometryValue: geometryValues.first),
        makeSecondaryRouteOption(),
        makeTertiaryRouteOption(),
    ]

    return PlannedRouteOptionsView(
        planId: "plan-123",
        options: Array(baseOptions.prefix(optionCount)),
        includedFavorites: ["Stage Road"],
        excludedFavorites: nil
    )
}

private func makePrimaryRouteOption(geometryValue: String?) -> PlannedRouteOptionView {
    PlannedRouteOptionView(
        routeOptionId: "route-001",
        label: "The Skyline Spine",
        rationale: "Best views and technical riding",
        stats: PlannedRouteOptionStats(
            distanceMeters: 52000,
            durationSeconds: 5400,
            legsCount: 2
        ),
        map: PlannedRouteOptionMap(
            bounds: PlannedRouteOptionBounds(
                north: 37.9,
                south: 37.7,
                east: -122.3,
                west: -122.6
            ),
            overviewGeometry: PlannedRouteOptionGeometry(
                format: "polyline",
                encoding: "polyline",
                precision: 5,
                value: geometryValue ?? "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
            ),
            legs: ["leg-1", "leg-2"]
        ),
        overlaysPreview: PlannedRouteOptionOverlaysPreview(
            windSummary: "Light breeze",
            rainSummary: "No rain",
            temperatureSummary: "Clear skies",
            maxTemperatureF: 72,
            conditionsStatus: "clear"
        ),
        favorites: "Includes your favorite: Stage Road",
        enrichment: "completed",
        includedFavorites: ["Stage Road"],
        excludedFavorites: nil
    )
}

private func makeSecondaryRouteOption() -> PlannedRouteOptionView {
    PlannedRouteOptionView(
        routeOptionId: "route-002",
        label: "Coastal Highway Classic",
        rationale: "Shorter with scenic ocean views",
        stats: PlannedRouteOptionStats(
            distanceMeters: 48000,
            durationSeconds: 5100,
            legsCount: 2
        ),
        map: PlannedRouteOptionMap(
            bounds: PlannedRouteOptionBounds(
                north: 37.9,
                south: 37.7,
                east: -122.2,
                west: -122.7
            ),
            overviewGeometry: PlannedRouteOptionGeometry(
                format: "polyline",
                encoding: "polyline",
                precision: 5,
                value: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
            ),
            legs: ["leg-1", "leg-2"]
        ),
        overlaysPreview: PlannedRouteOptionOverlaysPreview(
            windSummary: "Moderate breeze",
            rainSummary: "No rain",
            temperatureSummary: "Mostly clear",
            maxTemperatureF: 70,
            conditionsStatus: "clear"
        ),
        favorites: nil,
        enrichment: "completed",
        includedFavorites: nil,
        excludedFavorites: nil
    )
}

private func makeTertiaryRouteOption() -> PlannedRouteOptionView {
    PlannedRouteOptionView(
        routeOptionId: "route-003",
        label: "Valley Loop",
        rationale: "Winds through quieter roads",
        stats: PlannedRouteOptionStats(
            distanceMeters: 55000,
            durationSeconds: 5700,
            legsCount: 2
        ),
        map: PlannedRouteOptionMap(
            bounds: PlannedRouteOptionBounds(
                north: 37.9,
                south: 37.7,
                east: -122.1,
                west: -122.8
            ),
            overviewGeometry: PlannedRouteOptionGeometry(
                format: "polyline",
                encoding: "polyline",
                precision: 5,
                value: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
            ),
            legs: ["leg-1", "leg-2"]
        ),
        overlaysPreview: PlannedRouteOptionOverlaysPreview(
            windSummary: "Breezy",
            rainSummary: "No rain",
            temperatureSummary: "Cool",
            maxTemperatureF: 68,
            conditionsStatus: "wind"
        ),
        favorites: nil,
        enrichment: "completed",
        includedFavorites: nil,
        excludedFavorites: nil
    )
}

private func pumpMainActor(iterations: Int = 10) async {
    for _ in 0 ..< iterations {
        await Task.yield()
    }
}

@MainActor
private func waitForRoutePlanSubscription(
    _ client: StubLaneShadowConvexClient,
    routePlanId: String,
    iterations: Int = 50
) async -> Bool {
    for _ in 0 ..< iterations {
        if client.routePlanSubscriptionCalls.contains(routePlanId) {
            return true
        }
        try? await Task.sleep(nanoseconds: 10_000_000)
    }

    return client.routePlanSubscriptionCalls.contains(routePlanId)
}

@MainActor
private func waitForRoutePlanError(
    _ viewModel: RouteResultsViewModel,
    expectedMessage: String,
    iterations: Int = 50
) async -> Bool {
    for _ in 0 ..< iterations {
        if viewModel.viewState.errorMessage == expectedMessage {
            return true
        }
        try? await Task.sleep(nanoseconds: 10_000_000)
    }

    return viewModel.viewState.errorMessage == expectedMessage
}

private func assertSelectedRouteCard(
    _ title: String,
    in view: InspectableView<ViewType.View<RouteResultsScreen>>
) throws {
    let selectedCards = try view.findAll {
        (try? $0.accessibilityIdentifier()) == "lsrouteattachmentcard"
            && (try? $0.accessibilityValue().string()) == "Selected"
    }

    #expect(selectedCards.count == 1)
    _ = try selectedCards.first?.find(text: title)
}

@MainActor
final class Inspection<V>: InspectionEmissary {
    let notice = PassthroughSubject<UInt, Never>()
    var callbacks = [UInt: (V) -> Void]()

    func visit(_ view: V, _ line: UInt) {
        if let callback = callbacks.removeValue(forKey: line) {
            callback(view)
        } else {
            assertionFailure()
        }
    }
}

extension Inspection: RouteResultsScreenInspectionSeam where V == RouteResultsScreen {}
