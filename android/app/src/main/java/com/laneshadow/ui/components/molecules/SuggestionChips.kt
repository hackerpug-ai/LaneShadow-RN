package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * Suggestion chip data model
 *
 * @param id Unique identifier for the chip
 * @param label Display text for the chip
 * @param icon Optional icon name (MaterialCommunityIcons glyph name)
 */
data class SuggestionChip(
    val id: String,
    val label: String,
    val icon: String? = null,
)

/**
 * SuggestionChips molecule component
 *
 * Horizontal or vertical flow of suggestion chips that users can tap.
 * Following RN wrapper API from react-native/components/ui/suggestion-chips.tsx
 *
 * Layout behavior:
 * - horizontal=true: LazyRow with horizontal scrolling
 * - horizontal=false: Column with vertical stacking
 *
 * Chip styling (from spec):
 * - Background: surfaceVariant.default, pressed: primary.pressed or muted.default
 * - Border: 1dp, border.default
 * - Text: 14sp, weight 600, color onSurface.muted
 * - Icon: 14sp, color primary.default
 * - Padding: 14dp horizontal, 8dp vertical
 * - Radius: full (20dp)
 * - Min height: 36dp
 * - Gap between chips: 8dp (space.sm)
 * - Container padding: 16dp horizontal, 12dp vertical
 *
 * @param suggestions List of suggestion chips to display
 * @param onPress Callback when a chip is tapped
 * @param disabled Whether all chips are disabled (default: false)
 * @param horizontal Whether to layout horizontally (default: false)
 * @param modifier Modifier for the container
 */
@Composable
fun SuggestionChips(
    suggestions: List<SuggestionChip>,
    onPress: (SuggestionChip) -> Unit,
    disabled: Boolean = false,
    horizontal: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Container padding from spec: 16dp horizontal, 12dp vertical
    val containerModifier = modifier.padding(
        horizontal = theme.space.md,  // 16dp
        vertical = 12.dp,
    )

    if (horizontal) {
        // Horizontal scrolling layout
        LazyRow(
            modifier = containerModifier,
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm), // 8dp gap
        ) {
            items(suggestions) { suggestion ->
                SuggestionChipItem(
                    suggestion = suggestion,
                    onPress = onPress,
                    disabled = disabled,
                )
            }
        }
    } else {
        // Vertical layout with simple column
        Column(
            modifier = containerModifier,
            verticalArrangement = Arrangement.spacedBy(theme.space.sm), // 8dp gap
        ) {
            for (suggestion in suggestions) {
                SuggestionChipItem(
                    suggestion = suggestion,
                    onPress = onPress,
                    disabled = disabled,
                )
            }
        }
    }
}

/**
 * Individual suggestion chip item
 *
 * Renders a single suggestion chip with optional icon, following the design spec.
 * Uses Surface with border and press state handling.
 */
@Composable
private fun SuggestionChipItem(
    suggestion: SuggestionChip,
    onPress: (SuggestionChip) -> Unit,
    disabled: Boolean,
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

    // Background color from spec: surfaceVariant.default, pressed: primary.pressed or surfaceVariant with overlay
    val backgroundColor: Color = when {
        disabled -> theme.colors.surfaceVariant.default
        isPressed -> theme.colors.primary.pressed ?: theme.colors.surfaceVariant.default.copy(alpha = 0.8f)
        else -> theme.colors.surfaceVariant.default
    }

    // Border from spec: 1dp, border.default
    val borderColor: Color = when {
        disabled -> theme.colors.border.disabled ?: theme.colors.border.default
        else -> theme.colors.border.default
    }

    // Text color from spec: onSurface with reduced alpha for muted effect
    val textColor: Color = when {
        disabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default.copy(alpha = 0.6f)
        else -> theme.colors.onSurface.default.copy(alpha = 0.7f)
    }

    // Icon color from spec: primary.default
    val iconColor: Color = when {
        disabled -> theme.colors.primary.disabled ?: theme.colors.primary.default
        else -> theme.colors.primary.default
    }

    // Build semantics for accessibility
    val chipModifier = Modifier.semantics {
        role = Role.Button
        if (disabled) {
            disabled()
        }
    }

    // Surface with border and min height 36dp
    Surface(
        modifier = chipModifier,
        shape = CircleShape, // radius.full = 20dp
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor),
        onClick = { if (!disabled) onPress(suggestion) },
    ) {
        Row(
            modifier = Modifier.padding(
                horizontal = 14.dp,  // Spec: 14dp horizontal padding
                vertical = 8.dp,     // Spec: 8dp vertical padding
            ),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            if (suggestion.icon != null) {
                // Icon from spec: 14sp size, primary.default color
                IconSymbol(
                    name = suggestion.icon,
                    size = 14.sp.value.dp,
                    color = iconColor,
                    modifier = Modifier.padding(end = 8.dp),
                )
            }
            // Text from spec: 14sp, weight 600, onSurface.muted color
            Text(
                text = suggestion.label,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold, // weight 600
                color = textColor,
            )
        }
    }
}
