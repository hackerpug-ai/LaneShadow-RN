import Foundation
import Testing
@testable import LaneShadow

@Suite("Planning ViewModel Tests")
@MainActor
struct PlanningViewModelTests {
    @Test
    func test_planningPhase_enumLiterals() {
        #expect(PlanningPhase.allCases.map(\.rawValue) == [
            "parsing",
            "searching",
            "drafting",
            "enriching",
            "finalizing"
        ])
    }

    @Test
    func test_phaseSteps_drafting_correctShape() async {
        let context = makeContext()

        context.client.sendSessionMessages(
            [
                makePlanningMessage(
                    id: "planning-drafting",
                    status: "running",
                    content: #"{"events":[{"type":"tool_pending","tool":"planRoute"}]}"#
                )
            ],
            sessionId: "session-123"
        )
        await pumpMainActor()

        #expect(context.viewModel.phaseSteps.count == 5)
        #expect(context.viewModel.phaseSteps.map(\.id) == PlanningPhase.allCases.map(\.rawValue))
        #expect(context.viewModel.phaseSteps.map(\.state) == [.done, .done, .active, .pending, .pending])

        context.tearDown()
    }

    @Test
    func test_capsuleHeadline_perPhase() async {
        let context = makeContext()
        var headlines: [String] = []

        for (index, phase) in PlanningPhase.allCases.enumerated() {
            context.client.sendSessionMessages(
                [
                    makeMessage(for: phase, createdAt: Double(index + 1))
                ],
                sessionId: "session-123"
            )
            await pumpMainActor()
            headlines.append(context.viewModel.capsuleHeadline)
        }

        #expect(headlines.count == 5)
        #expect(headlines.allSatisfy { !$0.isEmpty && !$0.contains("\n") })
        #expect(Set(headlines).count == 5)

        context.tearDown()
    }

    @Test
    func test_requestCancelConfirmation_togglesVisibilityOnly() async {
        let context = makeContext()
        context.client.sendSessionMessages(
            [makeMessage(for: .searching, createdAt: 1)],
            sessionId: "session-123"
        )
        await pumpMainActor()

        let phaseStepsBefore = context.viewModel.phaseSteps
        let isThinkingBefore = context.viewModel.isThinking

        context.viewModel.requestCancelConfirmation()

        #expect(context.viewModel.cancelConfirmationVisible)
        #expect(context.client.cancelRoutePlanCalls.isEmpty)
        #expect(context.viewModel.isThinking == isThinkingBefore)
        #expect(context.viewModel.phaseSteps == phaseStepsBefore)

        context.tearDown()
    }

    @Test
    func test_confirmCancellation_firesMutationAndReturnsToIdle() async {
        let context = makeContext()
        context.client.sendActiveRoutePlans(
            [makeRoutePlan(id: "route-plan-123", status: "running")],
            sessionId: "session-123"
        )
        await pumpMainActor()
        await context.viewModel.submitRefinement("Refine the route")
        context.viewModel.requestCancelConfirmation()

        await context.viewModel.confirmCancellation()

        #expect(context.client.cancelRoutePlanCalls == ["route-plan-123"])
        #expect(context.viewModel.cancelConfirmationVisible == false)
        #expect(context.viewModel.isThinking == false)
        #expect(context.chatStore.flowState.phase == .idle)
        #expect(context.chatStore.transcript.messages.isEmpty)

        context.tearDown()
    }

    @Test
    func test_confirmCancellation_errorPath() async {
        enum CancelFailure: LocalizedError {
            case denied

            var errorDescription: String? { "Cancel failed" }
        }

        let context = makeContext()
        context.client.stubCancelRoutePlanError = CancelFailure.denied
        context.client.sendActiveRoutePlans(
            [makeRoutePlan(id: "route-plan-123", status: "running")],
            sessionId: "session-123"
        )
        await pumpMainActor()
        context.viewModel.requestCancelConfirmation()

        await context.viewModel.confirmCancellation()

        #expect(context.viewModel.cancelConfirmationVisible == false)
        #expect(context.viewModel.errorMessage == "Cancel failed")
        #expect(context.client.cancelRoutePlanCalls == ["route-plan-123"])

        context.tearDown()
    }

    @Test
    func test_dismissCancelConfirmation_noMutation() async {
        let context = makeContext()
        context.client.sendSessionMessages(
            [makeMessage(for: .enriching, createdAt: 1)],
            sessionId: "session-123"
        )
        await pumpMainActor()

        let isThinkingBefore = context.viewModel.isThinking
        context.viewModel.requestCancelConfirmation()
        context.viewModel.dismissCancelConfirmation()

        #expect(context.viewModel.cancelConfirmationVisible == false)
        #expect(context.client.cancelRoutePlanCalls.isEmpty)
        #expect(context.viewModel.isThinking == isThinkingBefore)
        #expect(context.chatStore.flowState.phase == .planning)

        context.tearDown()
    }

    @Test
    func test_phaseDerivation_allFivePhases() async {
        let context = makeContext()

        for (index, phase) in PlanningPhase.allCases.enumerated() {
            context.client.sendSessionMessages(
                [makeMessage(for: phase, createdAt: Double(index + 1))],
                sessionId: "session-123"
            )
            await pumpMainActor()

            #expect(context.viewModel.phaseSteps[index].state == .active)
            #expect(context.viewModel.phaseSteps.enumerated().allSatisfy { currentIndex, step in
                if currentIndex < index {
                    step.state == .done
                } else if currentIndex == index {
                    step.state == .active
                } else {
                    step.state == .pending
                }
            })
        }

        context.tearDown()
    }
}

