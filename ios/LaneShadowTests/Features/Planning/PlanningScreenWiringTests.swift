import Foundation
import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Planning Screen Wiring Tests")
@MainActor
struct PlanningScreenWiringTests {
    @Test
    func planningScreenSessionMessagesStreamRenders() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        let riderMessage = makeSessionMessage(
            id: "message-1",
            role: "rider",
            content: "Find a scenic route",
            createdAt: 1_700_000_000_000,
            kind: "text",
            status: "complete"
        )
        let parsingMessage = makeSessionMessage(
            id: "message-2",
            role: "system",
            content: makePlanningContent(statusLine: "Reading your request"),
            createdAt: 1_700_000_001_000,
            kind: "planning",
            status: "streaming"
        )
        let searchingMessage = makeSessionMessage(
            id: "message-3",
            role: "system",
            content: makePlanningContent(statusLine: "Looking into the best roads"),
            createdAt: 1_700_000_002_000,
            kind: "planning",
            status: "running"
        )

        context.client.sendSessionMessages([riderMessage], sessionId: "session-123")
        await pumpMainActor()

        context.client.sendSessionMessages(
            [riderMessage, parsingMessage],
            sessionId: "session-123"
        )
        await pumpMainActor()

        context.client.sendSessionMessages(
            [riderMessage, parsingMessage, searchingMessage],
            sessionId: "session-123"
        )
        await pumpMainActor()

        let expectedMessages = [
            "Find a scenic route",
            "Reading your request",
            "Looking into the best roads",
        ]

        #expect(context.viewModel.messages.map(\.content) == expectedMessages)
        #expect(context.viewModel.screenState.messages.map(\.content) == expectedMessages)
        #expect(context.viewModel.isThinking)

        let inspected = try screen.inspect()
        let transcriptTexts = try inspected.findAll(ViewType.Text.self).compactMap { try? $0.string() }
        let contentIndices = expectedMessages.compactMap { transcriptTexts.firstIndex(of: $0) }
        #expect(contentIndices.count == expectedMessages.count)
        #expect(contentIndices == contentIndices.sorted())

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenPhaseIndicatorBindsToMessageStatus() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        let riderMessage = makeSessionMessage(
            id: "message-1",
            role: "rider",
            content: "Find a scenic route",
            createdAt: 1_700_000_000_000,
            kind: "text",
            status: "complete"
        )
        let parsingMessage = makeSessionMessage(
            id: "message-2",
            role: "system",
            content: makePlanningContent(statusLine: "Reading your request"),
            createdAt: 1_700_000_001_000,
            kind: "planning",
            status: "streaming"
        )
        let searchingMessage = makeSessionMessage(
            id: "message-3",
            role: "system",
            content: makePlanningContent(statusLine: "Looking into the best roads"),
            createdAt: 1_700_000_002_000,
            kind: "planning",
            status: "running"
        )
        let draftingMessage = makeSessionMessage(
            id: "message-4",
            role: "system",
            content: makePlanningContent(statusLine: "Drafting the best turns"),
            createdAt: 1_700_000_003_000,
            kind: "planning",
            status: "running"
        )

        context.client.sendSessionMessages([riderMessage, parsingMessage], sessionId: "session-123")
        await pumpMainActor()
        let parsingPhaseIndicator = try screen.inspect().find(
            viewWithAccessibilityIdentifier: "planningscreen-phase-indicator"
        )
        let parsingPhaseRow = try parsingPhaseIndicator.find(
            viewWithAccessibilityIdentifier: "lsphaseindicator-phase-parsing-active"
        )
        #expect(try parsingPhaseRow.find(text: "Parsing").string() == "Parsing")

        context.client.sendSessionMessages(
            [riderMessage, parsingMessage, searchingMessage],
            sessionId: "session-123"
        )
        await pumpMainActor()
        let searchingPhaseIndicator = try screen.inspect().find(
            viewWithAccessibilityIdentifier: "planningscreen-phase-indicator"
        )
        let searchingPhaseRow = try searchingPhaseIndicator.find(
            viewWithAccessibilityIdentifier: "lsphaseindicator-phase-searching-active"
        )
        #expect(try searchingPhaseRow.find(text: "Searching").string() == "Searching")

