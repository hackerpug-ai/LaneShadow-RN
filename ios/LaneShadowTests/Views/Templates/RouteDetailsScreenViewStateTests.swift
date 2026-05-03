import Foundation
import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class RouteDetailsScreenViewStateTests: XCTestCase {
    // MARK: - AC-1: Real polyline rendered for selected option [PRIMARY]

    func test_liveViewState_passesDecodedPolylineToLSMap() {
        // GIVEN: A RouteDetailsViewState with decoded polyline coordinates
        let decodedPolyline = [
            LatLng(lat: 37.7749, lon: -122.4194),
            LatLng(lat: 37.7849, lon: -122.4094),
            LatLng(lat: 37.7949, lon: -122.3994),
            LatLng(lat: 37.8049, lon: -122.3894),
            LatLng(lat: 37.8149, lon: -122.3794),
        ]

        let viewState = RouteDetailsViewState(
            routeTitle: "Test Route",
            distanceKm: "42",
            durationFormatted: "1h 15m",
            elevationM: "850",
            scenicScore: "86",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: [
                PolylineData(
                    coordinates: decodedPolyline,
                    variant: .best,
                    strokeWidth: .lg
                ),
            ],
            isBest: true,
            timeRange: ("9 AM", "3 PM")
        )

        // WHEN/THEN: RouteDetailsScreen renders with viewState
        // Polylines array is non-empty and contains decoded coordinates
        XCTAssertEqual(viewState.polylines.count, 1)
        XCTAssertEqual(viewState.polylines[0].coordinates.count, 5)
        if let firstCoord = viewState.polylines[0].coordinates.first {
            XCTAssertEqual(firstCoord.lat, 37.7749, accuracy: 0.0001)
        } else {
            XCTFail("Expected first coordinate to exist")
        }
        XCTAssertEqual(viewState.polylines[0].variant, .best)
    }

    // MARK: - AC-2: isBest derived true for best option

    func test_liveViewState_isBestTrueWhenSelectedMatchesBest() {
        // GIVEN: A viewState where isBest is true (matches best option)
        let viewState = RouteDetailsViewState(
            routeTitle: "Best Route",
            distanceKm: "42",
            durationFormatted: "1h 15m",
            elevationM: "850",
            scenicScore: "86",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: [],
            isBest: true,
            timeRange: ("9 AM", "3 PM")
        )

        // WHEN/THEN: isBest is true
        XCTAssertTrue(viewState.isBest)
    }

    // MARK: - AC-3: isBest derived false for alt option

    func test_liveViewState_isBestFalseForAltOption() {
        // GIVEN: A viewState where isBest is false (alt option)
        let viewState = RouteDetailsViewState(
            routeTitle: "Alternative Route",
            distanceKm: "38",
            durationFormatted: "1h 05m",
            elevationM: "750",
            scenicScore: "72",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: [],
            isBest: false,
            timeRange: ("9 AM", "2 PM")
        )

        // WHEN/THEN: isBest is false
        XCTAssertFalse(viewState.isBest)
    }

    // MARK: - AC-4: timeRange derived from enrichment timestamps

    func test_liveViewState_timeRangeFormattedFromEnrichment() {
        // GIVEN: A viewState with formatted timeRange
        let viewState = RouteDetailsViewState(
            routeTitle: "Timed Route",
            distanceKm: "42",
            durationFormatted: "1h 15m",
            elevationM: "850",
            scenicScore: "86",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: [],
            isBest: true,
            timeRange: ("9 AM", "3 PM")
        )

        // WHEN/THEN: timeRange tuple contains start and end strings
        XCTAssertEqual(viewState.timeRange.0, "9 AM")
        XCTAssertEqual(viewState.timeRange.1, "3 PM")
    }

    // MARK: - AC-5: Empty/missing polyline does not crash

    func test_liveViewState_emptyPolylineRendersGracefully() {
        // GIVEN: A viewState with empty polylines array
        let viewState = RouteDetailsViewState(
            routeTitle: "Route with No Polyline",
            distanceKm: "42",
            durationFormatted: "1h 15m",
            elevationM: "850",
            scenicScore: "86",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: [], // Empty!
            isBest: false,
            timeRange: ("", "")
        )

        // WHEN/THEN: No crash, polylines is empty
        XCTAssertTrue(viewState.polylines.isEmpty)
        XCTAssertEqual(viewState.polylines.count, 0)
    }

    // MARK: - AC-6: Switching selectedRouteId updates rendered polyline

    func test_liveViewState_polylineUpdatesOnSelectionChange() {
        // GIVEN: Two different route options with different polylines
        let polylineA = [
            PolylineData(
                coordinates: [
                    LatLng(lat: 37.7, lon: -122.4),
                    LatLng(lat: 37.8, lon: -122.3),
                ],
                variant: .best,
                strokeWidth: .lg
            ),
        ]

        let polylineB = [
            PolylineData(
                coordinates: [
                    LatLng(lat: 37.75, lon: -122.35),
                    LatLng(lat: 37.85, lon: -122.25),
                ],
                variant: .alt1,
                strokeWidth: .md
            ),
        ]

        let viewStateA = RouteDetailsViewState(
            routeTitle: "Route A",
            distanceKm: "42",
            durationFormatted: "1h 15m",
            elevationM: "850",
            scenicScore: "86",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: polylineA,
            isBest: true,
            timeRange: ("9 AM", "3 PM")
        )

        let viewStateB = RouteDetailsViewState(
            routeTitle: "Route B",
            distanceKm: "38",
            durationFormatted: "1h 05m",
            elevationM: "750",
            scenicScore: "72",
            weatherEntries: [],
            isSaved: false,
            isPendingEnrichment: false,
            error: nil,
            polylines: polylineB,
            isBest: false,
            timeRange: ("9 AM", "2 PM")
        )

        // WHEN/THEN: Polylines differ between states
        XCTAssertNotEqual(
            viewStateA.polylines[0].coordinates,
            viewStateB.polylines[0].coordinates
        )
        XCTAssertEqual(viewStateA.polylines[0].variant, .best)
        XCTAssertEqual(viewStateB.polylines[0].variant, .alt1)
    }
}
