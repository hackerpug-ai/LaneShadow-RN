package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * CreativeLabelFadeIn molecule component
 *
 * Fade-in animation for creative route labels with staggered reveal for multi-line labels
 * and a highlight pulse on first appearance. Smooth transition from skeleton state to final label.
 *
 * Typography: theme.type.display.md for the creative label
 * Animation: 300ms fade-in, 100ms stagger between lines, 500ms highlight pulse
 *
 * @param label The creative label text to display
 * @param visible Whether the label is ready (loaded from enrichment)
 * @param subtitle Optional subtitle or secondary line
 * @param staggerDelay Delay between line animations in ms (default 100)
 * @param fadeDuration Fade-in duration in ms (default 300)
 * @param highlightDuration Highlight pulse duration in ms (default 500)
 * @param modifier Modifier for the component
 * @param testId Test ID for UI testing
 */
@Composable
fun CreativeLabelFadeIn(
    label: String,
    visible: Boolean,
    subtitle: String? = null,
    staggerDelay: Int = 100,
    fadeDuration: Int = 300,
    highlightDuration: Int = 500,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val isInInspectionMode = LocalInspectionMode.current

    // Animation states
    var labelAlpha by remember { mutableFloatStateOf(0f) }
    var subtitleAlpha by remember { mutableFloatStateOf(0f) }
    var scale by remember { mutableFloatStateOf(1f) }
    var hasAnimatedHighlight by remember { mutableStateOf(false) }

    // Trigger animations when visible becomes true
    LaunchedEffect(visible) {
        if (visible) {
            // Animate label fade-in
            labelAlpha = 1f

            // Animate subtitle fade-in with stagger delay
            if (subtitle != null) {
                kotlinx.coroutines.delay(staggerDelay.toLong())
                subtitleAlpha = 1f
            }

            // Trigger highlight pulse animation (scale 1.0 -> 1.02 -> 1.0)
            if (!hasAnimatedHighlight) {
                hasAnimatedHighlight = true
                scale = 1.02f
                kotlinx.coroutines.delay((highlightDuration / 2).toLong())
                scale = 1f
            }
        }
    }

    // Build accessibility description
    val accessibilityDescription = "Route name: $label"

    // Skeleton placeholder when not visible
    if (!visible) {
        Column(
            modifier = modifier
                .testTag(testId ?: "creative-label-skeleton")
                .semantics {
                    contentDescription = "Loading route name"
                }
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            // Label skeleton
            SkeletonBar(
                width = 0.7f,
                height = 60.dp, // Approximate height for display.md text
                theme = theme,
                testTag = testId?.let { "$it-label-skeleton" } ?: "creative-label-skeleton-label",
            )

            // Subtitle skeleton (if subtitle provided)
            if (subtitle != null) {
                SkeletonBar(
                    width = 0.5f,
                    height = 24.dp, // Approximate height for body.md text
                    theme = theme,
                    testTag = testId?.let { "$it-subtitle-skeleton" } ?: "creative-label-skeleton-subtitle",
                )
            }
        }
        return
    }

    // Animated content when visible
    Column(
        modifier = modifier
            .testTag(testId ?: "creative-label")
            .semantics {
                contentDescription = accessibilityDescription
            }
            .scale(scale) // Apply highlight scale animation
            .fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // Main label line
        Text(
            text = label,
            style = theme.type.display.md,
            color = theme.colors.onSurface.default,
            modifier = Modifier
                .alpha(labelAlpha)
                .testTag(testId?.let { "$it-text" } ?: "creative-label-text"),
        )

        // Optional subtitle with stagger delay
        if (subtitle != null) {
            Text(
                text = subtitle,
                style = theme.type.body.md,
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                modifier = Modifier
                    .alpha(subtitleAlpha)
                    .testTag(testId?.let { "$it-subtitle" } ?: "creative-label-subtitle"),
            )
        }
    }
}

/**
 * Skeleton bar component for placeholder state
 *
 * @param width Bar width as fraction of parent
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
    Row(
        modifier = modifier
            .fillMaxWidth(width)
            .height(height)
            .background(
                color = theme.colors.muted.default,
                shape = RoundedCornerShape(theme.radius.sm),
            )
            .testTag(testTag ?: "skeleton-bar"),
    ) {}
}
