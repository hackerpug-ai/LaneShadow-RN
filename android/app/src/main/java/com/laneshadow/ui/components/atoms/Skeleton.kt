package com.laneshadow.ui.components.atoms

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Skeleton atom component
 *
 * Loading placeholder with pulse animation for content that is still loading.
 *
 * @param width Skeleton width (required)
 * @param height Skeleton height (required)
 * @param shape Corner radius for rounded corners (default: 8.dp)
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun Skeleton(
    width: Dp,
    height: Dp,
    shape: Dp = 8.dp,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val infiniteTransition = rememberInfiniteTransition(label = "skeleton_pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "skeleton_alpha",
    )

    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .size(width = width, height = height)
            .testTag(testID ?: "skeleton")
            .alpha(alpha)
            .background(
                color = theme.colors.surface.default,
                shape = RoundedCornerShape(shape),
            ),
    ) {
        // Empty box - the background provides the visual
    }
}
