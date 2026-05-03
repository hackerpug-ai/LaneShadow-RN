import ConvexMobile
import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Error Screen Wiring Tests")
@MainActor
struct ErrorScreenWiringTests {
    @Test("test_errorScreen_tryAgain_redispatchesSendMessage")
    func errorScreen_tryAgain_redispatchesSendMessage() async throws {
        let context = makeContext(
            error: .agentTimeout,
            cachedLastFailedInput: "Plan a scenic ride"
        )

        let screen = ErrorScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let inspected = try screen.inspect()
        let callout = try inspected.find(viewWithAccessibilityIdentifier: "errorscreen-callout")
        #expect(context.viewModel.suggestionLabels == ["Try again", "Start over"])
        #expect(try callout.find(text: "Try again").string() == "Try again")
        #expect(try callout.find(text: "Start over").string() == "Start over")

        context.viewModel.handleTryAgain()
        await pumpMainActor(iterations: 50)

        // Verify backend calls
        #expect(context.convexClient.createPlanningSessionCalls == ["Plan a scenic ride"])
        #expect(context.convexClient.sendPlanningMessageCalls == [
            LaneShadowPlanningMessageCall(
                sessionId: "backend-session-123",
                content: "Plan a scenic ride",
                currentLocation: nil
            ),
        ])

        // Verify state transitions
        #expect(context.chatStore.flowState.phase == .planning)
        #expect(context.chatStore.flowState.sessionId == "backend-session-123")
        #expect(context.sessionStore.activeSessionId == "backend-session-123")
    }

    @Test("test_errorScreen_startOver_dispatchesNewSession")
    func errorScreen_startOver_dispatchesNewSession() async throws {
        let context = makeContext(
            error: .agentTimeout,
            cachedLastFailedInput: "Plan a scenic ride"
        )

        let screen = ErrorScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let inspected = try screen.inspect()
        let callout = try inspected.find(viewWithAccessibilityIdentifier: "errorscreen-callout")
        #expect(context.viewModel.suggestionLabels == ["Try again", "Start over"])
        #expect(try callout.find(text: "Try again").string() == "Try again")
        #expect(try callout.find(text: "Start over").string() == "Start over")

        context.viewModel.handleStartOver()
        await pumpMainActor()

        #expect(context.chatStore.flowState == initialState)
        #expect(context.sessionStore.activeSessionId == nil)
        #expect(context.appState.appRoute == .home)
        #expect(context.appState.cachedLastFailedInput == nil)
    }

    @Test("test_errorScreen_planLimitExceeded_suppressesRetry")
    func errorScreen_planLimitExceeded_suppressesRetry() async throws {
        let context = makeContext(
            error: .planLimitExceeded,
            cachedLastFailedInput: "Plan a scenic ride"
        )

        #expect(
            context.viewModel.bodyText == "You've used all 5 monthly plans. Upgrade to Premium for unlimited planning!"
        )
        #expect(context.viewModel.suggestionLabels == ["Start over"])
        #expect(context.viewModel.showsRetryChip == false)
        #expect(context.viewModel.showsStartOverChip == true)
        #expect(context.viewModel.isChatEnabled == false)

        let screen = ErrorScreenContainer(viewModel: context.viewModel).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let inspected = try screen.inspect()
        let callout = try inspected.find(viewWithAccessibilityIdentifier: "errorscreen-callout")
        let texts = try inspected.findAll(ViewType.Text.self).compactMap { try? $0.string() }

        #expect(texts.contains("You've used all 5 monthly plans. Upgrade to Premium for unlimited planning!"))
        #expect(texts.contains("Start over"))
        #expect(!texts.contains("Try again"))

        let buttons = try callout.findAll(ViewType.Button.self)
        #expect(buttons.count == 1)
    }

    private struct ErrorScreenTestContext {
        let chatStore: ChatStore
        let sessionStore: SessionStore
        let appState: AppState
        let convexClient: StubLaneShadowConvexClient
        let viewModel: ErrorScreenViewModel
    }

    private func makeContext(
        error: LaneShadowError,
        cachedLastFailedInput: String?
    ) -> ErrorScreenTestContext {
        let sessionStore = SessionStore()
        let chatStore = ChatStore(
            initialState: .error(
                ErrorState(
                    errorMessage: error.rawMessage,
                    sessionId: "session-123",
                    errorTimestamp: Date(timeIntervalSince1970: 1_700_000_000)
                )
            ),
            sessionStore: sessionStore,
            dependencies: RideFlowDependencies(
                makeSessionId: { "retry-session-456" },
                makeTimestamp: { Date(timeIntervalSince1970: 1_700_000_123) }
            )
        )
        let appState = AppState(isAuthenticated: true, currentUser: laneShadowCurrentUser)
        appState.appRoute = .session(id: "session-123")
        appState.cachedLastFailedInput = cachedLastFailedInput

        let convexClient = StubLaneShadowConvexClient()
        convexClient
            .stubCreatePlanningSessionResult = LaneShadowPlanningSessionCreationResult(sessionId: "backend-session-123")

        let viewModel = ErrorScreenViewModel(
            error: error,
            chatStore: chatStore,
            appState: appState,
            convexClient: convexClient
        )

        return ErrorScreenTestContext(
            chatStore: chatStore,
            sessionStore: sessionStore,
            appState: appState,
            convexClient: convexClient,
            viewModel: viewModel
        )
    }

    private func pumpMainActor(iterations: Int = 20) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

    private var laneShadowCurrentUser: LaneShadowCurrentUser {
        LaneShadowCurrentUser(
            id: "user-jamie",
            clerkUserId: "clerk-jamie",
            email: "jamie@example.com",
            name: "Jamie"
        )
    }
}