        context.client.sendSessionMessages(
            [riderMessage, parsingMessage, searchingMessage, draftingMessage],
            sessionId: "session-123"
        )
        await pumpMainActor()
        let draftingPhaseIndicator = try screen.inspect().find(
            viewWithAccessibilityIdentifier: "planningscreen-phase-indicator"
        )
        let draftingPhaseRow = try draftingPhaseIndicator.find(
            viewWithAccessibilityIdentifier: "lsphaseindicator-phase-drafting-active"
        )
        #expect(try draftingPhaseRow.find(text: "Drafting").string() == "Drafting")

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenRoutePlanCompletionDispatchesPlanningSuccess() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        let routePlanId = "route-plan-123"
        let routeOptions = makeRouteOptions(planId: routePlanId)
        let riderMessage = makeSessionMessage(
            id: "message-1",
            role: "rider",
            content: "Find a scenic route",
            createdAt: 1_700_000_000_000,
            kind: "text",
            status: "complete"
        )
        let routeAttachment = LaneShadowSendMessageAttachment(
            type: "route_options",
            routePlanId: routePlanId
        )
        let routingMessage = makeSessionMessage(
            id: "message-2",
            role: "system",
            content: makePlanningContent(statusLine: "Planning routes"),
            createdAt: 1_700_000_001_000,
            kind: "routing_card",
            status: "complete",
            attachments: [routeAttachment]
        )

        context.client.sendSessionMessages(
            [riderMessage, routingMessage],
            sessionId: "session-123"
        )
        await pumpMainActor()

        context.client.sendRoutePlan(
            makeRoutePlan(
                id: routePlanId,
                status: "completed",
                routeOptions: routeOptions
            )
        )
        await pumpMainActor()

        #expect(context.chatStore.flowState.phase == .routeResults)
        #expect(context.chatStore.flowState.sessionId == "session-123")
        #expect(context.chatStore.flowState.routeOptions == routeOptions)

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenFreeTextSendUsesExistingSessionId() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        let inspected = try screen.inspect()
        _ = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-chat-input")

        await context.viewModel.submitRefinement("Refine the route")

