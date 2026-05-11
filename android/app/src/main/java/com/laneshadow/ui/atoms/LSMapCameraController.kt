package com.laneshadow.ui.atoms

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * LSMapCameraController — Kotlin Compose equivalent of iOS LSMapCameraController.
 *
 * Manages zoom level and recenter-to-user-location requests, tracking applied deltas
 * for instrumentation and testing. Exposes a debugAccessibilityValue for test inspection.
 */
class LSMapCameraController(
    initialZoom: Double = 12.0,
) {
    var zoomLevel by mutableStateOf(initialZoom)
        private set

    private val _appliedZoomDeltas = mutableListOf<Double>()
    val appliedZoomDeltas: List<Double> get() = _appliedZoomDeltas.toList()

    var recenterRequestCount by mutableStateOf(0)
        private set

    var handledRecenterRequestCount by mutableStateOf(0)
        private set

    var lastRecenterOutcome by mutableStateOf(RecenterOutcome.Idle)
        private set

    fun zoomIn(step: Double = 1.0) {
        zoomLevel += step
    }

    fun zoomOut(step: Double = 1.0) {
        zoomLevel -= step
    }

    fun recenterToUserLocation() {
        recenterRequestCount += 1
        lastRecenterOutcome = RecenterOutcome.Requested
    }

    fun recordAppliedZoomDelta(delta: Double) {
        if (delta != 0.0) {
            _appliedZoomDeltas.add(delta)
        }
    }

    fun consumePendingRecenterRequest(outcome: RecenterOutcome): Boolean {
        if (handledRecenterRequestCount >= recenterRequestCount) {
            return false
        }

        handledRecenterRequestCount = recenterRequestCount
        lastRecenterOutcome = outcome
        return true
    }

    val debugAccessibilityValue: String
        get() {
            val zoomDeltas = _appliedZoomDeltas
                .map { formatDelta(it) }
                .joinToString(",")
            return "zoom-deltas=$zoomDeltas;recenter=$handledRecenterRequestCount/$recenterRequestCount;outcome=${lastRecenterOutcome.rawValue}"
        }

    companion object {
        private fun formatDelta(delta: Double): String {
            return if (delta == delta.toLong().toDouble()) {
                String.format("%.0f", delta)
            } else {
                delta.toString()
            }
        }
    }
}

enum class RecenterOutcome(val rawValue: String) {
    Idle("idle"),
    Requested("requested"),
    Applied("applied"),
    UnavailableNoUserLocation("unavailable-no-user-location"),
}
