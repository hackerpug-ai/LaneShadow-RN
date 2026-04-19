package com.laneshadow.ui.components.atoms

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * TypingIndicatorSize enum
 *
 * Defines the size variants for the typing indicator dots.
 */
enum class TypingIndicatorSize {
    /** Small: dot diameter 4dp, gap 3dp */
    Small,

    /** Medium: dot diameter 6dp, gap 4dp */
    Medium,
}

/**
 * TypingIndicator atom component
 *
 * Three animated dots for chat typing indicator.
 *
 * @param size Size variant (Small or Medium, default: Small)
 * @param color Optional color override (default: onSurface with alpha 0.6f)
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun TypingIndicator(
    size: TypingIndicatorSize = TypingIndicatorSize.Small,
    color: Color? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val dotDiameter: Dp = when (size) {
        TypingIndicatorSize.Small -> 4.dp
        TypingIndicatorSize.Medium -> 6.dp
    }

    val dotGap: Dp = when (size) {
        TypingIndicatorSize.Small -> 3.dp
        TypingIndicatorSize.Medium -> 4.dp
    }

    // Default color: onSurface with alpha 0.6f
    val dotColor = color ?: theme.colors.onSurface.default.copy(alpha = 0.6f)

    // Animation parameters
    val animationDuration = 300 // ms per half-period
    val dotDelays = listOf(0, 150, 300) // Stagger delays in ms

    Row(
        modifier = modifier
            .testTag(testID ?: "typing-indicator")
            .semantics {
                // Mark this as a progress bar for accessibility
                progressBarRangeInfo = androidx.compose.ui.semantics.ProgressBarRangeInfo.Indeterminate
            },
        horizontalArrangement = Arrangement.spacedBy(dotGap),
    ) {
        repeat(3) { index ->
            TypingDot(
                diameter = dotDiameter,
                color = dotColor,
                delayMillis = dotDelays[index],
                animationDuration = animationDuration,
            )
        }
    }
}

/**
 * Individual typing dot with scale animation
 *
 * @param diameter Size of the dot
 * @param color Color of the dot
 * @param delayMillis Initial delay before animation starts
 * @param animationDuration Duration of each half-period in ms
 */
@Composable
private fun TypingDot(
    diameter: Dp,
    color: Color,
    delayMillis: Int,
    animationDuration: Int,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "typing_dot_scale")

    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = animationDuration,
                delayMillis = delayMillis,
            ),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "typing_dot_scale",
    )

    androidx.compose.foundation.layout.Box(
        modifier = Modifier
            .size(diameter)
            .scale(scale)
            .background(
                color = color,
                shape = CircleShape,
            ),
    )
}
