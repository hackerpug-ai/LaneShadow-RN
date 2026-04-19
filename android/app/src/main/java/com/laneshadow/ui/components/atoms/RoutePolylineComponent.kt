package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * RoutePolylineComponent
 *
 * A higher-level route polyline component that wraps the basic RoutePolyline concept
 * with route-specific data and selection state semantics.
 *
 * This component provides a simplified API for route rendering with selection state,
 * supporting both overview routes and individual route legs.
 *
 * @param isSelected Selection state determines color styling (default: false)
 * @param coordinates List of LatLng points representing the route path
 * @param strokeWidth Width of the route line in dp for overview routes (default: 6dp)
 * @param legStrokeWidth Width of the route line in dp for route legs (default: 4dp)
 * @param onPress Optional callback when the polyline is pressed
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the component container
 */
@Composable
fun RoutePolylineComponent(
    isSelected: Boolean = false,
    coordinates: List<LatLng>,
    strokeWidth: Dp = 6.dp,
    legStrokeWidth: Dp = 4.dp,
    onPress: (() -> Unit)? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val isPreview = LocalInspectionMode.current

    // Map route colors from theme based on selection state
    val routeColor = if (isSelected) {
        theme.colors.routeSelected.default
    } else {
        theme.colors.onSurface.default.copy(alpha = 0.7f)
    }

    // Build content description for accessibility
    val contentDescription = buildRouteComponentContentDescription(
        coordinates.size,
        isSelected,
    )

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .semantics {
                this.contentDescription = contentDescription
            },
    ) {
        val strokeWidthPx = strokeWidth.value * density

        // Draw route polyline
        if (coordinates.size >= 2) {
            val path = createPathFromPoints(coordinates, size.width, size.height)
            drawPath(
                path = path,
                color = routeColor,
                style = Stroke(
                    width = strokeWidthPx,
                ),
            )
        }
    }
}

/**
 * Build accessibility content description for the route component
 */
private fun buildRouteComponentContentDescription(
    pointCount: Int,
    isSelected: Boolean,
): String {
    return buildString {
        val stateText = if (isSelected) "selected" else "alternate"
        append("$stateText route. ")
        append("Contains $pointCount coordinate points.")
    }
}

/**
 * Create a Compose Path from a list of LatLng points
 *
 * This is a simplified implementation that maps geographic coordinates
 * to canvas coordinates for demonstration purposes.
 * In production with Google Maps SDK, this would be handled by the map platform.
 */
private fun createPathFromPoints(
    points: List<LatLng>,
    canvasWidth: Float,
    canvasHeight: Float,
): Path {
    val path = Path()

    if (points.isEmpty()) return path

    // Map first point
    val firstOffset = latLngToOffset(
        points[0],
        points,
        canvasWidth,
        canvasHeight,
    )
    path.moveTo(firstOffset.x, firstOffset.y)

    // Map remaining points
    for (i in 1 until points.size) {
        val offset = latLngToOffset(
            points[i],
            points,
            canvasWidth,
            canvasHeight,
        )
        path.lineTo(offset.x, offset.y)
    }

    return path
}

/**
 * Convert a LatLng point to canvas Offset
 *
 * This is a simplified projection that maps geographic coordinates
 * to canvas space for demonstration purposes.
 * Uses linear interpolation within the bounding box of all points.
 */
private fun latLngToOffset(
    point: LatLng,
    allPoints: List<LatLng>,
    canvasWidth: Float,
    canvasHeight: Float,
): Offset {
    if (allPoints.isEmpty()) {
        return Offset(canvasWidth / 2f, canvasHeight / 2f)
    }

    val minLat = allPoints.minOfOrNull { it.latitude } ?: point.latitude
    val maxLat = allPoints.maxOfOrNull { it.latitude } ?: point.latitude
    val minLon = allPoints.minOfOrNull { it.longitude } ?: point.longitude
    val maxLon = allPoints.maxOfOrNull { it.longitude } ?: point.longitude

    val latRange = maxLat - minLat
    val lonRange = maxLon - minLon

    // Add padding to prevent drawing on edges
    val padding = 20f
    val usableWidth = canvasWidth - 2 * padding
    val usableHeight = canvasHeight - 2 * padding

    val x: Float = if (lonRange > 0) {
        (padding + (point.longitude - minLon) / lonRange * usableWidth).toFloat()
    } else {
        canvasWidth / 2f
    }

    val y: Float = if (latRange > 0) {
        (padding + (1 - (point.latitude - minLat) / latRange) * usableHeight).toFloat()
    } else {
        canvasHeight / 2f
    }

    return Offset.Unspecified.copy(x = x, y = y)
}
