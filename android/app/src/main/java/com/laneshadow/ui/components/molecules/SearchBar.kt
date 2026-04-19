package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * SearchBar molecule component
 *
 * Simple search input with icon. Following React Native wrapper patterns from
 * react-native/components/ui/search-bar.tsx
 *
 * Supports two modes:
 * - Clickable mode: Displays placeholder/value as non-editable text with onPress handler
 * - Editable mode: Full TextField with onValueChange for text input
 *
 * @param placeholder Placeholder text to display
 * @param value Current input value (null for clickable mode, non-null for editable)
 * @param onPress Press handler for expanding search (clickable mode)
 * @param onValueChange Text change callback (editable mode)
 * @param modifier Modifier for the search bar container
 */
@Composable
fun SearchBar(
    placeholder: String,
    value: String? = null,
    onPress: (() -> Unit)? = null,
    onValueChange: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Theme tokens
    val backgroundColor = theme.colors.surface.default
    val textColor = theme.colors.onSurface.default
    val subtleColor = theme.colors.onSurface.default.copy(alpha = 0.6f)
    val cornerRadius = theme.radius.md
    val horizontalPadding = 16.dp
    val verticalPadding = 12.dp
    val iconSize = 20.dp
    val fontSize = 14.sp

    // Determine mode based on callback presence
    val isEditable = onValueChange != null

    // Container
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(cornerRadius),
        color = backgroundColor,
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = horizontalPadding, vertical = verticalPadding)
                .then(
                    if (!isEditable && onPress != null) {
                        Modifier.clickable(onClick = onPress)
                    } else {
                        Modifier
                    }
                ),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Search icon
            IconSymbol(
                name = "search",
                size = iconSize,
                color = subtleColor,
            )

            // Text field or clickable placeholder
            if (isEditable) {
                // Editable mode: TextField with input
                BasicTextField(
                    value = value ?: "",
                    onValueChange = onValueChange!!,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    textStyle = TextStyle(
                        color = textColor,
                        fontSize = fontSize,
                    ),
                    cursorBrush = SolidColor(theme.colors.primary.default),
                    keyboardOptions = KeyboardOptions.Default.copy(
                        keyboardType = KeyboardType.Text
                    ),
                    decorationBox = { innerTextField ->
                        if (value.isNullOrEmpty()) {
                            Text(
                                text = placeholder,
                                color = subtleColor,
                                fontSize = fontSize,
                            )
                        }
                        innerTextField()
                    },
                )
            } else {
                // Clickable mode: Display placeholder or value as non-editable text
                Text(
                    text = value ?: placeholder,
                    color = if (value != null) textColor else subtleColor,
                    fontSize = fontSize,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}
