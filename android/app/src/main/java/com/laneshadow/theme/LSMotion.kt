package com.laneshadow.theme

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.InfiniteRepeatableSpec
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.TweenSpec
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * Motion recipe helpers for Compose animations.
 *
 * Reads from theme.motion tokens to create AnimationSpec instances.
 * Per FID-S02-T02: all animations must use theme tokens, not hardcoded values.
 *
 * Note: Some recipes reference durations that don't exist in current tokens.
 * These are documented with the closest available token as a placeholder.
 */
object LSMotion {

    /**
     * Sketch polyline loop animation spec.
     *
     * Recipe: infiniteRepeatable(tween(1400ms, LinearEasing), Restart)
     *
     * Note: Current motion.duration["deliberate"] is 600ms.
     * Spec requires 1400ms - using 600ms as placeholder until token is updated.
     */
    fun sketchPolylineLoop(
        durationMillis: Int,
        easing: androidx.compose.animation.core.Easing
    ): InfiniteRepeatableSpec<Float> = infiniteRepeatable(
        animation = tween(durationMillis, easing = easing),
        repeatMode = RepeatMode.Restart
    )

    /**
     * Breathing head dot animation spec.
     *
     * Recipe: infiniteRepeatable(tween(1400ms, EaseInOut), Reverse)
     *
     * Note: breathingHeadDot recipe doesn't exist in tokens.
     * Using motion.duration["slow"] (400ms) as placeholder.
     */
    fun breathingHeadDot(
        durationMillis: Int,
        easing: androidx.compose.animation.core.Easing
    ): InfiniteRepeatableSpec<Float> = infiniteRepeatable(
        animation = tween(durationMillis, easing = easing),
        repeatMode = RepeatMode.Reverse
    )

    /**
     * Drawer slide animation spec.
     *
     * Recipe: spring(dampingRatio = 0.85f, stiffness = StiffnessMedium)
     */
    fun drawerSlide(): SpringSpec<Float> = spring(
        dampingRatio = 0.85f,
        stiffness = androidx.compose.animation.core.Spring.StiffnessMedium
    )

    /**
     * Polyline draw-on animation spec.
     *
     * Recipe: tween(durationMillis) from motion.routeDrawOn
     */
    fun polylineDrawOn(durationMillis: Int): TweenSpec<Float> = tween(durationMillis)

    /**
     * Record dot pulse animation spec.
     *
     * Recipe: infiniteRepeatable(tween(1400ms, EaseInOut), Reverse)
     *
     * Note: recordDotPulse recipe doesn't exist in tokens.
     * Using motion.duration["slow"] (400ms) as placeholder.
     */
    fun recordDotPulse(
        durationMillis: Int,
        easing: androidx.compose.animation.core.Easing
    ): InfiniteRepeatableSpec<Float> = infiniteRepeatable(
        animation = tween(durationMillis, easing = easing),
        repeatMode = RepeatMode.Reverse
    )

    /**
     * Chat overlay enter animation spec.
     *
     * Recipe: slideInVertically(8dp) + fadeIn() with duration from motion.chatOverlayEnter
     *
     * Returns duration in milliseconds for use with AnimatedVisibility.
     */
    fun chatOverlayEnter(durationMillis: Int): Int = durationMillis
}

/**
 * Extension function to create CubicBezierEasing from token values.
 */
fun createEasing(points: List<Double>): androidx.compose.animation.core.Easing {
    require(points.size == 4) { "Easing must have 4 control points" }
    return androidx.compose.animation.core.CubicBezierEasing(
        points[0].toFloat(),
        points[1].toFloat(),
        points[2].toFloat(),
        points[3].toFloat()
    )
}
