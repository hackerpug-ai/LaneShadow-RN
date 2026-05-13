import CoreLocation
import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Idle Place Autocomplete Tests")
@MainActor
struct IdlePlaceAutocompleteTests {
    @Test
    func typingTwoCharactersTriggersDebouncedSuggest() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubSuggestedPlacesByQuery["Bi"] = [
            makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California"),
        ]

        let locationService = LocationService()
        locationService.currentLocation = CLLocation(latitude: 37.7749, longitude: -122.4194)

        let viewModel = makeViewModel(client: client, locationService: locationService)

        viewModel.updateChatInputQuery("Bi")

        #expect(client.suggestPlacesCalls.isEmpty)

        try await Task.sleep(for: .milliseconds(350))

        let call = try #require(client.suggestPlacesCalls.first)
        #expect(call.query == "Bi")
        #expect(
            call.proximity == LaneShadowPlaceSearchProximity(
                lat: 37.7749,
                lng: -122.4194
            )
        )
        #expect(!call.sessionToken.isEmpty)
    }

    @Test
    func shortQueryClearsAutocompleteRestoresRideChips() async throws {
        let client = StubLaneShadowConvexClient()
        client.pauseSuggestPlaces(for: "Big")

        let viewModel = makeViewModel(client: client)
        viewModel.updateChatInputQuery("Big")

        try await Task.sleep(for: .milliseconds(350))
        #expect(client.suggestPlacesCalls.count == 1)

        viewModel.updateChatInputQuery("B")
        client.resumeSuggestPlaces(
            for: "Big",
            result: .success([
                makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California"),
            ])
        )
        await pumpMainActor()

        #expect(viewModel.placeAutocompleteSuggestions.isEmpty)
        #expect(viewModel.showsStaticRideSuggestions == true)
        #expect(viewModel.isPlaceAutocompleteLoading == false)
        #expect(viewModel.placeAutocompleteErrorMessage == nil)
    }

    @Test
    func rendersAtMostThreeAccessibleRecommendations() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubSuggestedPlacesByQuery["Big"] = [
            makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California"),
            makeSuggestion(id: "big-basin", name: "Big Basin", label: "Big Basin Redwoods State Park"),
            makeSuggestion(id: "big-creek", name: "Big Creek", label: "Big Creek, California"),
            makeSuggestion(id: "big-bear", name: "Big Bear", label: "Big Bear Lake, California"),
            makeSuggestion(id: "big-lagoon", name: "Big Lagoon", label: "Big Lagoon, California"),
        ]

        let viewModel = makeViewModel(client: client)
        viewModel.updateChatInputQuery("Big")
        try await Task.sleep(for: .milliseconds(350))
        await pumpMainActor()

        #expect(viewModel.placeAutocompleteSuggestions.count == 3)

        let chatInput = LSChatInput(
            value: .constant("Big"),
            placeholder: "Plan a ride…",
            onSend: { _ in },
            onCollapse: {},
            onFilter: {},
            autocompleteSuggestions: viewModel.placeAutocompleteSuggestions.map { suggestion in
                LSChatAutocompleteSuggestion(
                    placeSuggestion: suggestion,
                    accessibilityLabel: "\(suggestion.name), \(suggestion.label)"
                )
            }
        )
        .laneShadowTheme()

        let inspected = try chatInput.inspect()
        let row0 = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-autocomplete-row-0")
        let row1 = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-autocomplete-row-1")
        let row2 = try inspected.find(viewWithAccessibilityIdentifier: "lschatinput-autocomplete-row-2")

        #expect(try row0.button().accessibilityLabel().string() == "Big Sur, Big Sur, California")
        #expect(
            try row1.button().accessibilityLabel().string() ==
                "Big Basin, Big Basin Redwoods State Park"
        )
        #expect(
            try row2.button().accessibilityLabel().string() ==
                "Big Creek, Big Creek, California"
        )

        let row3 = try? inspected.find(viewWithAccessibilityIdentifier: "lschatinput-autocomplete-row-3")
        let staticChip = try? inspected.find(
            viewWithAccessibilityIdentifier: "lschatinput-chip-plan-a-scenic-2-hour-ride"
        )

        #expect(row3 == nil)
        #expect(staticChip == nil)
    }

    @Test
    func selectRecommendationPrimesInputWithoutPlanning() async throws {
        let client = StubLaneShadowConvexClient()
        let suggestion = makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California")
        client.stubRetrievedPlacesByID["big-sur"] = LaneShadowSelectedPlace(
            id: "big-sur",
            name: "Big Sur",
            label: "Big Sur, California",
            lat: 36.2704,
            lng: -121.8081,
            featureType: "place"
        )

        let viewModel = makeViewModel(client: client)

        await viewModel.selectPlaceSuggestion(suggestion)

        #expect(viewModel.autocompletePrimedInputValue == "Big Sur, California")
        #expect(viewModel.selectedPlace?.id == "big-sur")
        #expect(viewModel.selectedPlace?.lat == 36.2704)
        #expect(client.createPlanningSessionCalls.isEmpty)
        #expect(client.retrievePlaceCalls == [
            LaneShadowRetrievePlaceCall(mapboxId: "big-sur", sessionToken: client.retrievePlaceCalls[0].sessionToken),
        ])
    }

    @Test
    func staleAutocompleteResponseIgnored() async throws {
        let client = StubLaneShadowConvexClient()
        client.pauseSuggestPlaces(for: "Bi")
        client.pauseSuggestPlaces(for: "Big")

        let viewModel = makeViewModel(client: client)

        viewModel.updateChatInputQuery("Bi")
        try await Task.sleep(for: .milliseconds(350))

        viewModel.updateChatInputQuery("Big")
        try await Task.sleep(for: .milliseconds(350))

        client.resumeSuggestPlaces(
            for: "Big",
            result: .success([
                makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California"),
            ])
        )
        await pumpMainActor()

        #expect(viewModel.placeAutocompleteSuggestions.map(\.id) == ["big-sur"])

        client.resumeSuggestPlaces(
            for: "Bi",
            result: .success([
                makeSuggestion(id: "bixby", name: "Bixby Bridge", label: "Bixby Bridge, California"),
            ])
        )
        await pumpMainActor()

        #expect(viewModel.placeAutocompleteSuggestions.map(\.id) == ["big-sur"])
    }

    @Test
    func autocompleteFailureRecoversOnNextQuery() async throws {
        let client = StubLaneShadowConvexClient()
        client.stubSuggestPlacesErrorByQuery["Bi"] = LaneShadowError.server("Autocomplete is temporarily unavailable")
        client.stubSuggestedPlacesByQuery["Big"] = [
            makeSuggestion(id: "big-sur", name: "Big Sur", label: "Big Sur, California"),
        ]

        let viewModel = makeViewModel(client: client)

        viewModel.updateChatInputQuery("Bi")
        try await Task.sleep(for: .milliseconds(350))

        #expect(viewModel.placeAutocompleteErrorMessage == "Autocomplete is temporarily unavailable")
        #expect(viewModel.placeAutocompleteSuggestions.isEmpty)

        viewModel.updateChatInputQuery("Big")
        try await Task.sleep(for: .milliseconds(350))

        #expect(viewModel.placeAutocompleteErrorMessage == nil)
        #expect(viewModel.placeAutocompleteSuggestions.map(\.id) == ["big-sur"])
    }

    private func makeViewModel(
        client: StubLaneShadowConvexClient,
        locationService: LocationService = LocationService()
    ) -> IdleViewModel {
        IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: client,
            locationService: locationService
        )
    }

    private func makeSuggestion(
        id: String,
        name: String,
        label: String,
        featureType: String = "place"
    ) -> LaneShadowPlaceSuggestion {
        LaneShadowPlaceSuggestion(
            id: id,
            name: name,
            label: label,
            secondaryText: nil,
            featureType: featureType,
            distanceMeters: nil
        )
    }

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }
}
