package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color

/**
 * Cross-platform map coordinate.
 */
data class LatLng(
    val lat: Double,
    val lon: Double,
)

/**
 * Token-gated color reference for RouteVariant.custom.
 * Never a raw hex color — always a design token path.
 */
data class ColorToken(
    val path: String,
)

/**
 * Stroke size token for polylines.
 */
enum class StrokeSize {
    Sm,
    Md,
    Lg,
}

/**
 * Spacing token for camera fit padding.
 * Maps to LaneShadowSpace: spacing3→lg, spacing4→xl, spacing5→xxl
 */
enum class SpacingToken {
    Spacing3,
    Spacing4,
    Spacing5,
}

/**
 * Map camera position.
 */
data class CameraPosition(
    val center: LatLng,
    val zoom: Double,
    val pitch: Double? = null,
    val bearing: Double? = null,
)

/**
 * Annotation marker kind.
 */
enum class AnnotationKind {
    Start,
    End,
    Waypoint,
}

/**
 * Map annotation marker.
 */
data class Annotation(
    val kind: AnnotationKind,
    val coordinate: LatLng,
    val label: String? = null,
)

/**
 * Route variant for polyline styling.
 */
sealed class RouteVariant {
    data object Best : RouteVariant()
    data object Alt1 : RouteVariant()
    data object Alt2 : RouteVariant()
    data class Custom(val color: ColorToken) : RouteVariant()
}

/**
 * Polyline data for rendering route lines.
 */
data class PolylineData(
    val coordinates: List<LatLng>,
    val variant: RouteVariant,
    val strokeWidth: StrokeSize? = StrokeSize.Md,
)

/**
 * Map interaction mode.
 */
enum class MapMode {
    Preview,
    Interactive,
}

/**
 * Camera fit mode.
 */
sealed class CameraFit {
    data object Static : CameraFit()
    data class Polyline(val padding: SpacingToken) : CameraFit()
    data class Polylines(val padding: SpacingToken) : CameraFit()
}

/**
 * Map error states.
 */
enum class MapError {
    MissingToken,
    NetworkUnavailable,
    StyleLoadFailed,
}
