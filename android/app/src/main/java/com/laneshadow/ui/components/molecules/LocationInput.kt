package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol
import com.laneshadow.ui.components.atoms.Skeleton

/**
 * LocationInput molecule component
 *
 * Input field with autocomplete suggestions for location search.
 * Following React Native wrapper patterns from react-native/components/location-input.tsx
 *
 * Design tokens:
 * - Colors: surface.default (input bg, suggestion bg), border.default, surfaceVariant.default (skeleton bg, pressed), onSurface.default (text)
 * - Typography: body.sm (suggestion text)
 * - Spacing: sm (suggestion padding), md (suggestion padding)
 * - Radius: lg (input and suggestion container)
 *
 * @param label Label text to display above the input
 * @param value Current text value in the input field
 * @param onValueChange Callback when text value changes (optional, for editable mode)
 * @param placeholder Placeholder text to show when input is empty
 * @param iconName Icon name to display on the right side of the input
 * @param isFocused Whether the input is currently focused
 * @param suggestions List of suggestion strings to display (empty list = no suggestions)
 * @param isLoading Whether suggestions are currently loading (shows skeleton state)
 * @param onSuggestionSelect Callback when a suggestion is clicked, receives index (optional)
 * @param onFocusChange Callback when focus state changes (optional)
 * @param modifier Modifier for the container
 * @param testTag Test identifier for UI testing
 */
