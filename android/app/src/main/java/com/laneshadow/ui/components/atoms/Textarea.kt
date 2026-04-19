package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Textarea atom component
 *
 * Multi-line text input with focus states and error handling.
 *
 * @param value Current text value in the textarea
 * @param onValueChange Callback when text value changes
 * @param placeholder Placeholder text to show when textarea is empty
 * @param error Error message to display (triggers error state when non-null)
 * @param disabled Whether the textarea is disabled (default: false)
 * @param testID Test identifier for UI testing (defaults to null)
 * @param modifier Modifier for the container
 */
@Suppress("UNUSED_PARAMETER")
@Composable
fun Textarea(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    error: String? = null,
    disabled: Boolean = false,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Matrix constants:
    // - Min height: 80dp
    // - Border radius: radius.md = 8
    // - Border width: borderWidth.thin = 1 (default), 2 (focused)
    // - Horizontal padding: 12dp
    // - Vertical padding: 8dp
    // - Text: type.body.md.fontSize = 14
    val MIN_HEIGHT = 80.dp
    val HORIZONTAL_PADDING = 12.dp
    val VERTICAL_PADDING = 8.dp
    val TEXT_FONT_SIZE = 14.sp
    val BORDER_RADIUS = 8.dp

    var isFocused by remember { mutableStateOf(false) }
    val interactionSource = remember { MutableInteractionSource() }

    // Track focus state from interactions
    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is FocusInteraction.Focus -> isFocused = true
                is FocusInteraction.Unfocus -> isFocused = false
            }
        }
    }

    // Determine border color and width based on state
    val borderColor = when {
        error != null -> theme.colors.danger.default
        isFocused -> theme.colors.ring.default
        else -> theme.colors.border.default
    }
    val borderWidth = when {
        isFocused -> 2.dp
        else -> 1.dp
    }

    // Disabled opacity
    val containerAlpha = if (disabled) 0.5f else 1.0f

    // Container with textarea and error
    Box(modifier = modifier) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = MIN_HEIGHT)
                .alpha(containerAlpha)
                .then(
                    if (testID != null) {
                        Modifier.testTag(testID)
                    } else {
                        Modifier
                    }
                )
                .semantics {
                    contentDescription = placeholder ?: "Text area"
                    if (disabled) {
                        disabled()
                    }
                    editableText = AnnotatedString(value)
                },
            shape = RoundedCornerShape(BORDER_RADIUS),
            color = theme.colors.surface.default,
            border = BorderStroke(borderWidth, borderColor),
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = HORIZONTAL_PADDING, vertical = VERTICAL_PADDING),
                enabled = !disabled,
                textStyle = TextStyle(
                    color = theme.colors.onSurface.default,
                    fontSize = TEXT_FONT_SIZE,
                ),
                cursorBrush = SolidColor(theme.colors.primary.default),
                maxLines = Int.MAX_VALUE,
                interactionSource = interactionSource,
                decorationBox = { innerTextField ->
                    if (value.isEmpty() && placeholder.isNotEmpty()) {
                        Text(
                            text = placeholder,
                            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                            fontSize = TEXT_FONT_SIZE,
                        )
                    }
                    innerTextField()
                },
            )
        }

        // Error message below textarea
        if (error != null) {
            Text(
                text = error,
                style = theme.type.label.sm,
                color = theme.colors.danger.default,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = theme.space.xs, top = theme.space.xs)
                    .semantics {
                        contentDescription = "Error: $error"
                    }
            )
        }
    }
}
