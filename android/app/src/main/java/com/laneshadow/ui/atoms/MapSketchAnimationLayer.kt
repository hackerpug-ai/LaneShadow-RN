package com.laneshadow.ui.atoms

import android.graphics.PathMeasure
import android.provider.Settings
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.isSystemInDarkTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.templates.sketchPolylineRecipe
import kotlin.math.max
import kotlin.math.min

/**
 * MapSketchAnimationLayer — overlay layer for sketch polyline animation on LSMap.
 *
 * Renders a copper sketch-polyline that draws and loops continuously (1400ms linear),
 * with a breathing head-dot at the end of the path (1400ms ease-in-out reversed).
 *
 * Animation is purely decorative and respects reduced-motion settings:
 * - When system animator-duration-scale is 0, collapses to static stroke + static dot at full opacity.
 *
 * This composable is a pure presentation layer driven by props — no repository subscriptions.
 * Path geometry is supplied externally (e.g., from PlanningViewModel).
 *
 * @param path List of LatLng coordinates for the sketch polyline; empty list renders nothing
 * @param modifier Modifier for the root Box
 * @param onProgressUpdate Optional callback for path-draw progress (for testing); emits 0f to 1f
 * @param onHeadDotAlphaUpdate Optional callback for head-dot alpha (for testing); emits 0f to 1f
 * @param onStrokeColorResolved Optional callback for resolved stroke color (for testing)
 */
@Composable
fun MapSketchAnimationLayer(
    path: List<LatLng>,
    modifier: Modifier = Modifier,
    onProgressUpdate: ((Float) -> Unit)? = null,
    onHeadDotAlphaUpdate: ((Float) -> Unit)? = null,
    onStrokeColorResolved: ((Color) -> Unit)? = null,
) {
    // Resolve theme tokens
    val theme = LocalLaneShadowTheme.current
    val sketchRecipe = sketchPolylineRecipe(theme)

    // Resolve stroke color via theme token (no hex literals)
    val isDarkTheme = isSystemInDarkTheme()
    val strokeColor = if (isDarkTheme) {
        GeneratedTokens.color.Route.dark.best
    } else {
        GeneratedTokens.color.Route.best
    }

    // Notify color resolution for testing
    LaunchedEffect(strokeColor) {
        onStrokeColorResolved?.invoke(strokeColor)
    }

    // Handle empty path
    if (path.isEmpty()) {
        return
    }

    // Read system reduced-motion setting
    val context = LocalContext.current
    val reducedMotionEnabled = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) == 0f
    }

    // Animation setup
    if (reducedMotionEnabled) {
        // Static state: both animations collapsed
        LaunchedEffect(Unit) {
            onProgressUpdate?.invoke(1f)
            onHeadDotAlphaUpdate?.invoke(1f)
        }

        // Render static polyline + head dot
        Box(modifier = modifier.fillMaxSize()) {
            SketchPolylineCanvas(
                path = path,
                strokeColor = strokeColor,
                pathProgress = 1f,
            )
            SketchHeadDot(
                path = path,
                headDotAlpha = 1f,
                headDotColor = strokeColor,
            )
        }
    } else {
        // Animated state
        val infiniteTransition = rememberInfiniteTransition(label = "sketch_polyline_animation")

        // Path-draw progress: 0→1 at 1400ms linear, infinite loop
        val pathProgress by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(
                animation = tween(sketchRecipe.durationMillis, easing = sketchRecipe.easing),
                repeatMode = RepeatMode.Restart
            ),
            label = "sketch_polyline_progress",
        )

        // Head-dot breathing: 0→1→0 at 1400ms ease-in-out, infinite reverse cycle
        val headDotAlpha by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(
                animation = tween(
                    sketchRecipe.durationMillis,
                    easing = EaseInOut
                ),
                repeatMode = RepeatMode.Reverse
            ),
            label = "sketch_head_dot_alpha",
        )

        // Notify callbacks for testing
        LaunchedEffect(pathProgress) {
            onProgressUpdate?.invoke(pathProgress)
        }
        LaunchedEffect(headDotAlpha) {
            onHeadDotAlphaUpdate?.invoke(headDotAlpha)
        }

        // Render animated polyline + breathing head dot
        Box(modifier = modifier.fillMaxSize()) {
            SketchPolylineCanvas(
                path = path,
                strokeColor = strokeColor,
                pathProgress = pathProgress,
            )
            SketchHeadDot(
                path = path,
                headDotAlpha = headDotAlpha,
                headDotColor = strokeColor,
            )
        }
    }
}

/**
 * Renders the sketch polyline using Compose Canvas.
 *
 * Path is drawn with a stroke, clipped based on pathProgress (0 = no path, 1 = full path).
 * Uses PathMeasure to draw only the portion of the path corresponding to pathProgress.
 *
 * @param path Coordinates to draw
 * @param strokeColor Color of the stroke (token-resolved)
 * @param pathProgress Clipping progress (0f to 1f)
 */
