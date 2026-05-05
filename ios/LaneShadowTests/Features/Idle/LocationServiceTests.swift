import CoreLocation
import Foundation
import Testing
import XCTest
@testable import LaneShadow

@Suite("Location Service Tests")
@MainActor
struct LocationServiceTests {
    @Test("Location service initializes with notDetermined authorization status")
    func initializesWithNotDeterminedStatus() async throws {
        let service = LocationService()
        #expect(service.authorizationStatus == .notDetermined)
    }

    @Test("Location service reports no location when initially created")
    func reportsNoLocationInitially() async throws {
        let service = LocationService()
        let location = await service.currentLocation
        #expect(location == nil)
    }

    @Test("Location service sets Santa Cruz fallback on location error")
    func fallsBackToSantaCruzOnError() async throws {
        let service = LocationService()

        let delegate = service as CLLocationManagerDelegate
        delegate.locationManager?(CLLocationManager(), didFailWithError: NSError(domain: "test", code: 0))

        try await Task.sleep(for: .milliseconds(300))
        #expect(service.currentLocation?.coordinate.latitude == 36.97)
        #expect(service.currentLocation?.coordinate.longitude == -122.03)
    }

    @Test("Convex client provides reverseGeocode method")
    func convexClientProvidesReverseGeocode() async throws {
        let client = StubLaneShadowConvexClient()
        let result = try await client.reverseGeocode(lat: 36.97, lng: -122.03)
        #expect(result == "Santa Cruz, CA")
    }

    @Test("IdleViewModel exposes locationLabel and isLocationEnabled")
    func viewModelExposesLocationProperties() async throws {
        let client = StubLaneShadowConvexClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client
        )

        #expect(viewModel.locationLabel == nil)
        #expect(viewModel.isLocationEnabled == false)
    }

    @Test("IdleViewModel sets locationUnavailable when reverseGeocode fails")
    func setsLocationUnavailableOnGeocodeFailure() async throws {
        let client = WeatherTrackingClient()
        client.reverseGeocodeResults = [
            .failure(NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Geocode failed"])),
        ]

        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let locationService = LocationService()

        // Set a fallback location (Santa Cruz) so we have something to geocode
        let delegate = locationService as CLLocationManagerDelegate
        delegate.locationManager?(CLLocationManager(), didFailWithError: NSError(domain: "test", code: 0))

        try await Task.sleep(for: .milliseconds(300))

        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client,
            locationService: locationService
        )

        #expect(viewModel.locationUnavailable == false)
        await viewModel.observe()
        try await Task.sleep(for: .milliseconds(500))

        #expect(viewModel.locationUnavailable == true)
        #expect(viewModel.locationLabel == nil)
        #expect(viewModel.isLocationEnabled == false)

        viewModel.stopObserving()
    }

    @Test("IdleViewModel fetches weather using current location coordinates")
    func fetchesWeatherUsingCurrentLocationCoordinates() async throws {
        let client = WeatherTrackingClient()
        let chatStore = ChatStore()
        let sessionStore = SessionStore()
        let locationService = LocationService()
        let delegate = locationService as CLLocationManagerDelegate
        delegate.locationManager?(
            CLLocationManager(),
            didUpdateLocations: [CLLocation(latitude: 37.81, longitude: -122.47)]
        )
        try await Task.sleep(for: .milliseconds(300))

        let viewModel = IdleViewModel(
            chatStore: chatStore,
            sessionStore: sessionStore,
            convexClient: client,
            locationService: locationService
        )

        await viewModel.observe()
        try await Task.sleep(for: .milliseconds(500))

        #expect(client.fetchCurrentWeatherCalls.count == 1)
        #expect(client.fetchCurrentWeatherCalls.first?.0 == 37.81)
        #expect(client.fetchCurrentWeatherCalls.first?.1 == -122.47)
        #expect(viewModel.metaRow == "FRIDAY · 68°F · CLEAR")

        viewModel.stopObserving()
    }

    @Test("IdleViewModel clears unavailable state after a later successful reverse geocode")
    func clearsUnavailableStateAfterLaterSuccessfulReverseGeocode() async throws {
        let client = WeatherTrackingClient()
        client.reverseGeocodeResults = [
            .failure(NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Geocode failed"])),
            .success("Sausalito, CA"),
        ]

        let locationService = LocationService()
        let delegate = locationService as CLLocationManagerDelegate

        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: client,
            locationService: locationService
        )

        await viewModel.observe()
        delegate.locationManager?(
            CLLocationManager(),
            didUpdateLocations: [CLLocation(latitude: 37.81, longitude: -122.47)]
        )
        try await Task.sleep(for: .milliseconds(400))

        #expect(viewModel.locationUnavailable == true)
        #expect(viewModel.locationLabel == nil)
        #expect(viewModel.isLocationEnabled == false)

        delegate.locationManager?(
            CLLocationManager(),
            didUpdateLocations: [CLLocation(latitude: 37.82, longitude: -122.48)]
        )
        try await Task.sleep(for: .milliseconds(400))

        #expect(viewModel.locationUnavailable == false)
        #expect(viewModel.locationLabel == "Sausalito, CA")
        #expect(viewModel.isLocationEnabled == true)

        viewModel.stopObserving()
    }
}

@MainActor
private final class WeatherTrackingClient: @unchecked Sendable, @preconcurrency LaneShadowPlanningDataProviding {
    var reverseGeocodeResults: [Result<String, Error>] = [.success("Santa Cruz, CA")]
    private(set) var fetchCurrentWeatherCalls: [(Double, Double)] = []

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

    func subscribeToFavoriteLocations() -> AsyncStream<[FavoriteLocation]> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }

    func fetchCurrentWeather(lat: Double, lng: Double) async throws -> CurrentWeatherSummary {
        fetchCurrentWeatherCalls.append((lat, lng))
        return CurrentWeatherSummary(tempF: 68, condition: "Clear", severity: .normal, dayOfWeek: "Friday")
    }

    func reverseGeocode(lat _: Double, lng _: Double) async throws -> String {
        let nextResult = reverseGeocodeResults.isEmpty ? .success("Santa Cruz, CA") : reverseGeocodeResults
            .removeFirst()
        return try nextResult.get()
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

    func fetchRoutePlan(routePlanId _: String) async throws -> LaneShadowRoutePlanSnapshot {
        throw LaneShadowError.unknown("Unused in test")
    }

    func createPlanningSession(firstMessage _: String) async throws -> LaneShadowPlanningSessionCreationResult {
        throw LaneShadowError.unknown("Unused in test")
    }

    func sendPlanningMessage(
        sessionId _: String,
        content _: String,
        currentLocation _: LaneShadowCurrentLocation?
    ) async throws -> LaneShadowSendMessageResult {
        throw LaneShadowError.unknown("Unused in test")
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
}
