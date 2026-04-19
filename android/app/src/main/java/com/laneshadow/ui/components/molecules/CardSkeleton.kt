package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * CardSkeleton molecule component
 *
 * Loading placeholder with pulse animation for card content.
 * Mimics the layout of RouteAttachmentCard: badge row, title, description, stats.
 *
 * @param compact Show compact variant - reduces padding and gaps (default: false)
 * @param showBestBadge Show best badge placeholder (default: true)
 * @param showWeatherBadge Show weather badge placeholder (default: true)
 * @param modifier Modifier for the component
 * @param testId Test ID for UI testing
 */
@Composable
fun CardSkeleton(
    compact: Boolean = false,
    showBestBadge: Boolean = true,
    showWeatherBadge: Boolean = true,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Shimmer pulse animation (same pattern as Skeleton atom)
    val infiniteTransition = rememberInfiniteTransition(label = "card_skeleton_pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "card_skeleton_alpha",
    )

    // Card styling
    val cardPadding = if (compact) theme.space.md else theme.space.lg
    val gap = if (compact) 6.dp else 10.dp

    Surface(
        modifier = modifier
            .testTag(testId ?: "card-skeleton")
            .semantics {
                contentDescription = "Loading"
            }
            .alpha(alpha),
        shape = RoundedCornerShape(theme.radius.lg),
        color = theme.colors.surface.default,
        border = BorderStroke(1.dp, theme.colors.border.default),
    ) {
        Column(
            modifier = Modifier
                .padding(cardPadding)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(gap),
        ) {
            // Badge row
            if (showBestBadge || showWeatherBadge) {
                BadgeRow(
                    showBestBadge = showBestBadge,
                    showWeatherBadge = showWeatherBadge,
                    theme = theme,
                )
            }

            // Title placeholder
            SkeletonBar(
                width = 0.7f,
                height = if (compact) 14.dp else 16.dp,
                theme = theme,
                testTag = testId?.let { "$it-title" } ?: "card-skeleton-title",
            )

            // Description placeholders (only in non-compact)
            if (!compact) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    SkeletonBar(
                        width = 1.0f,
                        height = 14.dp,
                        theme = theme,
                        testTag = testId?.let { "$it-description-1" } ?: "card-skeleton-description-1",
                    )
                    SkeletonBar(
                        width = 0.6f,
                        height = 14.dp,
                        theme = theme,
                        testTag = testId?.let { "$it-description-2" } ?: "card-skeleton-description-2",
                    )
                }
            }

            // Stats placeholder
            SkeletonBar(
                width = 0.85f,
                height = if (compact) 11.dp else 13.dp,
                theme = theme,
                modifier = Modifier.padding(top = 2.dp),
                testTag = testId?.let { "$it-stats" } ?: "card-skeleton-stats",
            )
        }
    }
}

/**
 * Badge row skeleton component
 *
 * @param showBestBadge Show best badge placeholder
 * @param showWeatherBadge Show weather badge placeholder
 * @param theme LaneShadow theme values
 */
@Composable
private fun BadgeRow(
    showBestBadge: Boolean,
    showWeatherBadge: Boolean,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (showBestBadge) {
            Box(
                modifier = Modifier
                    .background(
                        color = theme.colors.muted.default,
                        shape = RoundedCornerShape(theme.radius.md),
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                SkeletonBar(
                    width = 40.dp,
                    height = 12.dp,
                    theme = theme,
                    testTag = "card-skeleton-best-badge",
                )
            }
        }

        if (showWeatherBadge) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .background(
                        color = theme.colors.muted.default,
                        shape = RoundedCornerShape(theme.radius.md),
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                // Weather icon circle
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .background(
                            color = theme.colors.surfaceVariant.default,
                            shape = RoundedCornerShape(theme.radius.sm),
                        )
                        .testTag("card-skeleton-weather-icon"),
                )

                // Weather text bar
                SkeletonBar(
                    width = 40.dp,
                    height = 12.dp,
                    theme = theme,
                    testTag = "card-skeleton-weather-text",
                )
            }
        }
    }
}

/**
 * Skeleton bar component
 *
 * @param width Bar width as fraction of parent or fixed Dp
 * @param height Bar height
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the bar
 * @param testTag Test ID for UI testing
 */
@Composable
private fun SkeletonBar(
    width: Float,
    height: Dp,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
    testTag: String? = null,
) {
    Box(
        modifier = modifier
            .fillMaxWidth(width)
            .height(height)
            .background(
                color = theme.colors.muted.default,
                shape = RoundedCornerShape(theme.radius.sm),
            )
            .testTag(testTag ?: "skeleton-bar"),
    )
}

/**
 * Skeleton bar component with fixed width
 *
 * @param width Bar width in Dp
 * @param height Bar height
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the bar
 * @param testTag Test ID for UI testing
 */
@Composable
private fun SkeletonBar(
    width: Dp,
    height: Dp,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
    testTag: String? = null,
) {
    Box(
        modifier = modifier
            .width(width)
            .height(height)
            .background(
                color = theme.colors.muted.default,
                shape = RoundedCornerShape(theme.radius.sm),
            )
            .testTag(testTag ?: "skeleton-bar"),
    )
}
