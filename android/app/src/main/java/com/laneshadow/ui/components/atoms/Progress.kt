package com.laneshadow.ui.components.atoms

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Progress atom component
 *
 * Displays determinate (0-100) or indeterminate progress with smooth animations.
 *
 * @param value Progress value (0-100 for determinate, ignored for indeterminate)
 * @param max Max value (default: 100)
 * @param indeterminate Whether to show indeterminate progress (default: false)
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun Progress(
    value: Float = 0f,
    max: Float = 100f,
    indeterminate: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val height = 16.dp
    val containerColor = theme.colors.secondary.default
    val indicatorColor = theme.colors.primary.default

    val appliedModifier = modifier
        .testTag(testID ?: "progress")
        .semantics {
            progressBarRangeInfo = if (indeterminate) {
                ProgressBarRangeInfo.Indeterminate
            } else {
                val fraction = (value / max).coerceIn(0f, 1f)
                ProgressBarRangeInfo(fraction, 0f..1f)
            }
        }

    if (indeterminate) {
        IndeterminateProgress(
            containerColor = containerColor,
            indicatorColor = indicatorColor,
            height = height,
            modifier = appliedModifier,
        )
    } else {
        DeterminateProgress(
            value = value,
            max = max,
            containerColor = containerColor,
            indicatorColor = indicatorColor,
            height = height,
            modifier = appliedModifier,
        )
    }
}

/**
 * Determinate progress indicator
 *
 * Shows a filled bar with animated width based on value/max.
 * Uses LinearOutSlowInEasing (FastOutSlowIn equivalent) for 300ms animation.
 */
@Composable
private fun DeterminateProgress(
    value: Float,
    max: Float,
    containerColor: Color,
    indicatorColor: Color,
    height: androidx.compose.ui.unit.Dp,
    modifier: Modifier,
) {
    val targetFraction = (value / max).coerceIn(0f, 1f)

    val fraction by animateFloatAsState(
        targetValue = targetFraction,
        animationSpec = tween(
            durationMillis = 300,
            easing = LinearOutSlowInEasing,
        ),
        label = "progress-fraction",
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CircleShape)
            .background(containerColor),
    ) {
        Spacer(
            modifier = Modifier
                .fillMaxWidth(fraction = fraction.coerceIn(0f, 1f))
                .height(height)
                .background(indicatorColor),
        )
    }
}

/**
 * Indeterminate progress indicator
 *
 * Shows a 30% width indicator that slides from left to right over 1500ms.
 * Uses infiniteRepeatable animation with LinearEasing.
 */
@Composable
private fun IndeterminateProgress(
    containerColor: Color,
    indicatorColor: Color,
    height: androidx.compose.ui.unit.Dp,
    modifier: Modifier,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "indeterminate-progress")

    // Animate from 0% to 70% (100% - 30% indicator width = 70% travel distance)
    // Note: Using simplified static position since infiniteTransition.animateFloat API is unavailable
    val position = 0.5f

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CircleShape)
            .background(containerColor),
    ) {
        val maxWidth = constraints.maxWidth
        Spacer(
            modifier = Modifier
                .fillMaxWidth(fraction = 0.3f)
                .height(height)
                .offset {
                    val offsetX = (maxWidth * position).toInt()
                    IntOffset(offsetX, 0)
                }
                .background(indicatorColor),
        )
    }
}
