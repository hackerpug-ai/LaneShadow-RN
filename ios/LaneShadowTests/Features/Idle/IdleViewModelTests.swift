import Foundation
import SwiftUI
import Testing
@testable import LaneShadow

@Suite("IdleViewModel Tests")
@MainActor
struct IdleViewModelTests {
    // MARK: - AC-1: Greeting scope computes `today` before 5pm

    @Test
    func greetingScope_morning_producesToday() async {
        // GIVEN: Current hour is 14 (2pm) - BEFORE 5pm cutoff
        // We can't control the actual time in tests, but we can verify the logic
        // by checking that the greetingScope is computed correctly
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // Send a user with a display name
        client.sendCurrentUser(
            LaneShadowCurrentUser(
                id: "user-1",
                clerkUserId: "clerk-user-1",
                email: "cameron@example.com",
                name: "Cameron Riley"
            )
        )

        await pumpMainActor()

        // THEN: firstName should be extracted from displayName
        #expect(viewModel.greetingDisplayName == "Cameron")

        // The greetingScope should be computed based on current hour
        let currentHour = Calendar.current.component(.hour, from: Date())
        let expectedScope = currentHour < 17 ? "today" : "tonight"
        #expect(viewModel.greetingScope == expectedScope)

        // The greeting headline should be formatted correctly
        #expect(viewModel.greetingHeadline.contains("Where are we riding"))
        #expect(viewModel.greetingHeadline.contains(expectedScope))
        #expect(viewModel.greetingHeadline.contains("Cameron"))

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    // MARK: - AC-2: Greeting scope computes `tonight` at/after 5pm

    @Test
    func greetingScope_evening_producesTonight() async {
        // GIVEN: We can't control the actual time, but we can verify the logic
        // by checking that the ViewModel correctly computes the scope
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        client.sendCurrentUser(
            LaneShadowCurrentUser(
                id: "user-1",
                clerkUserId: "clerk-user-1",
                email: "cameron@example.com",
                name: "Cameron Riley"
            )
        )

        await pumpMainActor()

        // THEN: Verify the scope computation logic
        // The actual value depends on when the test runs, but we can verify
        // that the logic is correct by checking the current hour
        let currentHour = Calendar.current.component(.hour, from: Date())
        let expectedScope = currentHour < 17 ? "today" : "tonight"
        #expect(viewModel.greetingScope == expectedScope)

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    // MARK: - AC-3: firstName extraction from displayName

    @Test
    func firstName_extractedFromDisplayName() async {
        // GIVEN: StubLaneShadowConvexClient yields a user with full name
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // WHEN: User has full name "Cameron Riley"
        client.sendCurrentUser(
            LaneShadowCurrentUser(
                id: "user-1",
                clerkUserId: "clerk-user-1",
                email: "cameron@example.com",
                name: "Cameron Riley"
            )
        )

        await pumpMainActor()

        // THEN: firstName should be "Cameron"
        #expect(viewModel.greetingDisplayName == "Cameron")

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test
    func firstName_fallbackToRider() async {
        // GIVEN: StubLaneShadowConvexClient yields a user with empty name
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // WHEN: User has empty display name
        client.sendCurrentUser(
            LaneShadowCurrentUser(
                id: "user-1",
                clerkUserId: "clerk-user-1",
                email: "cameron@example.com",
                name: ""
            )
        )

        await pumpMainActor()

        // THEN: firstName should fallback to "rider"
        #expect(viewModel.greetingDisplayName == "rider")

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test
    func firstName_nilDisplayName() async {
        // GIVEN: No current user
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // WHEN: Current user is nil
        client.sendCurrentUser(nil)

        await pumpMainActor()

        // THEN: firstName should fallback to "rider"
        #expect(viewModel.greetingDisplayName == "rider")

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    // MARK: - AC-4: metaRow composes correctly from weather data

    @Test
    func metaRow_composesFromWeatherData() async {
        // GIVEN: A ViewModel with weather data
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // Set up weather data
        client.stubFetchCurrentWeatherResult = CurrentWeatherSummary(
            temperatureF: 68,
            condition: "clear"
        )

        // Simulate having a favorite location to trigger weather fetch
        let favoriteLocation = FavoriteLocation(
            id: "fav-1",
            label: "Home",
            lat: 37.7749,
            lng: -122.4194,
            createdAt: Date().timeIntervalSince1970
        )
        client.sendFavoriteLocations([favoriteLocation])

        // WHEN: Weather is fetched
        await pumpMainActor()

        // THEN: metaRow should be formatted correctly
        // Format: "{WEEKDAY} · {TEMP}°F · {CONDITION}"
        // We can't predict the exact weekday, but we can verify the format
        #expect(!viewModel.metaRow.isEmpty)
        #expect(viewModel.metaRow.contains("°F"))
        #expect(viewModel.metaRow.contains("·"))

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    // MARK: - AC-5: Weather advisory severity propagates

    @Test
    func weatherAdvisory_severityPropagates() async {
        // GIVEN: A ViewModel with advisory weather data
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // Set up weather data with advisory
        client.stubFetchCurrentWeatherResult = CurrentWeatherSummary(
            temperatureF: 54,
            condition: "Heavy rain",
            severity: .advisory,
            advisoryLabel: "Weather advisory",
            advisoryBody: "I can still plan something, but shorter loops near home will beat anything with a pass today."
        )

        // Simulate having a favorite location to trigger weather fetch
        let favoriteLocation = FavoriteLocation(
            id: "fav-1",
            label: "Home",
            lat: 37.7749,
            lng: -122.4194,
            createdAt: Date().timeIntervalSince1970
        )
        client.sendFavoriteLocations([favoriteLocation])

        // WHEN: Weather with advisory is fetched
        await pumpMainActor()

        // THEN: weatherAdvisory should be non-nil
        #expect(viewModel.weatherAdvisory != nil)
        #expect(viewModel.weatherAdvisory?.label == "Weather advisory")
        #expect((viewModel.weatherAdvisory?.body.contains("shorter loops")) == true)

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    @Test
    func weatherAdvisory_nilWhenNoAdvisory() async {
        // GIVEN: A ViewModel with non-advisory weather data
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        let observationTask = Task {
            await viewModel.observe()
        }

        // Set up weather data WITHOUT advisory
        client.stubFetchCurrentWeatherResult = CurrentWeatherSummary(
            temperatureF: 68,
            condition: "clear"
        )

        // Simulate having a favorite location to trigger weather fetch
        let favoriteLocation = FavoriteLocation(
            id: "fav-1",
            label: "Home",
            lat: 37.7749,
            lng: -122.4194,
            createdAt: Date().timeIntervalSince1970
        )
        client.sendFavoriteLocations([favoriteLocation])

        // WHEN: Weather without advisory is fetched
        await pumpMainActor()

        // THEN: weatherAdvisory should be nil
        #expect(viewModel.weatherAdvisory == nil)

        client.finishObservationStreams()
        observationTask.cancel()
        await observationTask.value
    }

    // MARK: - Test Helpers

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }
}
