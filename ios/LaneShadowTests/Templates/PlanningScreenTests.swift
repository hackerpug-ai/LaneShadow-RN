import LaneShadowTheme
import NativeSandbox
import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class PlanningScreenTests: XCTestCase {
    func test_topOverlay_capsuleAboveIndicator() throws {
        let harness = makePlanningHarness()
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        let inspected = try screen.inspect()
        let overlayIDs = try inspected.findAll { view in
            guard let identifier = try? view.accessibilityIdentifier() else {
                return false
            }
            return identifier.hasPrefix("maplayer.topOverlay.")
        }.compactMap { try? $0.accessibilityIdentifier() }

        XCTAssertEqual(
            overlayIDs,
            [
                "maplayer.topOverlay.planning-context-capsule",
                "maplayer.topOverlay.planning-phase-indicator",
            ]
        )
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-context-capsule"))
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-phase-indicator"))
    }

    func test_capsule_bindsViewModelHeadline() throws {
        let harness = makePlanningHarness(headline: "Drafting candidates…")
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        let inspected = try screen.inspect()
        let capsule = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-context-capsule")

        XCTAssertEqual(try capsule.find(text: "Drafting candidates…").string(), "Drafting candidates…")
    }

    func test_indicator_bindsViewModelPhaseSteps() throws {
        let phases = Self.makePhaseSteps(
            states: [.done, .done, .active, .pending, .pending]
        )
        let harness = makePlanningHarness(
            headline: "Drafting candidates…",
            phases: phases
        )
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        let inspected = try screen.inspect()
        let indicator = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-phase-indicator")

        XCTAssertEqual(try indicator.accessibilityIdentifier(), "planningscreen-phase-indicator")
        XCTAssertEqual(try indicator.find(text: "Drafting candidates…").string(), "Drafting candidates…")

        let phaseRows = try indicator.findAll { view in
            guard let identifier = try? view.accessibilityIdentifier() else {
                return false
            }
            return identifier.hasPrefix("lsphaseindicator-phase-")
        }

        XCTAssertEqual(phaseRows.count, 5)
        XCTAssertNoThrow(try indicator.find(viewWithAccessibilityIdentifier: "lsphaseindicator-phase-drafting-active"))
    }

    func test_backChip_callsRequestCancelConfirmation() throws {
        let harness = makePlanningHarness()
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        let inspected = try screen.inspect()
        let backChip = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-hamburger")
        try backChip.button().tap()
        pumpMainActor()

        XCTAssertTrue(harness.planningViewModel.cancelConfirmationVisible)
        XCTAssertEqual(harness.client.cancelRoutePlanCalls, [])
        XCTAssertEqual(harness.mapAppViewModel.currentState, .planning(sessionId: harness.sessionId))
    }

    func test_chatInput_lockedWhenThinking() throws {
        let harness = makePlanningHarness(isThinking: true)
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        let inspected = try screen.inspect()
        let chatInput = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-chat-input")
        let collapseButton = try chatInput.find(viewWithAccessibilityIdentifier: "lschatinput-collapse")

        XCTAssertTrue(try collapseButton.isDisabled())
        XCTAssertEqual(try chatInput.accessibilityValue().string(), "thinking=true;enabled=false")
    }

    func test_mapControls_planningConfiguration() throws {
        let harness = makePlanningContainerHarness()
        var screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        var inspected = try screen.inspect()
        let controls = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-controls")
        XCTAssertEqual(try controls.accessibilityIdentifier(), "planningscreen-controls")
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-sketch-polyline"))

        let recenter = try controls.find(viewWithAccessibilityIdentifier: "lsmapcontrols-location.circle")
        try recenter.button().tap()
        pumpMainActor()

        let updatedMapValue = try screen.inspect()
            .find(viewWithAccessibilityIdentifier: "planningscreen-map")
            .accessibilityValue().string()
        XCTAssertTrue(updatedMapValue.contains("mode=map"))
        XCTAssertTrue(updatedMapValue.contains("layers=visible"))

        let layers = try controls.find(viewWithAccessibilityIdentifier: "lsmapcontrols-layers")
        try layers.button().tap()
        pumpMainActor()

        XCTAssertFalse(harness.controlsState.layersVisible)

        ViewHosting.expel()
        screen = PlanningScreenContainer(
            viewModel: harness.viewModel,
            controlsState: harness.controlsState
        ).laneShadowTheme()
        ViewHosting.host(view: screen)
        pumpMainActor()

        inspected = try screen.inspect()
        XCTAssertThrowsError(try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-sketch-polyline"))
    }

    func test_mapHost_identityPreserved() throws {
        let harness = makeIdleHarness()
        let screen = harness.screen.laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        pumpMainActor()

        var inspected = try screen.inspect()
        let idleMap = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-map")
        let idleHostToken = try XCTUnwrap(try Self.hostToken(in: idleMap.accessibilityValue().string()))

        harness.mapAppViewModel.goToPlanning(sessionId: harness.sessionId)
        harness.planningViewModel.capsuleHeadline = "Drafting candidates…"
        harness.planningViewModel.phaseSteps = Self.makePhaseSteps(
            states: [.done, .done, .active, .pending, .pending]
        )
        pumpMainActor()

        inspected = try screen.inspect()
        let planningMap = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-map")
        let planningHostToken = try XCTUnwrap(try Self.hostToken(in: planningMap.accessibilityValue().string()))

        XCTAssertEqual(idleHostToken, planningHostToken)
    }

    func test_sandboxStories_registered() {
        let requiredIDs: Set = [
            "templates.planning-screen.scouting-light",
            "templates.planning-screen.scouting-dark",
            "templates.planning-screen.drawing-light",
            "templates.planning-screen.drawing-dark",
            "templates.planning-screen.weather-light",
            "templates.planning-screen.weather-dark",
            "templates.planning-screen.scoring-light",
            "templates.planning-screen.scoring-dark",
            "templates.planning-screen.slow-planning-light",
            "templates.planning-screen.slow-planning-dark",
            "templates.planning-screen.cancel-prompt-light",
            "templates.planning-screen.cancel-prompt-dark",
            "templates.planning-screen.single-candidate-light",
            "templates.planning-screen.single-candidate-dark",
        ]

        let planningStories = LaneShadowStories.all.filter { requiredIDs.contains($0.id) }

        XCTAssertEqual(Set(planningStories.map(\.id)), requiredIDs)

        for story in planningStories {
            let rendered = story.render(story.initialArgs).laneShadowTheme()
            let hosted = UIHostingController(rootView: rendered)

            XCTAssertNotNil(hosted.view, "Story \(story.id) should render without runtime errors")
        }
    }

    private func makePlanningHarness(
        headline: String = "Drafting candidates…",
        phases: [LSPhaseIndicator.Phase]? = nil,
        isThinking: Bool = false
    ) -> MapAppHarness {
        let harness = makeIdleHarness()
        harness.mapAppViewModel.goToPlanning(sessionId: harness.sessionId)
        harness.planningViewModel.capsuleHeadline = headline
        harness.planningViewModel.phaseSteps = phases ?? Self.makePhaseSteps(
            states: [.done, .done, .active, .pending, .pending]
        )
        harness.planningViewModel.isThinking = isThinking
        harness.planningViewModel.cancelConfirmationVisible = false
        return harness
    }

    private func makePlanningContainerHarness() -> PlanningContainerHarness {
        let client = StubLaneShadowConvexClient()
        let sessionStore = SessionStore()
        let chatStore = ChatStore(
            flowState: .planning(PlanningState(sessionId: "session-123")),
            sessionStore: sessionStore
        )
        let appState = AppState(isAuthenticated: true)
        appState.appRoute = AppState.AppRoute.session(id: "session-123")
        let viewModel = PlanningViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client,
            appState: appState
        )
        let controlsState = PlanningLiveControlsState()
        viewModel.capsuleHeadline = "Drafting candidates…"
        viewModel.phaseSteps = Self.makePhaseSteps(states: [.done, .done, .active, .pending, .pending])

        return PlanningContainerHarness(
            client: client,
            viewModel: viewModel,
            controlsState: controlsState,
            screen: PlanningScreenContainer(viewModel: viewModel, controlsState: controlsState)
        )
    }

    private func makeIdleHarness() -> MapAppHarness {
        let client = StubLaneShadowConvexClient()
        let idleViewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: client,
            appState: AppState(),
            onSessionStarted: { _ in }
        )
        let mapAppViewModel = MapAppViewModel(idleViewModel: idleViewModel)
        let screen = MapApp(viewModel: mapAppViewModel)
        let sessionId = "session-123"
        return MapAppHarness(
            client: client,
            mapAppViewModel: mapAppViewModel,
            screen: screen,
            sessionId: sessionId
        )
    }

    private func pumpMainActor(iterations: Int = 20) {
        for _ in 0 ..< iterations {
            RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        }
    }

    private static func makePhaseSteps(states: [PhaseState]) -> [LSPhaseIndicator.Phase] {
        zip(
            ["parsing", "searching", "drafting", "weather", "scoring"],
            zip(
                ["Parsing", "Searching", "Drafting", "Weather", "Scoring"],
                states
            )
        ).map { id, payload in
            LSPhaseIndicator.Phase(id: id, label: payload.0, state: payload.1)
        }
    }

    private static func hostToken(in accessibilityValue: String) -> String? {
        accessibilityValue
            .split(separator: ";")
            .first(where: { $0.hasPrefix("host=") })
            .map { String($0.dropFirst("host=".count)) }
    }
}

@MainActor
private struct MapAppHarness {
    let client: StubLaneShadowConvexClient
    let mapAppViewModel: MapAppViewModel
    let screen: MapApp
    let sessionId: String

    var planningViewModel: PlanningViewModel {
        guard let planningViewModel = mapAppViewModel.planningViewModel else {
            fatalError("Expected planning view model to exist")
        }
        return planningViewModel
    }
}

@MainActor
private struct PlanningContainerHarness {
    let client: StubLaneShadowConvexClient
    let viewModel: PlanningViewModel
    let controlsState: PlanningLiveControlsState
    let screen: PlanningScreenContainer
}