@Composable
private fun SketchPolylineCanvas(
    path: List<LatLng>,
    strokeColor: Color,
    pathProgress: Float,
) {
    if (path.isEmpty()) {
        return
    }

    Canvas(
        modifier = Modifier.fillMaxSize()
    ) {
        // Convert LatLng to screen coordinates using bounding-box normalization
        val screenCoordinates = path.map { latlng ->
            // Normalize lat/lon to screen space via bounding box
            Offset(latlng.lon.toFloat(), latlng.lat.toFloat())
        }

        if (screenCoordinates.size < 2) {
            return@Canvas
        }

        // Compute bounding box to normalize coordinates to 0..1
        val minLon = screenCoordinates.minOf { it.x }
        val maxLon = screenCoordinates.maxOf { it.x }
        val minLat = screenCoordinates.minOf { it.y }
        val maxLat = screenCoordinates.maxOf { it.y }

        val lonRange = maxLon - minLon
        val latRange = maxLat - minLat

        // Prevent division by zero for degenerate paths
        val safeRange = max(lonRange, latRange).coerceAtLeast(0.001f)

        // Map normalized coordinates to canvas pixel space
        val canvasSize = size
        val normalizedCoordinates = screenCoordinates.map { offset ->
            val normLon = if (lonRange > 0.001f) (offset.x - minLon) / lonRange else 0.5f
            val normLat = if (latRange > 0.001f) (offset.y - minLat) / latRange else 0.5f

            // Scale to canvas and apply padding
            val padding = canvasSize.minDimension * 0.1f
            val drawableWidth = canvasSize.width - 2 * padding
            val drawableHeight = canvasSize.height - 2 * padding

            Offset(
                padding + normLon * drawableWidth,
                padding + (1 - normLat) * drawableHeight // Invert y-axis for screen coords
            )
        }

        // Create partial path based on pathProgress
        // Draw only up to the progress percentage of the total path
        if (normalizedCoordinates.isNotEmpty() && pathProgress > 0f) {
            val drawnPoints = kotlin.math.ceil(
                normalizedCoordinates.size * pathProgress
            ).toInt().coerceAtLeast(1)

            val pathToClip = Path().apply {
                moveTo(normalizedCoordinates[0].x, normalizedCoordinates[0].y)
                for (i in 1 until drawnPoints) {
                    lineTo(normalizedCoordinates[i].x, normalizedCoordinates[i].y)
                }

                // If pathProgress is between two points, interpolate the final segment
                if (drawnPoints < normalizedCoordinates.size) {
                    val progress = (normalizedCoordinates.size * pathProgress) % 1f
                    val currentPoint = normalizedCoordinates[drawnPoints - 1]
                    val nextPoint = normalizedCoordinates[drawnPoints]
                    val interpolatedX = currentPoint.x + (nextPoint.x - currentPoint.x) * progress
                    val interpolatedY = currentPoint.y + (nextPoint.y - currentPoint.y) * progress
                    lineTo(interpolatedX, interpolatedY)
                }
            }

            drawPath(
                path = pathToClip,
                color = strokeColor,
                style = Stroke(width = 3.dp.toPx())
            )
        }
    }
}

/**
 * Renders the breathing head dot at the end of the path.
 *
 * The dot animates opacity (alpha) from 0 to 1 and back (ease-in-out reverse).
 *
 * @param path Coordinates; head dot appears at the last coordinate
 * @param headDotAlpha Current opacity for the dot (0f to 1f)
 * @param headDotColor Color of the dot (theme-resolved, passed from parent)
 */
@Composable
private fun SketchHeadDot(
    path: List<LatLng>,
    headDotAlpha: Float,
    headDotColor: Color,
) {
    if (path.isEmpty()) {
        return
    }

    val lastCoordinate = path.last()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .alpha(headDotAlpha)
    ) {
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            // Normalize coordinates to screen space (same as polyline)
            // All coordinates are from the same path, so we compute bounding box once
            val allX = path.map { it.lon.toFloat() }
            val allY = path.map { it.lat.toFloat() }

            val minLon = allX.minOrNull() ?: 0f
            val maxLon = allX.maxOrNull() ?: 1f
            val minLat = allY.minOrNull() ?: 0f
            val maxLat = allY.maxOrNull() ?: 1f

            val lonRange = maxLon - minLon
            val latRange = maxLat - minLat

            val safeRange = max(lonRange, latRange).coerceAtLeast(0.001f)

            // Map normalized coordinates to canvas pixel space
            val canvasSize = size
            val padding = canvasSize.minDimension * 0.1f
            val drawableWidth = canvasSize.width - 2 * padding
            val drawableHeight = canvasSize.height - 2 * padding

            val normLon =
                if (lonRange > 0.001f) (lastCoordinate.lon.toFloat() - minLon) / lonRange else 0.5f
            val normLat =
                if (latRange > 0.001f) (lastCoordinate.lat.toFloat() - minLat) / latRange else 0.5f

            val x = padding + normLon * drawableWidth
            val y = padding + (1 - normLat) * drawableHeight

            // Draw a small circle at the head dot position
            drawCircle(
                color = headDotColor,
                radius = 6.dp.toPx(),
                center = Offset(x, y)
            )
        }
    }
}