@Composable
fun LocationInput(
    label: String,
    value: String,
    onValueChange: ((String) -> Unit)? = null,
    placeholder: String,
    iconName: String,
    isFocused: Boolean,
    suggestions: List<String> = emptyList(),
    isLoading: Boolean = false,
    onSuggestionSelect: ((Int) -> Unit)? = null,
    onFocusChange: ((Boolean) -> Unit)? = null,
    modifier: Modifier = Modifier,
    testTag: String = "location-input",
) {
    val theme = LocalLaneShadowTheme.current

    // Matrix constants documented against LocationInput spec:
    // - Input height: 48dp
    // - Border radius: radius.lg = 12
    // - Border width: 1dp (when focused)
    // - Suggestion row padding: space.sm (vertical), space.md (horizontal)
    // - Suggestion text: type.body.sm.fontSize = 12
    // - Skeleton height: space.md = 16
    val INPUT_HEIGHT = 48.dp
    val ICON_SIZE = 20.dp
    val LABEL_FONT_SIZE = 12.sp
    val INPUT_FONT_SIZE = 14.sp
    val SUGGESTION_FONT_SIZE = 12.sp
    val HORIZONTAL_PADDING = 16.dp

    // Track internal focus state
    var internalIsFocused by remember { mutableStateOf(false) }
    val effectiveIsFocused = isFocused || internalIsFocused

    val interactionSource = remember { MutableInteractionSource() }

    // Track focus state from interactions
    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is FocusInteraction.Focus -> {
                    internalIsFocused = true
                    onFocusChange?.invoke(true)
                }
                is FocusInteraction.Unfocus -> {
                    internalIsFocused = false
                    onFocusChange?.invoke(false)
                }
            }
        }
    }

    // Determine border color and width based on state
    val borderColor = theme.colors.border.default
    val borderWidth = if (effectiveIsFocused) 1.dp else 0.dp

    // Determine if suggestions should be shown
    val hasSuggestions = effectiveIsFocused && (isLoading || suggestions.isNotEmpty())

    // Icon color based on state
    val iconColor = if (effectiveIsFocused) {
        theme.colors.primary.default
    } else {
        theme.colors.muted.default
    }

    Column(modifier = modifier) {
        // Label above input
        Text(
            text = label.uppercase(),
            style = theme.type.label.sm,
            fontSize = LABEL_FONT_SIZE,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = theme.space.xs, bottom = 4.dp)
                .semantics {
                    contentDescription = label
                }
        )

        // Input container with suggestions below
        Box(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Input field surface
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(INPUT_HEIGHT)
                        .testTag("$testTag-input")
                        .semantics {
                            contentDescription = "Location input: ${value.ifEmpty { placeholder }}"
                        },
                    shape = if (hasSuggestions) {
                        // Remove bottom border radius when suggestions are showing
                        RoundedCornerShape(
                            topStart = theme.radius.lg,
                            topEnd = theme.radius.lg,
                            bottomStart = 0.dp,
                            bottomEnd = 0.dp,
                        )
                    } else {
                        RoundedCornerShape(theme.radius.lg)
                    },
                    color = theme.colors.surface.default,
                    border = if (borderWidth > 0.dp) {
                        BorderStroke(borderWidth, borderColor)
                    } else null,
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(INPUT_HEIGHT),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Text input field
                        if (onValueChange != null) {
                            // Editable mode: TextField with input
                            BasicTextField(
                                value = value,
                                onValueChange = onValueChange,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = HORIZONTAL_PADDING, vertical = theme.space.md),
                                enabled = true,
                                singleLine = true,
                                textStyle = TextStyle(
                                    color = theme.colors.onSurface.default,
                                    fontSize = INPUT_FONT_SIZE,
                                ),
                                cursorBrush = SolidColor(theme.colors.primary.default),
                                interactionSource = interactionSource,
                                decorationBox = { innerTextField ->
                                    if (value.isEmpty()) {
                                        Text(
                                            text = placeholder,
                                            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                                            fontSize = INPUT_FONT_SIZE,
                                        )
                                    }
                                    innerTextField()
                                },
                            )
                        } else {
                            // Read-only mode: Display value or placeholder as non-editable text
                            Text(
                                text = if (value.isEmpty()) placeholder else value,
                                color = if (value.isEmpty()) {
                                    theme.colors.onSurface.default.copy(alpha = 0.6f)
                                } else {
                                    theme.colors.onSurface.default
                                },
                                fontSize = INPUT_FONT_SIZE,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = HORIZONTAL_PADDING)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null,
                                    ) {
                                        // Handle click to focus (no-op for read-only mode)
                                    }
                            )
                        }

                        // Right icon
                        Box(
                            modifier = Modifier
                                .padding(start = theme.space.sm, end = HORIZONTAL_PADDING)
                                .width(ICON_SIZE)
                                .height(ICON_SIZE),
                            contentAlignment = Alignment.Center
                        ) {
                            IconSymbol(
                                name = iconName,
                                size = ICON_SIZE,
                                color = iconColor,
                                modifier = Modifier.testTag("$testTag-icon"),
                            )
                        }
                    }
                }

                // Suggestions dropdown (flush with input, no gap)
                if (hasSuggestions) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("$testTag-suggestions")
                            .semantics {
                                contentDescription = "Location suggestions"
                            },
                        shape = RoundedCornerShape(
                            topStart = 0.dp,
                            topEnd = 0.dp,
                            bottomStart = theme.radius.lg,
                            bottomEnd = theme.radius.lg,
                        ),
                        color = theme.colors.surface.default,
                        border = BorderStroke(1.dp, borderColor),
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(0.dp),
                        ) {
                            if (isLoading) {
                                // Show skeleton loading state
                                repeat(3) { index ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = theme.space.md, vertical = theme.space.sm)
                                            .testTag("$testTag-skeleton-$index"),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Skeleton(
                                            width = 160.dp,
                                            height = theme.space.md,
                                            shape = theme.radius.md,
                                            modifier = Modifier.weight(1f),
                                        )
                                    }
                                }
                            } else {
                                // Show populated suggestions
                                suggestions.forEachIndexed { index, suggestion ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable(
                                                interactionSource = remember { MutableInteractionSource() },
                                                indication = null,
                                                onClick = { onSuggestionSelect?.invoke(index) }
                                            )
                                            .padding(horizontal = theme.space.md, vertical = theme.space.sm)
                                            .testTag("$testTag-suggestion-$index")
                                            .semantics {
                                                contentDescription = "Suggestion: $suggestion"
                                            },
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Text(
                                            text = suggestion,
                                            style = theme.type.body.sm,
                                            fontSize = SUGGESTION_FONT_SIZE,
                                            color = theme.colors.onSurface.default,
                                            maxLines = 1,
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
