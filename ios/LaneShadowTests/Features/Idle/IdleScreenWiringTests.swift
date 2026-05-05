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
    func idleScreenChipTapCreatesSessionAndStartsPlanningFromMountedContainer() async throws {
        let client = BlockingIdlePlanningClient()

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
        let sendPlanningMessageSignal = client.sendPlanningMessageCallSignal()
        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        await pumpMainActor()

        let inspected = try screen.inspect()
        let chatInputView = try inspected.find(
            viewWithAccessibilityIdentifier: "idlescreen-chatinput"
        )
        let chip = try chatInputView.find(
            viewWithAccessibilityIdentifier: "lschatinput-chip-plan-a-scenic-2-hour-ride"
        )
        try chip.button().tap()
        await pumpMainActor()

        #expect(client.createPlanningSessionCalls == ["Plan a scenic 2-hour ride"])

        let startedCall = try #require(
            await waitForSendPlanningMessageStarted(sendPlanningMessageSignal)
        )

        #expect(client.createPlanningSessionCalls == ["Plan a scenic 2-hour ride"])
        #expect(startedCall == LaneShadowPlanningMessageCall(
            sessionId: "backend-session-123",
            content: "Plan a scenic 2-hour ride",
            currentLocation: nil
        ))
        #expect(client.sendPlanningMessageCalls == [startedCall])
        #expect(chatStore.flowState.phase == .planning)
        #expect(chatStore.flowState.sessionId == "backend-session-123")
        #expect(sessionStore.activeSessionId == "backend-session-123")
        #expect(viewModel.isSubmitting == false)

        client.resumeSendPlanningMessage(
            LaneShadowSendMessageResult(
                response: "",
                messageId: "message-123",
                attachments: nil
            )
        )
        await pumpMainActor()
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

    private func waitForSendPlanningMessageStarted(
        _ signal: AsyncSignal<LaneShadowPlanningMessageCall>,
        iterations: Int = 20
    ) async -> LaneShadowPlanningMessageCall? {
        for _ in 0 ..< iterations {
            if let call = await signal.nextValue() {
                return call
            }
            await Task.yield()
        }
        return nil
    }
}

private actor AsyncSignal<Value: Sendable> {
    private var bufferedValues: [Value] = []
    private var waiters: [CheckedContinuation<Value, Never>] = []

    func send(_ value: Value) {
        if waiters.isEmpty {
            bufferedValues.append(value)
            return
        }

        waiters.removeFirst().resume(returning: value)
    }

    func nextValue() -> Value? {
        guard !bufferedValues.isEmpty else {
            return nil
        }

        return bufferedValues.removeFirst()
    }
}

@MainActor
final class BlockingIdlePlanningClient: @unchecked Sendable, @preconcurrency LaneShadowPlanningDataProviding {
    private var sendContinuation: CheckedContinuation<LaneShadowSendMessageResult, Error>?
    private let sendPlanningMessageStartedSignal = AsyncSignal<LaneShadowPlanningMessageCall>()
    private(set) var createPlanningSessionCalls: [String] = []
    private(set) var sendPlanningMessageCalls: [LaneShadowPlanningMessageCall] = []

    var stubCreatePlanningSessionResult = LaneShadowPlanningSessionCreationResult(
        sessionId: "backend-session-123"
    )

    func subscribeToCurrentUser() -> AsyncStream<LaneShadowCurrentUser?> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func subscribeToSessions() -> AsyncStream<[Session]> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func subscribeToSessionMessages(
        sessionId _: String,
        limit _: Int
    ) -> AsyncStream<[LaneShadowSessionMessage]> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func subscribeToRoutePlan(routePlanId _: String) -> AsyncThrowingStream<LaneShadowRoutePlanSnapshot, Error> {
        AsyncThrowingStream { continuation in
            continuation.finish()
        }
    }

    func subscribeToActiveRoutePlans(sessionId _: String) -> AsyncStream<[LaneShadowRoutePlanSnapshot]> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func createPlanningSession(firstMessage: String) async throws -> LaneShadowPlanningSessionCreationResult {
        createPlanningSessionCalls.append(firstMessage)
        return stubCreatePlanningSessionResult
    }

    func sendPlanningMessage(
        sessionId: String,
        content: String,
        currentLocation: LaneShadowCurrentLocation?
    ) async throws -> LaneShadowSendMessageResult {
        let call = LaneShadowPlanningMessageCall(
            sessionId: sessionId,
            content: content,
            currentLocation: currentLocation
        )
        sendPlanningMessageCalls.append(call)
        await sendPlanningMessageStartedSignal.send(call)

        return try await withCheckedThrowingContinuation { continuation in
            sendContinuation = continuation
        }
    }

    func cancelRoutePlan(routePlanId _: String) async throws {}

    func subscribeToRouteEnrichments(routePlanId _: String) -> AsyncThrowingStream<RouteEnrichmentsDocument, Error> {
        AsyncThrowingStream { continuation in
            continuation.finish()
        }
    }

    func getRouteIndexFingerprint(routeIndex _: String) async throws -> SavedRoutesDocument? {
        nil
    }

    func subscribeToFavoriteLocations() -> AsyncStream<[FavoriteLocation]> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func fetchCurrentWeather(lat _: Double, lng _: Double) async throws -> CurrentWeatherSummary {
        CurrentWeatherSummary(tempF: 68, condition: "Clear", severity: .normal, dayOfWeek: "Friday")
    }

    func finishObservationStreams() {}

    fileprivate func sendPlanningMessageCallSignal() -> AsyncSignal<LaneShadowPlanningMessageCall> {
        sendPlanningMessageStartedSignal
    }

    func resumeSendPlanningMessage(_ result: LaneShadowSendMessageResult) {
        sendContinuation?.resume(returning: result)
        sendContinuation = nil
    }
}
