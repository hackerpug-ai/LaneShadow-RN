package com.laneshadow.ui.components.molecules

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.TypingIndicator
import com.laneshadow.ui.components.atoms.TypingIndicatorSize

/**
 * MapPlanningIndicator molecule component
 *
 * Lightweight pill shown on the map while the agent is planning a route.
 * Replaces the full ChatTranscript overlay for a less jarring map-mode UX.
 *
 * Visual: glass-morphic pill with "Planning route..." text and typing dots.
 * Positioned above ChatInput, centered horizontally.
 *
 * @param visible Controls visibility of the indicator
 * @param bottomOffset Distance from the screen bottom (default: 100.dp)
 * @param extraInputOffset Extra offset for ChatInput (default: 0.dp)
 * @param testID Test ID for UI testing (default: "map-planning-indicator")
 * @param modifier Modifier for the component
 */
@Composable
fun MapPlanningIndicator(
    visible: Boolean,
    bottomOffset: Dp = 100.dp,
    extraInputOffset: Dp = 0.dp,
    testID: String = "map-planning-indicator",
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Calculate position: base offset + extra input offset
    val calculatedBottom = bottomOffset + extraInputOffset

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(
            animationSpec = tween(durationMillis = 200),
        ),
        exit = fadeOut(
            animationSpec = tween(durationMillis = 200),
        ),
        modifier = modifier,
    ) {
        Box(
            modifier = Modifier
                .testTag(testID)
                .then(
                    // Position absolutely from bottom center
                    // This modifier is applied by the parent in Box with align
                    Modifier,
                ),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Box(
                modifier = Modifier
                    .testTag("$testID-pill")
                    .shadow(
                        elevation = 4.dp,
                        shape = RoundedCornerShape(20.dp),
                        ambientColor = theme.colors.onSurface.default.copy(alpha = 0.15f),
                        spotColor = theme.colors.onSurface.default.copy(alpha = 0.15f),
                    )
                    .background(theme.colors.surface.default)
                    .border(
                        border = BorderStroke(
                            width = 1.dp,
                            color = theme.colors.border.default,
                        ),
                        shape = RoundedCornerShape(20.dp),
                    )
                    .padding(
                        horizontal = theme.space.md,
                        vertical = 10.dp,
                    ),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Planning route",
                        style = theme.type.body.sm,
                        color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                        modifier = Modifier.testTag("$testID-text"),
                    )

                    TypingIndicator(
                        size = TypingIndicatorSize.Small,
                        color = theme.colors.onSurface.default.copy(alpha = 0.5f),
                        testID = "$testID-typing",
                    )
                }
            }
        }
    }
}
