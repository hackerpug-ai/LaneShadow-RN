package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * ErrorMessage molecule component
 *
 * Conversational error display for chat interface.
 * Shows errors as chat bubbles with helpful messaging.
 * Matches chat bubble styling for consistency.
 *
 * Following React Native wrapper from react-native/components/chat/error-message.tsx
 *
 * @param message The error message text to display
 * @param modifier Modifier for the component container
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun ErrorMessage(
    message: String,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Build semantics with accessibility support
    val errorModifier = modifier
        .semantics {
            this.contentDescription = message
        }
        .testTag(testID ?: "error-message")

    Surface(
        modifier = errorModifier
            .widthIn(max = 400.dp) // Max 80% width on typical 360dp screen
            .padding(vertical = theme.space.xs),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
        color = theme.colors.surfaceVariant.default,
        border = BorderStroke(
            width = 1.dp,
            color = theme.colors.warning.default,
        ),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(theme.space.md),
            style = theme.type.body.md,
            color = theme.colors.onSurface.default,
        )
    }
}
