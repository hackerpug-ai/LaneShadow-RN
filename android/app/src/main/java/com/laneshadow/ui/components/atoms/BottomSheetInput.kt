package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * BottomSheetInput component props
 *
 * Following RN wrapper API from react-native/components/ui/bottom-sheet-input.tsx
 *
 * @param value Current text value in the input field
 * @param onValueChange Callback when text value changes
 * @param placeholder Placeholder text to show when input is empty
 * @param label Label text to display above the input
 * @param error Whether to show error state (red border)
 * @param editable Whether the input can be edited (default: true)
 * @param leftIcon Optional icon composable to display on the left side
 * @param rightIcon Optional icon composable to display on the right side
 * @param modifier Modifier for the container
 * @param testID Test identifier for UI testing (defaults to null)
 */
@Suppress("UNUSED_PARAMETER")
@Composable
fun BottomSheetInput(
    value: String = "",
    onValueChange: (String) -> Unit = {},
    placeholder: String? = null,
    label: String? = null,
    error: Boolean = false,
    editable: Boolean = true,
    leftIcon: @Composable (() -> Unit)? = null,
    rightIcon: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Matrix constants documented against BottomSheetInput.md:
    // - Container height: size.inputHeight = 48
    // - Border radius: radius.xl = 16
    // - Border width: borderWidth.thin = 1
    // - Icon size: 20dp
    // - Input text: type.body.md.fontSize = 16
    // - Label: type.label.sm.fontSize = 12
    val INPUT_HEIGHT = 48.dp
    val ICON_SIZE = 20.dp
    val LABEL_FONT_SIZE = 12.sp
    val INPUT_FONT_SIZE = 16.sp

    var isFocused by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }
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
        error -> theme.colors.danger.default
        isFocused -> theme.colors.primary.default
        else -> Color.Transparent
    }
    val borderWidth = when {
        error || isFocused -> 1.dp
        else -> 0.dp
    }

    // Disabled opacity
    val containerAlpha = if (editable) 1.0f else 0.5f

    // Container with label and input
    Box(modifier = modifier) {
        if (label != null) {
            Text(
                text = label,
                style = theme.type.label.sm,
                fontSize = LABEL_FONT_SIZE,
                color = theme.colors.onSurface.default,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = theme.space.xs)
                    .semantics {
                        contentDescription = label
                    }
            )
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(INPUT_HEIGHT)
                .alpha(containerAlpha)
                .then(
                    if (testID != null) {
                        Modifier.testTag(testID)
                    } else {
                        Modifier
                    }
                )
                .semantics {
                    contentDescription = label ?: placeholder ?: "Text input"
                    if (!editable) {
                        disabled()
                    }
                    editableText = AnnotatedString(value)
                },
            shape = RoundedCornerShape(theme.radius.xl),
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
                // Left icon with padding
                if (leftIcon != null) {
                    Box(
                        modifier = Modifier
                            .padding(start = theme.space.lg, end = theme.space.sm)
                            .width(ICON_SIZE)
                            .height(ICON_SIZE),
                        contentAlignment = Alignment.Center
                    ) {
                        leftIcon()
                    }
                } else if (leftIcon == null && rightIcon != null) {
                    // Add spacing to align with inputs that have icons
                    Spacer(modifier = Modifier.width(theme.space.lg))
                }

                // Text input field
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier
                        .weight(1f)
                        .focusRequester(focusRequester)
                        .padding(horizontal = theme.space.sm, vertical = theme.space.md),
                    enabled = editable,
                    singleLine = true,
                    textStyle = TextStyle(
                        color = theme.colors.onSurface.default,
                        fontSize = INPUT_FONT_SIZE,
                    ),
                    cursorBrush = SolidColor(theme.colors.primary.default),
                    keyboardOptions = KeyboardOptions.Default.copy(
                        keyboardType = KeyboardType.Text
                    ),
                    keyboardActions = KeyboardActions.Default,
                    interactionSource = interactionSource,
                )

                // Right icon with padding
                if (rightIcon != null) {
                    Box(
                        modifier = Modifier
                            .padding(start = theme.space.sm, end = theme.space.lg)
                            .width(ICON_SIZE)
                            .height(ICON_SIZE),
                        contentAlignment = Alignment.Center
                    ) {
                        rightIcon()
                    }
                } else if (rightIcon == null && leftIcon != null) {
                    // Add spacing to align with inputs that have icons
                    Spacer(modifier = Modifier.width(theme.space.lg))
                }
            }
        }
    }
}
