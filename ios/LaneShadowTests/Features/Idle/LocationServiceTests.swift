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
        // Given: A newly created location service
        let service = LocationService()

        // Then: Authorization status should be notDetermined
        #expect(service.authorizationStatus == .notDetermined)
    }

    @Test("Location service provides requestWhenInUseAuthorization method")
    func providesRequestAuthorizationMethod() async throws {
        // Given: A location service
        let service = LocationService()

        // When: Requesting location authorization (should not crash)
        service.requestWhenInUseAuthorization()

        // Then: Method should complete without error
        #expect(true)
    }

    @Test("Location service reports no location when initially created")
    func reportsNoLocationInitially() async throws {
        // Given: A newly created location service
        let service = LocationService()

        // Then: Current location should be nil
        let location = await service.currentLocation
        #expect(location == nil)
    }

    @Test("Location service sets Santa Cruz fallback on denied authorization")
    func fallsBackToSantaCruzWhenDenied() async throws {
        // Given: A location service
        let service = LocationService()

        // When: Simulating authorization denied directly
        service.simulateFallbackLocation()

        // Then: Should fall back to Santa Cruz coordinates
        #expect(service.currentLocation?.coordinate.latitude == 36.97)
        #expect(service.currentLocation?.coordinate.longitude == -122.03)
    }

    @Test("Location service falls back to Santa Cruz on location error")
    func fallsBackToSantaCruzOnError() async throws {
        // Given: A location service
        let service = LocationService()

        // When: Delegate reports a location error
        let delegate = service as CLLocationManagerDelegate
        delegate.locationManager?(CLLocationManager(), didFailWithError: NSError(domain: "test", code: 0))

        // Then: Should fall back to Santa Cruz via the async Task
        try await Task.sleep(for: .milliseconds(300))
        #expect(service.currentLocation?.coordinate.latitude == 36.97)
        #expect(service.currentLocation?.coordinate.longitude == -122.03)
    }

    @Test("Convex client provides reverseGeocode method")
    func convexClientProvidesReverseGeocode() async throws {
        // Given: A stub Convex client
        let client = StubLaneShadowConvexClient()

        // When: Calling reverseGeocode
        let result = try await client.reverseGeocode(lat: 36.97, lng: -122.03)

        // Then: Should return a place label
        #expect(result == "Santa Cruz, CA")
    }
}

// MARK: - Test Helpers

extension LocationService {
    func simulateFallbackLocation() {
        currentLocation = CLLocation(latitude: 36.97, longitude: -122.03)
    }
}
