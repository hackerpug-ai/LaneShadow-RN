package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Geographic coordinate point
 *
 * Represents a latitude/longitude coordinate on Earth
 */
data class LatLng(
    val latitude: Double,
    val longitude: Double,
)

/**
 * DeviationPolyline component
 *
 * Displays route deviation information with original route, detour path, and reconnect point.
 * This is a map component that currently renders as a Canvas placeholder for demonstration.
 * When Google Maps SDK is integrated, this will wire into the actual map rendering.
 *
 * Following RN wrapper API from react-native/components/ui/map/deviation-polyline.tsx
 *
 * @param originalRoute List of LatLng points representing the original planned route
 * @param detourPath List of LatLng points representing the detour/alternate path
 * @param reconnectPoint Optional LatLng point where detour reconnects to original route
 * @param strokeWidth Width of the route lines in dp (default 6dp)
 * @param onPress Optional callback when the polyline is pressed
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the component container
 */
@Composable
fun DeviationPolyline(
    originalRoute: List<LatLng>,
    detourPath: List<LatLng>,
    reconnectPoint: LatLng? = null,
    strokeWidth: Dp = 6.dp,
    onPress: (() -> Unit)? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val isPreview = LocalInspectionMode.current

    // Map deviation colors from theme domain colors
    val originalRouteColor: Color = theme.domain.deviationOriginalRoute.default
    val detourPathColor: Color = theme.domain.deviationDetourPath.default
    val reconnectPointColor: Color = theme.domain.deviationReconnectPoint.default

    // Build content description for accessibility
    val contentDescription = buildDeviationContentDescription(
        originalRoute.size,
        detourPath.size,
        reconnectPoint != null,
    )

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .semantics {
                this.contentDescription = contentDescription
            },
    ) {
        val strokeWidthPx = strokeWidth.value * density

        // Draw original route (gray, solid line)
        if (originalRoute.size >= 2) {
            val originalPath = createPathFromPoints(originalRoute, size.width, size.height)
            drawPath(
                path = originalPath,
                color = originalRouteColor,
                style = Stroke(
                    width = strokeWidthPx,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f),
                ),
            )
        }

        // Draw detour path (orange, solid line)
        if (detourPath.size >= 2) {
            val detourPath = createPathFromPoints(detourPath, size.width, size.height)
            drawPath(
                path = detourPath,
                color = detourPathColor,
                style = Stroke(width = strokeWidthPx),
            )
        }

        // Draw reconnect point (green circle)
        if (reconnectPoint != null) {
            val reconnectOffset = latLngToOffset(
                reconnectPoint,
                originalRoute + detourPath,
                size.width,
                size.height,
            )
            drawCircle(
                color = reconnectPointColor,
                radius = strokeWidthPx * 1.5f,
                center = reconnectOffset,
            )
        }
    }
}

/**
 * Build accessibility content description for the deviation
 */
private fun buildDeviationContentDescription(
    originalPointCount: Int,
    detourPointCount: Int,
    hasReconnectPoint: Boolean,
): String {
    return buildString {
        append("Route deviation. ")
        append("Original route has $originalPointCount points. ")
        append("Detour path has $detourPointCount points. ")
        if (hasReconnectPoint) {
            append("Reconnect point marked.")
        }
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

    // Find bounding box of all points
    val minLat = points.minOfOrNull { it.latitude } ?: 0.0
    val maxLat = points.maxOfOrNull { it.latitude } ?: 0.0
    val minLon = points.minOfOrNull { it.longitude } ?: 0.0
    val maxLon = points.maxOfOrNull { it.longitude } ?: 0.0

    val latRange = maxLat - minLat
    val lonRange = maxLon - minLon

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
