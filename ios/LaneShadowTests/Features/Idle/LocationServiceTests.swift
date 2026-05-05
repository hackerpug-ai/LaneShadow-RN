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
}
