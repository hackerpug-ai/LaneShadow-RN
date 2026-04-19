package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Chip dimension constants
 *
 * Documented against Chip.md matrix values:
 * - H-padding: 12dp (space.md)
 * - V-padding: 6dp
 * - Shape: CircleShape (radius.full)
 * - Border: 1dp
 * - Text: 13sp medium
 * - Icon: 16dp, 4dp gap (space.xs)
 */
private val CHIP_PADDING_HORIZONTAL = 12.dp
private val CHIP_PADDING_VERTICAL = 6.dp
private val CHIP_BORDER_WIDTH = 1.dp
private val CHIP_FONT_SIZE = 13.sp
private val CHIP_ICON_SIZE = 16.dp
private val CHIP_ICON_GAP = 4.dp

/**
 * Opacity constants for selected state
 *
 * Following RN wrapper behavior:
 * - Selected background: primary 12% alpha
 * - Selected border: primary 40% alpha
 */
private const val CHIP_SELECTED_BACKGROUND_ALPHA = 0.12f
private const val CHIP_SELECTED_BORDER_ALPHA = 0.40f

/**
 * Chip component
 *
 * Following RN wrapper API from react-native/components/ui/chip.tsx
 *
 * @param label Text content to display
 * @param selected Whether the chip is in selected state
 * @param onPress Callback when chip is pressed (null makes chip non-interactive)
 * @param icon Optional icon composable to display before label
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the chip container
 */
@Composable
fun Chip(
    label: String,
    selected: Boolean = false,
    onPress: (() -> Unit)? = null,
    icon: @Composable (() -> Unit)? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if chip should be disabled
    val isDisabled = onPress == null

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

    // Get background color based on state
    val backgroundColor: Color = when {
        selected -> theme.colors.primary.default.copy(alpha = CHIP_SELECTED_BACKGROUND_ALPHA)
        isPressed && !selected -> theme.colors.muted.default
        else -> Color.Transparent
    }

    // Get border color based on state
    val borderColor: Color = when {
        selected -> theme.colors.primary.default.copy(alpha = CHIP_SELECTED_BORDER_ALPHA)
        else -> theme.colors.border.default
    }

    // Get text color based on state
    val textColor: Color = when {
        selected -> theme.colors.primary.default
        else -> theme.colors.onSurface.default
    }

    // Build semantics
    val chipModifier = modifier
        .semantics {
            role = Role.Checkbox
            stateDescription = if (selected) "Selected" else "Unselected"
            if (isDisabled) {
                disabled()
            }
        }

    Surface(
        modifier = chipModifier,
        shape = CircleShape,
        color = backgroundColor,
        border = BorderStroke(CHIP_BORDER_WIDTH, borderColor),
        onClick = onPress ?: {},
    ) {
        Row(
            modifier = Modifier
                .padding(
                    horizontal = theme.space.md,
                    vertical = CHIP_PADDING_VERTICAL,
                ),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Row(
                    modifier = Modifier
                        .padding(end = theme.space.xs)
                        .width(CHIP_ICON_SIZE),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                ) {
                    icon()
                }
            }
            Text(
                text = label,
                fontSize = CHIP_FONT_SIZE,
                fontWeight = FontWeight.Medium,
                color = textColor,
            )
        }
    }
}
