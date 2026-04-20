package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Chip atom component
 *
 * Selectable chip component with icon support.
 * Following RN wrapper API from react-native/components/ui/chip.tsx
 *
 * Style properties from matrix:
 * - Padding: horizontal 12dp (space.md), vertical 6dp
 * - Radius: full (9999dp / CircleShape)
 * - Border: 1dp
 * - Font: 13sp, Medium weight, 18sp line height
 * - Icon: 16dp size
 * - Icon gap: 4dp (space.xs)
 *
 * @param label Text label for the chip
 * @param selected Whether the chip is selected
 * @param onPress Callback when chip is pressed (null makes chip non-interactive)
 * @param icon Optional icon composable to display
 * @param testID Test ID for UI testing
 */
@Composable
fun Chip(
    label: String,
    selected: Boolean = false,
    onPress: (() -> Unit)? = null,
    icon: @Composable (() -> Unit)? = null,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

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

    // Background color based on state
    val backgroundColor: Color = when {
        selected -> theme.colors.primary.default.copy(alpha = 0.12f)
        isPressed && !selected -> theme.colors.muted.pressed ?: theme.colors.muted.default
        else -> Color.Transparent
    }

    // Border color based on state
    val borderColor = when {
        selected -> theme.colors.primary.default.copy(alpha = 0.4f)
        else -> theme.colors.border.default
    }

    // Text color based on state
    val textColor = if (selected) {
        theme.colors.primary.default
    } else {
        theme.colors.onSurface.default
    }

    // Icon color based on state (for icon rendering)
    val iconColor = if (selected) {
        theme.colors.primary.default
    } else {
        theme.colors.onSurface.default.copy(alpha = 0.6f)
    }

    // Build modifier with semantics and click handling
    val chipModifier = Modifier
        .semantics {
            role = Role.Checkbox
            this.selected = selected
        }
        .then(
            if (onPress != null) {
                Modifier.clickable(
                    onClick = onPress,
                    interactionSource = interactionSource,
                    indication = null,
                )
            } else {
                Modifier
            }
        )

    Row(
        modifier = chipModifier
            .background(
                color = backgroundColor,
                shape = CircleShape,
            )
            .border(
                border = BorderStroke(1.dp, borderColor),
                shape = CircleShape,
            )
            .padding(
                horizontal = 12.dp,
                vertical = 6.dp,
            ),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (icon != null) {
            icon()
        }

        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            lineHeight = 18.sp,
            color = textColor,
        )
    }
}
