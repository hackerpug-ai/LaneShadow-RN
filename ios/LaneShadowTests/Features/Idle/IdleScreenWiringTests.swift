import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Idle Screen Wiring Tests")
@MainActor
struct IdleScreenWiringTests {
    @Test
    func idleScreenSubscribesToCurrentUserRendersDisplayName() async throws {
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()

        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let observationTask = Task {
            await viewModel.observe()
        }

        client.sendCurrentUser(
            LaneShadowCurrentUser(
                id: "user-1",
                clerkUserId: "clerk-user-1",
                email: "cameron@example.com",
                name: "Cameron"
            )
        )

        await pumpMainActor()

        let inspected = try screen.inspect()
        let greeting = try inspected.find(text: "Good morning, Cameron")
        #expect(try greeting.string() == "Good morning, Cameron")

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test
    func idleScreenChipTapCreatesSessionAndSendsMessage() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubCreatePlanningSessionResult = LaneShadowPlanningSessionCreationResult(
            sessionId: "session-123"
        )

        let sessionStore = SessionStore()
        let chatStore = ChatStore(
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "flow-session-456" },
                makeTimestamp: { Date(timeIntervalSince1970: 1_700_000_000) }
            )
        )
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let observationTask = Task {
            await viewModel.observe()
        }

        let inspected = try screen.inspect()
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-chip-plan-a-scenic-2-hour-ride")

        await viewModel.submitSuggestion("Plan a scenic 2-hour ride")

        #expect(client.createPlanningSessionCalls == ["Plan a scenic 2-hour ride"])
        #expect(
            client.sendPlanningMessageCalls == [
                LaneShadowPlanningMessageCall(
                    sessionId: "session-123",
                    content: "Plan a scenic 2-hour ride",
                    currentLocation: nil
                ),
            ]
        )
        #expect(chatStore.flowState.phase == .planning)
        #expect(chatStore.flowState.sessionId == "session-123")
        #expect(sessionStore.activeSessionId == "session-123")

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test
    func idleScreenCreateSessionFailureRemainsIdleShowsError() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubCreatePlanningSessionError = LaneShadowError.server("Could not create session")

        let sessionStore = SessionStore()
        let chatStore = ChatStore(sessionStore: sessionStore)
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let observationTask = Task {
            await viewModel.observe()
        }

        let inspected = try screen.inspect()
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-chip-plan-a-scenic-2-hour-ride")

        await viewModel.submitSuggestion("Plan a scenic 2-hour ride")

        #expect(viewModel.errorMessage == "Could not create session")
        #expect(chatStore.flowState.phase == .idle)
        #expect(viewModel.isSubmitting == false)
        #expect(client.createPlanningSessionCalls == ["Plan a scenic 2-hour ride"])
        #expect(client.sendPlanningMessageCalls.isEmpty)

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }
}
