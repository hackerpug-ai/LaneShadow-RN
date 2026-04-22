package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * CaptionInput molecule component
 *
 * Multi-line input with action buttons (mentions, AI assist, send).
 * Following React Native wrapper patterns from react-native/components/ui/caption-input.tsx
 *
 * @param value Current text value in the input field
 * @param onValueChange Callback when text value changes
 * @param onSend Callback when send button is clicked
 * @param placeholder Placeholder text to show when input is empty (default: "Add a caption...")
 * @param modifier Modifier for the container
 * @param testId Test identifier for UI testing (defaults to null)
 */
@Composable
fun CaptionInput(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    placeholder: String = "Add a caption...",
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Matrix constants documented against CaptionInput spec:
    // - Min height: 80dp, Max height: 120dp
    // - Border radius: radius.xl = 16
    // - Border width: borderWidth.thin = 1 (default), 2 (focused)
    // - Padding: space.md = 12
    // - Text: type.body.md.fontSize = 14
    // - Action button size: 36dp
    val MIN_HEIGHT = 80.dp
    val MAX_HEIGHT = 120.dp
    val BUTTON_SIZE = 36.dp
    val TEXT_FONT_SIZE = 14.sp

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
        isFocused -> theme.colors.primary.default
        else -> theme.colors.border.default
    }
    val borderWidth = when {
        isFocused -> 2.dp
        else -> 1.dp
    }

    // Container with input and action buttons
    Box(modifier = modifier) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .then(
                    if (testId != null) {
                        Modifier.testTag(testId)
                    } else {
                        Modifier
                    }
                )
                .semantics {
                    contentDescription = "Caption input"
                    editableText = AnnotatedString(value)
                },
            shape = RoundedCornerShape(theme.radius.xl),
            color = theme.colors.surface.default,
            border = BorderStroke(borderWidth, borderColor),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(theme.space.md)
            ) {
                // Text input field with padding for action buttons
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = MIN_HEIGHT, max = MAX_HEIGHT)
                        .padding(end = 120.dp), // Space for action buttons
                    textStyle = TextStyle(
                        color = theme.colors.onSurface.default,
                        fontSize = TEXT_FONT_SIZE,
                    ),
                    cursorBrush = SolidColor(theme.colors.primary.default),
                    maxLines = 3,
                    interactionSource = interactionSource,
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

                // Action buttons (absolute positioned)
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = theme.space.xs, bottom = theme.space.xs),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // @ Mentions Button (disabled for now)
                    IconButton(
                        onClick = { /* Disabled */ },
                        enabled = false,
                        modifier = Modifier
                            .size(BUTTON_SIZE)
                            .semantics {
                                contentDescription = "Mentions button (disabled)"
                            },
                    ) {
                        Icon(
                            imageVector = Glyphs.Default.Email, // Using @ symbol fallback
                            contentDescription = "Mentions",
                            tint = theme.colors.muted.default,
                        )
                    }

                    // AI Assist Button (disabled for now)
                    IconButton(
                        onClick = { /* Disabled */ },
                        enabled = false,
                        modifier = Modifier
                            .size(BUTTON_SIZE)
                            .semantics {
                                contentDescription = "AI assist button (disabled)"
                            },
                    ) {
                        Icon(
                            imageVector = Glyphs.Default.Star, // Using auto-fix fallback
                            contentDescription = "AI assist",
                            tint = theme.colors.muted.default,
                        )
                    }

                    // Send Button
                    IconButton(
                        onClick = onSend,
                        modifier = Modifier
                            .size(BUTTON_SIZE)
                            .then(
                                if (testId != null) {
                                    Modifier.testTag("${testId}-send-button")
                                } else {
                                    Modifier
                                }
                            )
                            .semantics {
                                contentDescription = "Send caption"
                            },
                    ) {
                        Icon(
                            imageVector = Glyphs.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = theme.colors.onPrimary.default,
                        )
                    }
                }
            }
        }
    }
}
