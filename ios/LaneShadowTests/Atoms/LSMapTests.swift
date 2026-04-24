import XCTest
@testable import LaneShadow

final class LSMapTests: XCTestCase {
    func test_latlng_initializes_correctly() {
        let coordinate = LatLng(lat: 37.7749, lon: -122.4194)

        XCTAssertEqual(coordinate.lat, 37.7749, accuracy: 0.0001)
        XCTAssertEqual(coordinate.lon, -122.4194, accuracy: 0.0001)
    }

    func test_camera_position_initializes() {
        let center = LatLng(lat: 37.7749, lon: -122.4194)
        let camera = CameraPosition(
            center: center,
            zoom: 12.0,
            pitch: 45.0,
            bearing: 90.0
        )

        XCTAssertEqual(camera.center.lat, 37.7749, accuracy: 0.0001)
        XCTAssertEqual(camera.zoom, 12.0, accuracy: 0.1)
        XCTAssertEqual(camera.pitch ?? 0, 45.0, accuracy: 0.1)
        XCTAssertEqual(camera.bearing ?? 0, 90.0, accuracy: 0.1)
    }

    func test_camera_position_optional_pitch_bearing() {
        let center = LatLng(lat: 37.7749, lon: -122.4194)
        let camera = CameraPosition(center: center, zoom: 12.0)

        XCTAssertNil(camera.pitch)
        XCTAssertNil(camera.bearing)
    }

    func test_polyline_data_initializes() {
        let coordinates = [
            LatLng(lat: 37.7749, lon: -122.4194),
            LatLng(lat: 37.8078, lon: -122.4750),
        ]
        let polyline = PolylineData(
            coordinates: coordinates,
            variant: .best,
            strokeWidth: .md
        )

        XCTAssertEqual(polyline.coordinates.count, 2)
        XCTAssertEqual(polyline.variant, .best)
        XCTAssertEqual(polyline.strokeWidth, .md)
    }

    func test_polyline_data_default_stroke_width() {
        let coordinates = [LatLng(lat: 37.7749, lon: -122.4194)]
        let polyline = PolylineData(
            coordinates: coordinates,
            variant: .best
        )

        XCTAssertEqual(polyline.strokeWidth, .md)
    }

    func test_map_mode_preview_case() {
        let mode = MapMode.preview

        XCTAssertEqual(mode, .preview)
        XCTAssertEqual(mode.rawValue, "preview")
    }

    func test_map_mode_interactive_case() {
        let mode = MapMode.interactive

        XCTAssertEqual(mode, .interactive)
        XCTAssertEqual(mode.rawValue, "interactive")
    }

    func test_camera_fit_static_case() {
        let fit = CameraFit.static

        XCTAssertEqual(fit, .static)
    }

    func test_camera_fit_polyline_case() {
        let fit = CameraFit.polyline(padding: .spacing4)

        if case let .polyline(padding) = fit {
            XCTAssertEqual(padding, .spacing4)
        } else {
            XCTFail("Expected .polyline case")
        }
    }

    func test_camera_fit_polylines_case() {
        let fit = CameraFit.polylines(padding: .spacing4)

        if case let .polylines(padding) = fit {
            XCTAssertEqual(padding, .spacing4)
        } else {
            XCTFail("Expected .polylines case")
        }
    }

    func test_map_error_missing_token_case() {
        let error = MapError.missingToken

        XCTAssertEqual(error, .missingToken)
        XCTAssertEqual(error.rawValue, "missingToken")
    }

    func test_map_error_network_unavailable_case() {
        let error = MapError.networkUnavailable

        XCTAssertEqual(error, .networkUnavailable)
        XCTAssertEqual(error.rawValue, "networkUnavailable")
    }

    func test_map_error_style_load_failed_case() {
        let error = MapError.styleLoadFailed

        XCTAssertEqual(error, .styleLoadFailed)
        XCTAssertEqual(error.rawValue, "styleLoadFailed")
    }
}
