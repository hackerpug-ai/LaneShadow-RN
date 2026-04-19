package com.laneshadow.ui.components.atoms

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.roundToPx
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntOffset
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Switch dimension constants
 *
 * Documented against Switch.md matrix values:
 * - Track size: 44×24dp
 * - Thumb size: 20×20dp
 * - Track border: 2dp transparent
 * - Touch target: minimum 44×44dp
 * - Thumb offset unchecked: 2dp
 * - Thumb offset checked: 22dp
 * - Animation duration: 200ms
 */
private val SWITCH_TRACK_WIDTH = 44.dp
private val SWITCH_TRACK_HEIGHT = 24.dp
private val SWITCH_THUMB_SIZE = 20.dp
private val SWITCH_TRACK_BORDER_WIDTH = 2.dp
private val SWITCH_THUMB_SHADOW_ELEVATION = 2.dp
private val SWITCH_THUMB_OFFSET_UNCHECKED = 2.dp
private val SWITCH_THUMB_OFFSET_CHECKED = 22.dp
private val SWITCH_TOUCH_TARGET = 44.dp
private val SWITCH_ANIMATION_DURATION_MS = 200
private val SWITCH_DISABLED_OPACITY = 0.5f

/**
 * Switch atom component
 *
 * Following RN wrapper API from react-native/components/ui/switch.tsx
 *
 * A toggle switch component with animated thumb that slides between on/off states.
 *
 * @param value Current on/off state (true = checked/on, false = unchecked/off)
 * @param onValueChange Callback when switch is toggled (null makes switch non-interactive)
 * @param disabled Whether switch is disabled (adds opacity and prevents interaction)
 * @param modifier Modifier for the switch container
 * @param testID Test identifier for UI testing
 */
@Composable
fun Switch(
    value: Boolean = false,
    onValueChange: ((Boolean) -> Unit)? = null,
    disabled: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if switch should be disabled
    val isDisabled = disabled || onValueChange == null

    // Track pressed state for visual feedback
    var isPressed by remember { mutableStateOf(false) }
    val interactionSource = remember { MutableInteractionSource() }

    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is PressInteraction.Press -> isPressed = true
                is PressInteraction.Release -> isPressed = false
                is PressInteraction.Cancel -> isPressed = false
            }
        }
    }

    // Animate track background color
    val trackBackgroundColor by animateColorAsState(
        targetValue = when {
            isDisabled && value -> theme.colors.primary.default.copy(alpha = 0.5f)
            isDisabled -> theme.colors.muted.default
            value -> theme.colors.primary.default
            else -> theme.colors.muted.default
        },
        animationSpec = tween(
            durationMillis = SWITCH_ANIMATION_DURATION_MS,
            easing = FastOutSlowInEasing,
        ),
        label = "trackBackgroundColor",
    )

    // Animate thumb position
    val thumbOffset by animateDpAsState(
        targetValue = if (value) SWITCH_THUMB_OFFSET_CHECKED else SWITCH_THUMB_OFFSET_UNCHECKED,
        animationSpec = tween(
            durationMillis = SWITCH_ANIMATION_DURATION_MS,
            easing = FastOutSlowInEasing,
        ),
        label = "thumbOffset",
    )

    // Apply disabled opacity
    val appliedModifier = modifier
        .alpha(if (isDisabled) SWITCH_DISABLED_OPACITY else 1.0f)
        .semantics {
            role = Role.Switch
            if (isDisabled) {
                disabled()
            }
        }
        .then(
            if (!isDisabled && onValueChange != null) {
                Modifier.clickable(
                    onClick = { onValueChange(!value) },
                    interactionSource = interactionSource,
                    indication = null,
                )
            } else {
                Modifier
            }
        )

    // Get density once for offset calculation
    val density = LocalDensity.current

    Box(
        modifier = appliedModifier
            .sizeIn(
                minWidth = SWITCH_TOUCH_TARGET,
                minHeight = SWITCH_TOUCH_TARGET,
            ),
    ) {
        // Track
        Box(
            modifier = Modifier
                .size(
                    width = SWITCH_TRACK_WIDTH,
                    height = SWITCH_TRACK_HEIGHT,
                )
                .border(
                    width = SWITCH_TRACK_BORDER_WIDTH,
                    color = Color.Transparent,
                    shape = RoundedCornerShape(SWITCH_TRACK_HEIGHT / 2),
                )
                .background(
                    color = trackBackgroundColor,
                    shape = RoundedCornerShape(SWITCH_TRACK_HEIGHT / 2),
                ),
        ) {
            // Thumb
            Box(
                modifier = Modifier
                    .size(SWITCH_THUMB_SIZE)
                    .offset {
                        IntOffset(
                            x = with(density) { thumbOffset.roundToPx() },
                            y = 0,
                        )
                    }
                    .shadow(
                        elevation = SWITCH_THUMB_SHADOW_ELEVATION,
                        shape = CircleShape,
                    )
                    .background(
                        color = theme.colors.surface.default,
                        shape = CircleShape,
                    ),
            )
        }
    }
}
