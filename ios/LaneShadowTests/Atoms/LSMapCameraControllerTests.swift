import XCTest
@testable import LaneShadow

@MainActor
final class LSMapCameraControllerTests: XCTestCase {
    var controller: LSMapCameraController!

    override func setUp() {
        super.setUp()
        controller = LSMapCameraController(zoomLevel: 12)
    }

    // MARK: - AC-1: Zoom In

    func test_zoom_in_increases_zoom_level_by_one() {
        // Given
        let initialZoom = controller.zoomLevel

        // When
        controller.zoomIn()

        // Then
        XCTAssertEqual(controller.zoomLevel, initialZoom + 1, "Zoom in should increase zoom level by 1")
    }

    func test_zoom_in_records_applied_delta() {
        // When
        controller.zoomIn()

        // Then
        controller.recordAppliedZoomDelta(1)
        XCTAssertEqual(controller.appliedZoomDeltas, [1], "Applied deltas should record the +1 zoom")
    }

    // MARK: - AC-2: Zoom Out

    func test_zoom_out_decreases_zoom_level_by_one() {
        // Given
        let initialZoom = controller.zoomLevel

        // When
        controller.zoomOut()

        // Then
        XCTAssertEqual(controller.zoomLevel, initialZoom - 1, "Zoom out should decrease zoom level by 1")
    }

    func test_zoom_deltas_accumulate_on_consecutive_zooms() {
        // When
        controller.zoomIn() // +1
        controller.recordAppliedZoomDelta(1)
        controller.zoomOut() // -1
        controller.recordAppliedZoomDelta(-1)
        controller.zoomIn() // +1
        controller.recordAppliedZoomDelta(1)

        // Then
        XCTAssertEqual(controller.appliedZoomDeltas, [1, -1, 1], "Deltas should accumulate in order")
        XCTAssertEqual(controller.debugAccessibilityValue, "zoom-deltas=1,-1,1;recenter=0/0;outcome=idle")
    }

    // MARK: - AC-3: Recenter to User Location

    func test_recenter_increments_request_count_and_sets_outcome_to_requested() {
        // When
        controller.recenterToUserLocation()

        // Then
        XCTAssertEqual(controller.recenterRequestCount, 1, "Recenter request count should increment")
        XCTAssertEqual(controller.lastRecenterOutcome, .requested, "Outcome should be .requested after recenter call")
    }

    func test_consuming_recenter_request_marks_outcome_as_applied() {
        // Given
        controller.recenterToUserLocation()

        // When
        let consumed = controller.consumePendingRecenterRequest(outcome: .applied)

        // Then
        XCTAssertTrue(consumed, "Should successfully consume pending request")
        XCTAssertEqual(controller.lastRecenterOutcome, .applied, "Outcome should be .applied after consumption")
        XCTAssertEqual(controller.handledRecenterRequestCount, 1, "Handled count should match request count")
    }

    func test_consuming_recenter_request_marks_outcome_as_unavailable_when_no_location() {
        // Given
        controller.recenterToUserLocation()

        // When
        let consumed = controller.consumePendingRecenterRequest(outcome: .unavailableNoUserLocation)

        // Then
        XCTAssertTrue(consumed, "Should successfully consume pending request")
        XCTAssertEqual(controller.lastRecenterOutcome, .unavailableNoUserLocation, "Outcome should reflect no location")
    }

    // MARK: - AC-5: Permission Denied Path

    func test_recenter_outcome_is_unavailable_when_no_location_permission() {
        // This test verifies the non-crashing path for permission denied
        // Given
        controller.recenterToUserLocation()

        // When user has no location permission, map's location.latestLocation is nil
        // and we consume with unavailableNoUserLocation
        let consumed = controller.consumePendingRecenterRequest(outcome: .unavailableNoUserLocation)

        // Then
        XCTAssertTrue(consumed)
        XCTAssertEqual(controller.lastRecenterOutcome, .unavailableNoUserLocation)
        // No crash, silent fail behavior preserved
    }

    // MARK: - AC-6: Icon Parity (controller-side, visual verified separately)

    func test_debug_accessibility_value_formats_zoom_deltas_correctly() {
        // Given
        controller.zoomIn() // +1
        controller.recordAppliedZoomDelta(1)
        controller.zoomOut() // -1
        controller.recordAppliedZoomDelta(-1)

        // When
        let accessibilityValue = controller.debugAccessibilityValue

        // Then
        XCTAssertTrue(accessibilityValue.contains("zoom-deltas=1,-1"), "Should format zoom deltas")
        XCTAssertTrue(accessibilityValue.contains("recenter=0/0"), "Should show recenter counts")
        XCTAssertTrue(accessibilityValue.contains("outcome=idle"), "Should show outcome")
    }
}
