import CoreLocation
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
    func idleScreenRendersSprintGreetingHeadlineForTodayScope() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.greetingDisplayName = "Cameron"
        viewModel.greetingScope = .today
        viewModel.locationLabel = "Santa Cruz, CA"
        viewModel.favoriteLocations = [
            FavoriteLocation(id: "fav-1", lat: 36.97, lon: -122.03, label: "Santa Cruz, CA"),
        ]

        let screen = LSIdleHeader(
            capsuleState: viewModel.capsuleState,
            onMenuTap: {},
            onNewTap: {}
        ).laneShadowTheme()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        let inspected = try screen.inspect()
        let headline = try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule-headline")
        #expect(try headline.text().string() == "Where are we riding today, Cameron?")
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader")
    }

    @Test
    func idleViewModelFormatsWeatherMetaRowInUppercase() async throws {
        let client = StubLaneShadowConvexClient()
        let locationService = LocationService()
        let delegate = locationService as CLLocationManagerDelegate
        delegate.locationManager?(CLLocationManager(), didFailWithError: NSError(domain: "test", code: 0))
        try await Task.sleep(for: .milliseconds(300))

        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: client,
            locationService: locationService
        )

        await viewModel.observe()
        try await Task.sleep(for: .milliseconds(500))

        #expect(viewModel.metaRow == "FRIDAY · 68°F · CLEAR")
        viewModel.stopObserving()
    }

    @Test
    func idleScreenChipTapPrimesInputBeforeExplicitSend() async throws {
        @MainActor
        final class DraftBox {
            var value = ""
        }

        let client = BlockingIdlePlanningClient()
        let locationService = LocationService()
        locationService.currentLocation = nil

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
            convexClient: client,
            locationService: locationService
        )

        let draft = DraftBox()
        let primeSuggestion: (SuggestionChip) -> Void = { chip in
            draft.value = chip.label
        }
        let screen = LSChatInput(
            value: Binding(
                get: { draft.value },
                set: { draft.value = $0 }
            ),
            placeholder: viewModel.chatPlaceholder,
            onSend: { message in
                Task { await viewModel.submitSuggestion(message) }
            },
            onFilter: {},
            suggestions: [SuggestionChip(label: "Plan a scenic 2-hour ride")],
            onSuggestionTap: primeSuggestion
        ).laneShadowTheme()
        let sendPlanningMessageSignal = client.sendPlanningMessageCallSignal()
        let hostingController = UIHostingController(rootView: screen)
        hostingController.loadViewIfNeeded()

        primeSuggestion(SuggestionChip(label: "Plan a scenic 2-hour ride"))

        #expect(client.createPlanningSessionCalls.isEmpty)
        #expect(chatStore.flowState.phase == .idle)
        #expect(draft.value == "Plan a scenic 2-hour ride")

        await viewModel.submitSuggestion(draft.value)
        await pumpMainActor()

        let startedCall = try #require(
            await waitForSendPlanningMessageStarted(sendPlanningMessageSignal)
        )

        #expect(client.createPlanningSessionCalls == [draft.value])
        #expect(startedCall.sessionId == "backend-session-123")
        #expect(startedCall.content == draft.value)
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
    func idleScreenSubmitSuggestionForwardsCurrentLocationWhenAvailable() async throws {
        let client = BlockingIdlePlanningClient()
        let locationService = LocationService()
        locationService.currentLocation = CLLocation(latitude: 37.7749, longitude: -122.4194)

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
            convexClient: client,
            locationService: locationService
        )

        let sendPlanningMessageSignal = client.sendPlanningMessageCallSignal()

        await viewModel.submitSuggestion("Plan a scenic 2-hour ride")
        await pumpMainActor()

        let startedCall = try #require(
            await waitForSendPlanningMessageStarted(sendPlanningMessageSignal)
        )

        #expect(startedCall == LaneShadowPlanningMessageCall(
            sessionId: "backend-session-123",
            content: "Plan a scenic 2-hour ride",
            currentLocation: LaneShadowCurrentLocation(lat: 37.7749, lng: -122.4194)
        ))

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

    @Test
    func idleScreenAutocompleteTapPrimesInputWithoutPlanning() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubSuggestedPlacesByQuery["Big"] = [
            LaneShadowPlaceSuggestion(
                id: "big-sur",
                name: "Big Sur",
                label: "Big Sur, California",
                secondaryText: nil,
                featureType: "place",
                distanceMeters: nil
            ),
        ]
        client.stubRetrievedPlacesByID["big-sur"] = LaneShadowSelectedPlace(
            id: "big-sur",
            name: "Big Sur",
            label: "Big Sur, California",
            lat: 36.2704,
            lng: -121.8081,
            featureType: "place"
        )

        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: client
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }

        viewModel.placeAutocompleteSuggestions = client.stubSuggestedPlacesByQuery["Big"] ?? []
        viewModel.isAutocompleteQueryActive = true
        await pumpMainActor()

        let inspected = try screen.inspect()
        let chatInput = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-chatinput")
        let suggestionRow = try chatInput.find(viewWithAccessibilityIdentifier: "lschatinput-autocomplete-row-0")
        try suggestionRow.button().tap()
        await pumpMainActor(iterations: 20)

        #expect(client.createPlanningSessionCalls.isEmpty)
        #expect(viewModel.selectedPlace?.label == "Big Sur, California")

        let inspectedAfterTap = try screen.inspect()
        let chatInputAfterTap = try inspectedAfterTap.find(
            viewWithAccessibilityIdentifier: "idlescreen-chatinput"
        )
        let sendIcon = try? chatInputAfterTap.find(viewWithAccessibilityIdentifier: "lschatinput-send-icon")
        #expect(sendIcon != nil)
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

    func reverseGeocode(lat: Double, lng: Double) async throws -> String {
        // Stub implementation for testing
        if lat == 36.97, lng == -122.03 {
            return "Santa Cruz, CA"
        }
        return "Unknown Location"
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
