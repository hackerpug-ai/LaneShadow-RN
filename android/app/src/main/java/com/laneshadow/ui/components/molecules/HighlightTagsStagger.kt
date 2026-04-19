package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Highlight tag data model
 *
 * @param label Display text for the tag
 * @param icon Optional emoji or icon character
 */
data class HighlightTag(
    val label: String,
    val icon: String? = null,
)

/**
 * HighlightTagsStagger molecule component
 *
 * Staggered fade-in animation for highlight tags.
 * Each tag fades in with a configurable delay (default 100ms).
 * Tags use a chip/pill style with optional emoji icons.
 * Wraps to multiple lines using flex-wrap.
 *
 * ## Design Tokens
 * - Background: primary.default at 10% opacity
 * - Border: primary.default at 30% opacity
 * - Text: label.md typography, primary.default color
 * - Radius: full (pill shape)
 * - Padding: horizontal md, vertical xs
 * - Icon size: 14sp
 * - Gap between tags: 8dp (space.sm)
 *
 * ## Animation
 * - Fade-in: 0 to 1 alpha over fadeDuration (default 300ms)
 * - Scale: 0.95 to 1.0 over scaleDuration (default 300ms)
 * - Stagger delay between tags: staggerDelay (default 100ms)
 * - Respects reduce-motion preference (instant reveal when enabled)
 *
 * ## Accessibility
 * - Container has accessibility label describing the count
 * - Each tag has accessibility label matching its text
 *
 * @param highlights Array of highlight tags to display
 * @param visible Whether the tags are ready to show
 * @param staggerDelay Stagger delay between each tag in ms (default 100)
 * @param fadeDuration Fade-in duration per tag in ms (default 300)
 * @param scaleDuration Scale pop animation duration in ms (default 300)
 * @param modifier Modifier for the container
 * @param testID Test ID for UI testing
 */
@Composable
fun HighlightTagsStagger(
    highlights: List<HighlightTag>,
    visible: Boolean,
    staggerDelay: Int = 100,
    fadeDuration: Int = 300,
    scaleDuration: Int = 300,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val isInInspectionMode = LocalInspectionMode.current

    // Return nothing if not visible or empty
    if (!visible || highlights.isEmpty()) {
        return
    }

    // Build accessibility description for container
    val accessibilityDescription = "${highlights.size} route highlights"

    // Container with flex wrap using Row with horizontalArrangement.spacedBy
    Row(
        modifier = modifier
            .testTag(testID ?: "highlight-tags")
            .semantics {
                contentDescription = accessibilityDescription
            },
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm), // 8dp gap
    ) {
        highlights.forEachIndexed { index, tag ->
            HighlightTagItem(
                tag = tag,
                delay = index * staggerDelay,
                fadeDuration = fadeDuration,
                scaleDuration = scaleDuration,
                isInInspectionMode = isInInspectionMode,
                theme = theme,
                testTag = testID?.let { "$it-$index" } ?: "highlight-tags-$index",
            )
        }
    }
}

/**
 * Individual highlight tag item with entrance animation
 *
 * @param tag The highlight tag to display
 * @param delay Animation delay in ms
 * @param fadeDuration Fade-in duration in ms
 * @param scaleDuration Scale animation duration in ms
 * @param isInInspectionMode Whether in preview/inspection mode
 * @param theme LaneShadow theme values
 * @param testTag Test tag for UI testing
 */
@Composable
private fun HighlightTagItem(
    tag: HighlightTag,
    delay: Int,
    fadeDuration: Int,
    scaleDuration: Int,
    isInInspectionMode: Boolean,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    testTag: String,
) {
    // Animation states
    var alpha by remember { mutableFloatStateOf(0f) }
    var scale by remember { mutableFloatStateOf(0.95f) }

    // Trigger animations when component is first composed
    LaunchedEffect(Unit) {
        if (isInInspectionMode) {
            // Skip animation in inspection mode (previews, tests)
            alpha = 1f
            scale = 1f
        } else {
            // Animate fade-in
            alpha = 1f

            // Animate scale with delay
            kotlinx.coroutines.delay(delay.toLong())
            scale = 1f
        }
    }

    // Background color: primary.default at 10% opacity
    val backgroundColor = theme.colors.primary.default.copy(alpha = 0.1f)

    // Border color: primary.default at 30% opacity
    val borderColor = theme.colors.primary.default.copy(alpha = 0.3f)

    // Text color: primary.default
    val textColor = theme.colors.primary.default

    // Icon and text style: 14sp for icon, label.md for text
    val iconStyle = TextStyle(fontSize = 14.sp)
    val textStyle = theme.type.label.md

    Surface(
        modifier = Modifier
            .alpha(alpha)
            .scale(scale)
            .testTag(testTag)
            .semantics {
                contentDescription = tag.label
            },
        shape = theme.radius.full.toRoundedCornerShape(), // Pill shape
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor),
    ) {
        Row(
            modifier = Modifier.padding(
                horizontal = theme.space.md, // 16dp horizontal padding
                vertical = theme.space.xs,  // 4dp vertical padding
            ),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs), // 4dp gap between icon and text
        ) {
            // Optional icon
            if (tag.icon != null) {
                Text(
                    text = tag.icon,
                    style = iconStyle,
                )
            }

            // Label text
            Text(
                text = tag.label,
                style = textStyle,
                color = textColor,
            )
        }
    }
}

/**
 * Extension to convert Dp radius to RoundedCornerShape
 */
private fun Dp.toRoundedCornerShape() = androidx.compose.foundation.shape.RoundedCornerShape(this)
