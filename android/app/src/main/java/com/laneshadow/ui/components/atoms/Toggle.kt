package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Toggle variant options
 *
 * - Default: Filled background when pressed
 * - Outline: Bordered style
 */
enum class ToggleVariant {
    Default,
    Outline,
}

/**
 * Toggle size options
 *
 * - Small: 36dp height
 * - Default: 40dp height
 * - Large: 44dp height
 */
enum class ToggleSize(val height: Dp) {
    Small(36.dp),
    Default(40.dp),
    Large(44.dp),
}

/**
 * Toggle dimension constants
 *
 * Documented against design tokens:
 * - H-padding: 12dp (space.md)
 * - Corner radius: 8dp (radius.md)
 * - Border width: 1dp (outline variant)
 * - Text: 14sp medium
 * - Icon: 20dp, 8dp gap (space.md)
 */
private val TOGGLE_PADDING_HORIZONTAL = 12.dp
private val TOGGLE_BORDER_WIDTH = 1.dp
private val TOGGLE_FONT_SIZE = 14.sp
private val TOGGLE_ICON_SIZE = 20.dp
private val TOGGLE_ICON_GAP = 8.dp

/**
 * Opacity constants for states
 *
 * Following theme token patterns:
 * - Disabled: 0.5f alpha
 * - Idle off: 0.7f alpha on text
 * - Disabled text: 0.38f alpha
 */
private const val TOGGLE_DISABLED_ALPHA = 0.5f
private const val TOGGLE_IDLE_OFF_TEXT_ALPHA = 0.7f
private const val TOGGLE_DISABLED_TEXT_ALPHA = 0.38f

/**
 * Toggle atom component
 *
 * A toggle button with pressed/unpressed states and variants.
 * Following RN wrapper API patterns from react-native/components/ui/toggle.tsx
 *
 * @param pressed Current pressed/on state
 * @param onPressedChange Callback when pressed state changes
 * @param text Label text to display
 * @param icon Optional icon composable to display before text
 * @param variant Toggle variant (Default or Outline)
 * @param size Toggle size (Small, Default, or Large)
 * @param disabled Whether the toggle is disabled
 * @param testID Test identifier for UI testing
 * @param modifier Modifier for the toggle container
 */
@Composable
fun Toggle(
    pressed: Boolean,
    onPressedChange: (Boolean) -> Unit,
    text: String,
    icon: @Composable (() -> Unit)? = null,
    variant: ToggleVariant = ToggleVariant.Default,
    size: ToggleSize = ToggleSize.Default,
    disabled: Boolean = false,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Get background color based on state and variant
    val backgroundColor: Color = when {
        disabled -> Color.Transparent
        pressed -> theme.colors.accent.default
        else -> Color.Transparent
    }

    // Get border color (outline variant only)
    val borderColor: Color = when {
        variant != ToggleVariant.Outline -> Color.Transparent
        disabled -> theme.colors.border.default.copy(alpha = TOGGLE_DISABLED_ALPHA)
        pressed -> theme.colors.accent.default
        else -> theme.colors.border.default
    }

    // Get text color based on state
    val textColor: Color = when {
        disabled -> {
            theme.colors.onSurface.default.copy(alpha = TOGGLE_DISABLED_TEXT_ALPHA)
        }
        pressed -> theme.colors.onSurface.default
        else -> theme.colors.onSurface.default.copy(alpha = TOGGLE_IDLE_OFF_TEXT_ALPHA)
    }

    // Apply disabled alpha to container
    val containerAlpha = if (disabled) TOGGLE_DISABLED_ALPHA else 1f

    // Build semantics
    val toggleModifier = modifier
        .alpha(containerAlpha)
        .semantics {
            role = Role.Button
            selected = pressed
            if (disabled) {
                disabled()
            }
        }

    Surface(
        modifier = toggleModifier,
        shape = RoundedCornerShape(theme.radius.md),
        color = backgroundColor,
        border = if (variant == ToggleVariant.Outline) {
            BorderStroke(TOGGLE_BORDER_WIDTH, borderColor)
        } else {
            null
        },
        onClick = { if (!disabled) onPressedChange(!pressed) },
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = theme.space.md),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Row(
                    modifier = Modifier
                        .padding(end = TOGGLE_ICON_GAP)
                        .width(TOGGLE_ICON_SIZE)
                        .alpha(if (disabled) TOGGLE_DISABLED_ALPHA else 1f),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    icon()
                }
            }
            Text(
                text = text,
                fontSize = TOGGLE_FONT_SIZE,
                fontWeight = FontWeight.Medium,
                color = textColor,
            )
        }
    }
}