@MainActor
private struct TestContext {
    let client: StubLaneShadowConvexClient
    let chatStore: ChatStore
    let viewModel: PlanningViewModel
    let observationTask: Task<Void, Never>

    func tearDown() {
        client.finishObservationStreams()
        observationTask.cancel()
    }
}

@MainActor
private extension PlanningViewModelTests {
    func makeContext(sessionId: String = "session-123") -> TestContext {
        let client = StubLaneShadowConvexClient()
        let sessionStore = SessionStore()
        let fixedTimestamp = Date(timeIntervalSince1970: 1_700_000_000)
        let chatStore = ChatStore(
            flowState: .planning(PlanningState(sessionId: sessionId)),
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "flow-session-456" },
                makeTimestamp: { fixedTimestamp }
            ),
            transcript: ChatTranscript(timestampProvider: { fixedTimestamp })
        )
        let appState = AppState(isAuthenticated: true, currentUser: laneShadowCurrentUser)
        appState.appRoute = .session(id: sessionId)
        let viewModel = PlanningViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client,
            appState: appState
        )
        let observationTask = Task {
            await viewModel.observe()
        }

        return TestContext(
            client: client,
            chatStore: chatStore,
            viewModel: viewModel,
            observationTask: observationTask
        )
    }

    func makeMessage(for phase: PlanningPhase, createdAt: Double) -> LaneShadowSessionMessage {
        switch phase {
        case .parsing:
            makePlanningMessage(
                id: "planning-\(phase.rawValue)",
                status: "running",
                content: #"{"events":[]}"#
            )
        case .searching:
            makePlanningMessage(
                id: "planning-\(phase.rawValue)",
                status: "running",
                content: "plain text that should not matter",
                thinkingSteps: [
                    LaneShadowThinkingStepSnapshot(
                        type: "tool_start",
                        toolName: "geocode",
                        summary: "lookup",
                        detail: nil,
                        timestamp: createdAt
                    )
                ]
            )
        case .drafting:
            makePlanningMessage(
                id: "planning-\(phase.rawValue)",
                status: "running",
                content: #"{"events":[{"type":"tool_pending","tool":"planRoute"}]}"#
            )
        case .enriching:
            makePlanningMessage(
                id: "planning-\(phase.rawValue)",
                status: "running",
                content: "another string without routing keywords",
                thinkingSteps: [
                    LaneShadowThinkingStepSnapshot(
                        type: "tool_start",
                        toolName: "searchNearby",
                        summary: "nearby",
                        detail: nil,
                        timestamp: createdAt
                    )
                ]
            )
        case .finalizing:
            makePlanningMessage(
                id: "planning-\(phase.rawValue)",
                status: "complete",
                content: "complete"
            )
        }
    }

    func makePlanningMessage(
        id: String,
        status: String,
        content: String,
        thinkingSteps: [LaneShadowThinkingStepSnapshot]? = nil
    ) -> LaneShadowSessionMessage {
        LaneShadowSessionMessage(
            id: id,
            sessionId: "session-123",
            role: "system",
            content: content,
            createdAt: 1,
            kind: "planning",
            status: status,
            attachments: nil,
            thinkingSteps: thinkingSteps
        )
    }

    func makeRoutePlan(id: String, status: String) -> LaneShadowRoutePlanSnapshot {
        LaneShadowRoutePlanSnapshot(
            id: id,
            status: status,
            statusMessage: "Planning update",
            phase: nil,
            routeOptions: nil,
            errorMessage: nil
        )
    }

    func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

    var laneShadowCurrentUser: LaneShadowCurrentUser {
        LaneShadowCurrentUser(
            id: "user-jamie",
            clerkUserId: "clerk-jamie",
            email: "jamie@example.com",
            name: "Jamie"
        )
    }
}
