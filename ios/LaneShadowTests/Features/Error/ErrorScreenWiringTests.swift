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
        let buttons = try callout.findAll(ViewType.Button.self)
        #expect(buttons.count == 2)

        try buttons[0].tap()
        await pumpMainActor()

        #expect(context.chatStore.flowState.phase == .planning)
        #expect(context.chatStore.flowState.sessionId == "retry-session-456")
        #expect(context.sessionStore.activeSessionId == "retry-session-456")
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
        let buttons = try callout.findAll(ViewType.Button.self)
        #expect(buttons.count == 2)

        try buttons[1].tap()
        await pumpMainActor()

        #expect(context.chatStore.flowState == initialState)
        #expect(context.sessionStore.activeSessionId == nil)
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

    private func makeContext(
        error: LaneShadowError,
        cachedLastFailedInput: String?
    ) -> (
        chatStore: ChatStore,
        sessionStore: SessionStore,
        appState: AppState,
        viewModel: ErrorScreenViewModel
    ) {
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
        appState.cachedLastFailedInput = cachedLastFailedInput

        let viewModel = ErrorScreenViewModel(
            error: error,
            chatStore: chatStore,
            appState: appState
        )

        return (chatStore, sessionStore, appState, viewModel)
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
