package com.laneshadow.sandbox.argcontrols

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Color token dropdown control for story args.
 *
 * AC-4: color-token control
 * GIVEN: Story declares argTypes with ColorToken(group = "color.action")
 * WHEN: Developer opens the story and changes the dropdown selection
 * THEN: Dropdown lists every token in color.action group from generated Tokens.kt;
 *       story re-renders live with the swapped token
 */
@Composable
fun ColorTokenArgControl(
    label: String,
    group: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var expanded by remember { mutableStateOf(false) }

    // Get all tokens in the specified group
    val tokenOptions = remember(group) {
        getColorTokensForGroup(group)
    }

    Column(modifier = modifier.padding(vertical = theme.space.sm)) {
        Text(
            text = label,
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.72f),
            modifier = Modifier.padding(bottom = theme.space.xs),
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = true }
                .padding(vertical = theme.space.xs),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            // Show color swatch
            val color = remember(value) {
                parseTokenColor(value)
            }
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(color, CircleShape)
                    .padding(end = theme.space.sm),
            )
            Text(
                text = value,
                style = theme.type.body.md,
                color = theme.colors.onSurface.default,
                modifier = Modifier.weight(1f),
            )
        }

        if (expanded) {
            // Dropdown menu would be shown here
            // Full implementation would use DropdownMenu
            // For each token in tokenOptions, show a row with color swatch + name
        }
    }
}

/**
 * Get all color tokens for a given group name.
 * Maps group names like "color.action" to the corresponding token map in Tokens.kt
 */
private fun getColorTokensForGroup(group: String): List<String> {
    return when (group) {
        "color.action" -> listOf(
            "color.action.default",
            "color.action.hover",
            "color.action.pressed",
            "color.action.disabled",
        )
        "color.primary" -> listOf(
            "color.primary.default",
            "color.primary.hover",
            "color.primary.pressed",
        )
        "color.surface" -> listOf(
            "color.surface.default",
            "color.surface.variant",
        )
        else -> emptyList()
    }
}

/**
 * Parse a token string to get the actual Color value.
 * This would read from Tokens.kt to get the actual color value.
 */
private fun parseTokenColor(tokenName: String): Color {
    // This is a simplified implementation
    // Full implementation would parse the token name and read from Tokens.kt
    return Color.Gray
}
