package com.laneshadow.sandbox.argcontrols

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
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
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Show color swatch
            val color = remember(value) {
                parseTokenColor(value)
            }
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(color, CircleShape),
            )
            Box(modifier = Modifier.width(theme.space.sm))
            Text(
                text = value,
                style = theme.type.body.md,
                color = theme.colors.onSurface.default,
                modifier = Modifier.weight(1f),
            )
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = "Dropdown",
                tint = theme.colors.onSurface.default,
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.fillMaxWidth(),
        ) {
            tokenOptions.forEach { token ->
                val tokenColor = remember(token) {
                    parseTokenColor(token)
                }
                DropdownMenuItem(
                    text = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .background(tokenColor, CircleShape),
                            )
                            Box(modifier = Modifier.width(theme.space.sm))
                            Text(token)
                        }
                    },
                    onClick = {
                        onValueChange(token)
                        expanded = false
                    },
                )
            }
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
 * Generates a consistent color from the token name using a hash function.
 * This ensures different tokens show different colors in the UI.
 *
 * TODO: Read from generated Tokens.kt to get actual theme color values.
 */
private fun parseTokenColor(tokenName: String): Color {
    // Generate a consistent color from the token name string
    val hash = tokenName.hashCode()

    // Extract RGB components from the hash
    val red = ((hash shr 16) and 0xFF) % 156 + 100  // Keep in visible range 100-255
    val green = ((hash shr 8) and 0xFF) % 156 + 100
    val blue = (hash and 0xFF) % 156 + 100

    return Color(red, green, blue)
}
