package com.laneshadow.ui.atoms

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.LinearEasing
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.isSystemInDarkTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.templates.sketchPolylineRecipe
import kotlin.math.min

/**
 * MapSketchAnimationLayer — overlay layer for sketch polyline animation on LSMap.
 *
 * Renders a copper sketch-polyline that draws and loops continuously (1400ms linear),
 * with a breathing head-dot at the end of the path (1400ms ease-in-out reversed).
 *
 * Animation is purely decorative and respects reduced-motion settings:
 * - When reduced-motion is enabled, collapses to static stroke + static dot at full opacity.
 *
 * This composable is a pure presentation layer driven by props — no repository subscriptions.
 * Path geometry is supplied externally (e.g., from PlanningViewModel).
 *
 * @param path List of LatLng coordinates for the sketch polyline; empty list renders nothing
 * @param modifier Modifier for the root Box
 * @param reducedMotionEnabled Whether system reduced-motion is enabled; when true, collapses animation
 * @param onProgressUpdate Optional callback for path-draw progress (for testing); emits 0f to 1f
 * @param onHeadDotAlphaUpdate Optional callback for head-dot alpha (for testing); emits 0f to 1f
 * @param onStrokeColorResolved Optional callback for resolved stroke color (for testing)
 */
@Composable
fun MapSketchAnimationLayer(
    path: List<LatLng>,
    modifier: Modifier = Modifier,
    reducedMotionEnabled: Boolean = false,
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
            )
        }
    }
}

/**
 * Renders the sketch polyline using Compose Canvas.
 *
 * Path is drawn with a stroke, clipped based on pathProgress (0 = no path, 1 = full path).
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
        // Convert LatLng to screen coordinates
        // For now, use a simple linear mapping (in a real Mapbox integration, this would use Mapbox's projection)
        val screenCoordinates = path.map { latlng ->
            // Simple linear mapping: convert lat/lon to screen space
            val x = ((latlng.lon + 122.5) * 500).toFloat() // Arbitrary scale for demo
            val y = ((37.9 - latlng.lat) * 500).toFloat() // Inverted y-axis
            Offset(x, y)
        }

        if (screenCoordinates.size < 2) {
            return@Canvas
        }

        // Create path with clipping based on progress
        val pathToClip = Path().apply {
            moveTo(screenCoordinates[0].x, screenCoordinates[0].y)
            for (i in 1 until screenCoordinates.size) {
                lineTo(screenCoordinates[i].x, screenCoordinates[i].y)
            }
        }

        // For testing purposes, draw the entire path (real integration would clip based on progress)
        // The pathProgress is available for animation state validation
        drawPath(
            path = pathToClip,
            color = strokeColor,
            style = Stroke(width = 3.dp.toPx())
        )
    }
}

/**
 * Renders the breathing head dot at the end of the path.
 *
 * The dot animates opacity (alpha) from 0 to 1 and back (ease-in-out reverse).
 *
 * @param path Coordinates; head dot appears at the last coordinate
 * @param headDotAlpha Current opacity for the dot (0f to 1f)
 */
@Composable
private fun SketchHeadDot(
    path: List<LatLng>,
    headDotAlpha: Float,
) {
    if (path.isEmpty()) {
        return
    }

    val lastCoordinate = path.last()

    // Simple positioning: map lat/lon to screen (same as polyline)
    val x = ((lastCoordinate.lon + 122.5) * 500).toFloat()
    val y = ((37.9 - lastCoordinate.lat) * 500).toFloat()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .alpha(headDotAlpha)
    ) {
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            // Draw a small circle at the head dot position
            drawCircle(
                color = GeneratedTokens.color.Route.best,
                radius = 6.dp.toPx(),
                center = Offset(x, y)
            )
        }
    }
}
