package com.laneshadow.ui.atoms

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Unit tests for LSMapCameraController.
 * Tests zoom, recenter, and delta tracking per AC-1 through AC-5.
 */
class LSMapCameraControllerTest {

    @Test
    fun zoomIn_incrementsZoomLevel() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 10.0)

        // WHEN
        controller.zoomIn()

        // THEN
        assertEquals(11.0, controller.zoomLevel, 0.001)
    }

    @Test
    fun zoomIn_recordsDeltaOfOne() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 10.0)

        // WHEN
        controller.zoomIn()
        controller.recordAppliedZoomDelta(1.0)

        // THEN
        assertEquals(listOf(1.0), controller.appliedZoomDeltas)
    }

    @Test
    fun zoomOut_decrementsZoomLevel() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 10.0)

        // WHEN
        controller.zoomOut()

        // THEN
        assertEquals(9.0, controller.zoomLevel, 0.001)
    }

    @Test
    fun zoomOut_recordsDeltaOfNegativeOne() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 10.0)

        // WHEN
        controller.zoomOut()
        controller.recordAppliedZoomDelta(-1.0)

        // THEN
        assertEquals(listOf(-1.0), controller.appliedZoomDeltas)
    }

    @Test
    fun multipleZoomActions_accumulateDeltasInOrder() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 10.0)

        // WHEN
        controller.zoomIn()
        controller.recordAppliedZoomDelta(1.0)
        controller.zoomIn()
        controller.recordAppliedZoomDelta(1.0)
        controller.zoomOut()
        controller.recordAppliedZoomDelta(-1.0)

        // THEN
        assertEquals(listOf(1.0, 1.0, -1.0), controller.appliedZoomDeltas)
        assertEquals(11.0, controller.zoomLevel, 0.001)
    }

    @Test
    fun recenterToUserLocation_incrementsRequestCount() {
        // GIVEN
        val controller = LSMapCameraController()

        // WHEN
        controller.recenterToUserLocation()

        // THEN
        assertEquals(1, controller.recenterRequestCount)
        assertEquals(RecenterOutcome.Requested, controller.lastRecenterOutcome)
    }

    @Test
    fun consumePendingRecenterRequest_returnsTrue_andMarksHandled() {
        // GIVEN
        val controller = LSMapCameraController()
        controller.recenterToUserLocation()

        // WHEN
        val consumed = controller.consumePendingRecenterRequest(RecenterOutcome.Applied)

        // THEN
        assertEquals(true, consumed)
        assertEquals(1, controller.handledRecenterRequestCount)
        assertEquals(RecenterOutcome.Applied, controller.lastRecenterOutcome)
    }

    @Test
    fun consumePendingRecenterRequest_returnsTrue_forUnavailableNoUserLocation() {
        // GIVEN
        val controller = LSMapCameraController()
        controller.recenterToUserLocation()

        // WHEN
        val consumed = controller.consumePendingRecenterRequest(RecenterOutcome.UnavailableNoUserLocation)

        // THEN
        assertEquals(true, consumed)
        assertEquals(RecenterOutcome.UnavailableNoUserLocation, controller.lastRecenterOutcome)
    }

    @Test
    fun consumePendingRecenterRequest_returnsFalse_whenNoRequestPending() {
        // GIVEN
        val controller = LSMapCameraController()

        // WHEN
        val consumed = controller.consumePendingRecenterRequest(RecenterOutcome.Applied)

        // THEN
        assertEquals(false, consumed)
    }

    @Test
    fun recordAppliedZoomDelta_ignoresZeroDelta() {
        // GIVEN
        val controller = LSMapCameraController()

        // WHEN
        controller.recordAppliedZoomDelta(0.0)

        // THEN
        assertEquals(emptyList<Double>(), controller.appliedZoomDeltas)
    }

    @Test
    fun debugAccessibilityValue_formatsZoomDeltasAndRecenterInfo() {
        // GIVEN
        val controller = LSMapCameraController(initialZoom = 12.0)
        controller.zoomIn()
        controller.recordAppliedZoomDelta(1.0)
        controller.zoomOut()
        controller.recordAppliedZoomDelta(-1.0)
        controller.recenterToUserLocation()
        controller.consumePendingRecenterRequest(RecenterOutcome.Applied)

        // WHEN
        val debugValue = controller.debugAccessibilityValue

        // THEN
        // Should contain zoom deltas, recenter counts, and outcome
        assert(debugValue.contains("zoom-deltas"))
        assert(debugValue.contains("recenter=1/1"))
        assert(debugValue.contains("outcome=applied"))
    }
}

enum class RecenterOutcome(val rawValue: String) {
    Idle("idle"),
    Requested("requested"),
    Applied("applied"),
    UnavailableNoUserLocation("unavailable-no-user-location"),
}
