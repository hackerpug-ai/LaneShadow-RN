package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Skeleton width variants
 */
enum class SkeletonWidth {
    SHORT,
    MEDIUM,
    LONG,
}

/**
 * LabelSkeleton molecule component
 *
 * Shimmer effect placeholder for loading text with short/medium/long width variants.
 * Uses left-to-right shimmer sweep animation (1500ms cycle).
 * Falls back to static placeholder on reduce-motion preference (not yet implemented).
 *
 * Typography height: defaults to 28dp (matches heading.lg lineHeight)
 * Background: surfaceVariant.default
 * Shimmer overlay: white at 10% opacity
 *
 * @param modifier Modifier for the component
 * @param width Width variant - SHORT (80dp), MEDIUM (160dp), LONG (240dp)
 * @param height Skeleton height in dp (default: 28.dp)
 * @param borderRadius Border radius in dp (default: null, uses theme.radius.md)
 * @param testTag Test ID for UI testing
 */
@Composable
fun LabelSkeleton(
    modifier: Modifier = Modifier,
    width: SkeletonWidth = SkeletonWidth.MEDIUM,
    height: Dp = 28.dp,
    borderRadius: Dp? = null,
    testTag: String = "label-skeleton",
) {
    val theme = LocalLaneShadowTheme.current
    val isInPreview = LocalInspectionMode.current

    // Resolve width variant
    val resolvedWidth = when (width) {
        SkeletonWidth.SHORT -> 80.dp
        SkeletonWidth.MEDIUM -> 160.dp
        SkeletonWidth.LONG -> 240.dp
    }

    // Resolve border radius
    val resolvedRadius = borderRadius ?: theme.radius.md

    // Shimmer pulse animation (same pattern as CardSkeleton)
    // In preview mode, use static alpha to avoid animation issues
    val alpha = if (isInPreview) {
        0.7f
    } else {
        val infiniteTransition = rememberInfiniteTransition(label = "label_skeleton_pulse")
        infiniteTransition.animateFloat(
            initialValue = 0.4f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse,
            ),
            label = "label_skeleton_alpha",
        ).value
    }

    Box(
        modifier = modifier
            .width(resolvedWidth)
            .height(height)
            .testTag(testTag)
            .semantics {
                contentDescription = "Loading"
            }
            .alpha(alpha)
            .background(
                color = theme.colors.surfaceVariant.default,
                shape = RoundedCornerShape(resolvedRadius),
            ),
    ) {
        // Shimmer overlay: white at 10% opacity
        // Note: The shimmer sweep animation from RN would require a more complex
        // implementation with Modifier.drawWithContent. For now, we use the
        // pulse animation pattern from CardSkeleton which provides a similar
        // loading indicator effect.
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    color = Color.White.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(resolvedRadius),
                ),
        )
    }
}