        #expect(
            context.client.sendPlanningMessageCalls == [
                LaneShadowPlanningMessageCall(
                    sessionId: "session-123",
                    content: "Refine the route",
                    currentLocation: nil
                ),
            ]
        )
        #expect(context.chatStore.flowState.phase == .planning)
        #expect(context.chatStore.flowState.sessionId == "session-123")
        #expect(context.sessionStore.activeSessionId == "session-123")

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenFreeTextSendAppendsOptimisticMessageAndReconcilesWithoutDuplicate() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        await context.viewModel.submitRefinement("Refine the route")

        #expect(context.viewModel.messages.count == 1)
        #expect(context.viewModel.messages.first?.id.hasPrefix("temp-") == true)
        #expect(context.viewModel.messages.first?.content == "Refine the route")

        context.client.sendSessionMessages(
            [
                makeSessionMessage(
                    id: "message-456",
                    role: "user",
                    content: "Refine the route",
                    createdAt: 1_700_000_001_000,
                    kind: "text",
                    status: "complete"
                ),
            ],
            sessionId: "session-123"
        )
        await pumpMainActor()

        #expect(context.viewModel.messages.count == 1)
        #expect(context.viewModel.messages.first?.id == "message-456")
        #expect(context.viewModel.messages.first?.content == "Refine the route")

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenSendFailureMarksOptimisticMessageFailedRetryable() async throws {
        let context = makePlanningContext()
        context.client.stubSendPlanningMessageError = LaneShadowError.server("Send failed")
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        await context.viewModel.submitRefinement("Refine the route")

        #expect(context.viewModel.isSending == false)
        #expect(context.viewModel.errorMessage == "Send failed")
        #expect(context.chatStore.transcript.messages.count == 1)
        #expect(context.chatStore.transcript.messages.first?.state == .failed)
        #expect(context.chatStore.transcript.messages.first?.retryable == true)

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenCancelButtonCallsCancelPlanAndResetsFlow() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        context.client.sendActiveRoutePlans(
            [
                makeRoutePlan(
                    id: "route-plan-123",
                    status: "running",
                    routeOptions: nil
                ),
            ],
            sessionId: "session-123"
        )
        await pumpMainActor()

        let inspected = try screen.inspect()
        let chatInput = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-chat-input")
        let collapseButton = try chatInput.find(viewWithAccessibilityIdentifier: "lschatinput-collapse")
        try collapseButton.button().tap()
        await pumpMainActor()

        #expect(context.client.cancelRoutePlanCalls == ["route-plan-123"])
        #expect(context.chatStore.flowState.phase == .idle)

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    @Test
    func planningScreenCancelButtonClearsOptimisticMessagesAndCancelsActivePlan() async throws {
        let context = makePlanningContext()
        context.viewModel.shouldRenderMap = false
        let screen = PlanningScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let harness = host(screen)
        _ = harness.window

        context.client.sendActiveRoutePlans(
            [
                makeRoutePlan(
                    id: "route-plan-123",
                    status: "running",
                    routeOptions: nil
                ),
            ],
            sessionId: "session-123"
        )
        await pumpMainActor()

        await context.viewModel.submitRefinement("Refine the route")
        #expect(context.viewModel.messages.count == 1)

        await context.viewModel.cancelPlanning()

        #expect(context.client.cancelRoutePlanCalls == ["route-plan-123"])
        #expect(context.chatStore.transcript.messages.isEmpty)
        #expect(context.chatStore.flowState.phase == .idle)

        context.client.finishObservationStreams()
        context.observationTask.cancel()
        await context.observationTask.value
    }

    private func makePlanningContext(
        sessionId: String = "session-123"
    ) -> (
        client: StubLaneShadowConvexClient,
        sessionStore: SessionStore,
        chatStore: ChatStore,
        viewModel: PlanningViewModel,
        observationTask: Task<Void, Never>
    ) {
        let client = StubLaneShadowConvexClient()
        let sessionStore = SessionStore()
        let fixedTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let chatStore = ChatStore(
            flowState: .planning(
                PlanningState(sessionId: sessionId)
            ),
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "flow-session-456" },
                makeTimestamp: { fixedTimestamp }
            ),
            transcript: ChatTranscript(timestampProvider: { fixedTimestamp })
        )
        let viewModel = PlanningViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )
        let observationTask = Task {
            await viewModel.observe()
        }

        return (client, sessionStore, chatStore, viewModel, observationTask)
    }

    private func makeSessionMessage(
        id: String,
        role: String,
        content: String,
        createdAt: Double,
        kind: String?,
        status: String?,
        attachments: [LaneShadowSendMessageAttachment]? = nil
    ) -> LaneShadowSessionMessage {
        LaneShadowSessionMessage(
            id: id,
            sessionId: "session-123",
            role: role,
            content: content,
            createdAt: createdAt,
            kind: kind,
            status: status,
            attachments: attachments,
            thinkingSteps: nil
        )
    }

    private func makePlanningContent(statusLine: String) -> String {
        #"{"events":[],"statusLine":"\#(statusLine)"}"#
    }

    private func makeRoutePlan(
        id: String,
        status: String,
        routeOptions: PlannedRouteOptionsView?
    ) -> LaneShadowRoutePlanSnapshot {
        LaneShadowRoutePlanSnapshot(
            id: id,
            status: status,
            statusMessage: "Planning update",
            phase: nil,
            routeOptions: routeOptions,
            errorMessage: nil
        )
    }

    private func makeRouteOptions(planId: String) -> PlannedRouteOptionsView {
        PlannedRouteOptionsView(
            planId: planId,
            options: [
                PlannedRouteOptionView(
                    routeOptionId: "route-option-1",
                    label: "Scenic loop",
                    rationale: "Keeps the best roads in view",
                    stats: PlannedRouteOptionStats(
                        distanceMeters: 12000,
                        durationSeconds: 1800,
                        legsCount: 2
                    ),
                    map: PlannedRouteOptionMap(
                        bounds: PlannedRouteOptionBounds(
                            north: 39.8,
                            south: 39.6,
                            east: -104.8,
                            west: -105.0
                        ),
                        overviewGeometry: PlannedRouteOptionGeometry(
                            format: "polyline",
                            encoding: "encoded-polyline",
                            precision: 5,
                            value: "abc123"
                        ),
                        legs: ["leg-1", "leg-2"]
                    ),
                    overlaysPreview: PlannedRouteOptionOverlaysPreview(
                        windSummary: "Light breeze",
                        rainSummary: "No rain",
                        temperatureSummary: "Warm",
                        maxTemperatureF: 72,
                        conditionsStatus: "clear"
                    )
                ),
            ]
        )
    }

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

    @MainActor
    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        let window = UIWindow(frame: controller.view.frame)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        return HostedHarness(window: window, controller: controller)
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
