import CoreLocation
import Foundation
import Observation

@MainActor
@Observable
final class LocationService: NSObject {
    var currentLocation: CLLocation?
    var authorizationStatus: CLAuthorizationStatus = .notDetermined

    @ObservationIgnored private let locationManager: CLLocationManager

    override init() {
        self.locationManager = CLLocationManager()
        super.init()
        self.locationManager.delegate = self
    }

    func requestWhenInUseAuthorization() {
        locationManager.requestWhenInUseAuthorization()
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        Task { @MainActor in
            authorizationStatus = status

            switch status {
            case .authorizedWhenInUse, .authorizedAlways:
                // Request location updates
                locationManager.requestLocation()
            case .denied, .restricted:
                // Fall back to Santa Cruz coordinates
                currentLocation = CLLocation(latitude: 36.97, longitude: -122.03)
            case .notDetermined:
                break
            @unknown default:
                break
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            currentLocation = locations.last
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            // On failure, fall back to Santa Cruz
            currentLocation = CLLocation(latitude: 36.97, longitude: -122.03)
        }
    }
}
