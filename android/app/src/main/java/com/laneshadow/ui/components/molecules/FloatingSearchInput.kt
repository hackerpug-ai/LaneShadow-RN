package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * FloatingSearchInput molecule component
 *
 * Search input bar with loading state, clear button, and optional press handler.
 * Following React Native wrapper patterns from react-native/components/ui/floating-search-input.tsx
 *
 * @param value Current text value in the input field
 * @param onChangeText Callback when text value changes
 * @param placeholder Placeholder text to show when input is empty
 * @param onClear Optional callback when clear button is clicked
 * @param onPress Optional callback when entire component is pressed (makes input non-editable)
 * @param isLoading Whether to show loading indicator (default: false)
 * @param onCancelLoading Optional callback when cancel loading button is clicked
 * @param modifier Modifier for the search input container
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun FloatingSearchInput(
    value: String,
    onChangeText: (String) -> Unit,
    placeholder: String,
    onClear: (() -> Unit)? = null,
    onPress: (() -> Unit)? = null,
    isLoading: Boolean = false,
    onCancelLoading: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Matrix constants documented against FloatingSearchInput spec:
    // - Background: surfaceVariant.default
    // - Border: border.default
    // - Radius: xl
    // - Padding horizontal: md
    // - Padding vertical: xs
    // - Search icon size: xl
    // - Activity indicator size: md
    // - Clear icon size: 18.dp
    // - Right padding: 4xl when loading, 2xl normal
    val ICON_SIZE = 18.dp
    val TEXT_FONT_SIZE = 14.sp

    val isPressableOnly = onPress != null
    val canClear = value.isNotEmpty() && !isLoading
    val canCancel = isLoading && onCancelLoading != null

    // Container with surface variant background
    Surface(
        modifier = modifier.semantics {
            contentDescription = testID ?: "Floating search input"
        },
        shape = RoundedCornerShape(theme.radius.xl),
        color = theme.colors.surfaceVariant.default,
        border = BorderStroke(1.dp, theme.colors.border.default),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = theme.space.md, vertical = theme.space.xs)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Search icon
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    modifier = Modifier.size(theme.space.xl),
                )

                // Text input field
                BasicTextField(
                    value = value,
                    onValueChange = onChangeText,
                    modifier = Modifier.weight(1f),
                    enabled = !isPressableOnly,
                    singleLine = true,
                    textStyle = TextStyle(
                        color = theme.colors.onSurface.default,
                        fontSize = TEXT_FONT_SIZE,
                    ),
                    cursorBrush = SolidColor(theme.colors.primary.default),
                    keyboardOptions = KeyboardOptions.Default.copy(
                        keyboardType = KeyboardType.Text
                    ),
                    interactionSource = remember { MutableInteractionSource() },
                    decorationBox = { innerTextField ->
                        if (value.isEmpty()) {
                            Text(
                                text = placeholder,
                                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                                fontSize = TEXT_FONT_SIZE,
                            )
                        }
                        innerTextField()
                    },
                )

                // Right padding space for buttons
                Box(modifier = Modifier.size(if (isLoading) theme.space.xxxxl else theme.space.xxl))
            }

            // Right side buttons (absolute positioned)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = theme.space.sm),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (isLoading) {
                        // Loading indicator
                        CircularProgressIndicator(
                            modifier = Modifier.size(theme.space.md),
                            strokeWidth = 2.dp,
                            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                        )

                        // Cancel loading button
                        if (canCancel) {
                            IconButton(
                                onClick = onCancelLoading,
                                modifier = Modifier.size(ICON_SIZE + theme.space.xs),
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cancel loading",
                                    tint = theme.colors.onSurface.default,
                                    modifier = Modifier.size(ICON_SIZE),
                                )
                            }
                        }
                    } else if (canClear) {
                        // Clear button
                        IconButton(
                            onClick = { onClear?.invoke() },
                            modifier = Modifier.size(ICON_SIZE + theme.space.xs),
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Clear search",
                                tint = theme.colors.onSurface.default,
                                modifier = Modifier.size(ICON_SIZE),
                            )
                        }
                    }
                }
            }
        }
    }
}
