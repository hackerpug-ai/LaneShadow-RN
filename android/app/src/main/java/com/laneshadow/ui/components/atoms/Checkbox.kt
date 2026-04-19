package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Checkbox state variants
 *
 * Following RN wrapper API from react-native/components/ui/checkbox.tsx
 */
enum class CheckboxState {
    Unchecked,
    Checked,
    Indeterminate,
}

/**
 * Checkbox dimension constants
 *
 * Documented against Checkbox.md matrix values:
 * - Box size: 16×16dp
 * - Border radius: 4dp (theme.radius.sm)
 * - Border width: 1dp
 * - Touch target: minimum 44×44dp
 */
private val CHECKBOX_SIZE = 16.dp
private val CHECKBOX_BORDER_WIDTH = 1.dp
private val CHECKBOX_DISABLED_OPACITY = 0.5f
private val CHECKBOX_TOUCH_TARGET = 44.dp

/**
 * Checkmark dimension constants
 *
 * Documented against Checkbox.md matrix values:
 * - Checkmark font size: 12sp
 * - Indeterminate bar: 8×2dp
 */
private val CHECKMARK_FONT_SIZE = 12.sp
private val INDETERMINATE_BAR_WIDTH = 8.dp
private val INDETERMINATE_BAR_HEIGHT = 2.dp

/**
 * Checkbox component
 *
 * Following RN wrapper API from react-native/components/ui/checkbox.tsx
 *
 * @param state Checkbox state (unchecked, checked, indeterminate)
 * @param onToggle Callback when checkbox is toggled (null makes checkbox non-interactive)
 * @param disabled Whether checkbox is disabled (adds opacity and prevents interaction)
 * @param modifier Modifier for the checkbox container
 * @param testID Test ID for UI testing
 */
@Composable
fun Checkbox(
    state: CheckboxState = CheckboxState.Unchecked,
    onToggle: (() -> Unit)? = null,
    disabled: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if checkbox should be disabled
    val isDisabled = disabled || onToggle == null

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

    // Get colors based on state and interaction
    val backgroundColor: Color = when (state) {
        CheckboxState.Unchecked -> Color.Transparent
        CheckboxState.Checked, CheckboxState.Indeterminate -> {
            when {
                isPressed && state == CheckboxState.Checked -> theme.colors.primary.pressed ?: theme.colors.primary.default
                else -> theme.colors.primary.default
            }
        }
    }

    val borderColor = theme.colors.primary.default

    // Apply disabled opacity
    val appliedModifier = modifier
        .alpha(if (isDisabled) CHECKBOX_DISABLED_OPACITY else 1.0f)
        .semantics {
            role = Role.Checkbox
            if (isDisabled) {
                disabled()
            }
        }
        .then(
            if (!isDisabled && onToggle != null) {
                Modifier.clickable(
                    onClick = onToggle,
                    interactionSource = interactionSource,
                    indication = null,
                )
            } else {
                Modifier
            }
        )

    Box(
        modifier = appliedModifier
            .sizeIn(
                minWidth = CHECKBOX_TOUCH_TARGET,
                minHeight = CHECKBOX_TOUCH_TARGET,
            ),
    ) {
        Surface(
            modifier = Modifier
                .size(CHECKBOX_SIZE)
                .clip(RoundedCornerShape(theme.radius.sm)),
            shape = RoundedCornerShape(theme.radius.sm),
            color = backgroundColor,
            border = if (state == CheckboxState.Unchecked) {
                BorderStroke(CHECKBOX_BORDER_WIDTH, borderColor)
            } else {
                null
            },
        ) {
            Box(
                modifier = Modifier.size(CHECKBOX_SIZE),
            ) {
                when (state) {
                    CheckboxState.Checked -> {
                        // Checkmark: "✓" text, 12sp bold, onPrimary color
                        Text(
                            text = "✓",
                            fontSize = CHECKMARK_FONT_SIZE,
                            fontWeight = FontWeight.Bold,
                            color = theme.colors.onPrimary.default,
                        )
                    }
                    CheckboxState.Indeterminate -> {
                        // Indeterminate bar: 8×2dp, 1dp radius, onPrimary color
                        Box(
                            modifier = Modifier
                                .size(
                                    width = INDETERMINATE_BAR_WIDTH,
                                    height = INDETERMINATE_BAR_HEIGHT,
                                )
                                .background(
                                    color = theme.colors.onPrimary.default,
                                    shape = RoundedCornerShape(1.dp),
                                ),
                        )
                    }
                    CheckboxState.Unchecked -> {
                        // Empty box
                    }
                }
            }
        }
    }
}
