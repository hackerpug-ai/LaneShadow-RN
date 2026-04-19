package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * IntentSummaryPill molecule component
 *
 * Compact pill showing the active search intent with dismiss button.
 * Following RN implementation from react-native/components/discovery/intent-summary-pill.tsx
 *
 * Visual treatment:
 * - Primary color background at 10% opacity
 * - Primary color border at 30% opacity
 * - Copper/primary accent dot (8x8dp, circular)
 * - Text in primary color with label.md typography
 * - Dismiss button (20x20dp, circular) with close icon at 20% opacity bg
 * - Self-aligning (wrap content, not full width)
 *
 * @param text The search intent text to display (e.g., "Twisty mountain roads near you")
 * @param onDismiss Callback when user taps the dismiss button
 * @param modifier Modifier for the component
 * @param testTag Optional test tag for testing
 */
@Composable
fun IntentSummaryPill(
    text: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    testTag: String = "intent-summary-pill",
) {
    val theme = LocalLaneShadowTheme.current

    // Colors from spec
    val primaryColor = theme.colors.primary.default
    val backgroundColor = primaryColor.copy(alpha = 0.1f)  // 10% opacity
    val borderColor = primaryColor.copy(alpha = 0.3f)      // 30% opacity
    val dismissBgColor = primaryColor.copy(alpha = 0.2f)   // 20% opacity

    Row(
        modifier = modifier
            .background(
                color = backgroundColor,
                shape = CircleShape, // radius.full
            )
            .border(
                width = 1.dp,
                color = borderColor,
                shape = CircleShape, // radius.full
            )
            .padding(
                horizontal = 12.dp,  // Spec: 12dp horizontal padding
                vertical = 8.dp,     // Spec: 8dp vertical padding
            )
            .semantics {
                contentDescription = "Intent summary: $text"
            },
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm), // 8dp gap
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Copper/primary accent dot (8x8dp, circular)
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(
                    color = primaryColor,
                    shape = CircleShape,
                )
        )

        // Intent text (label.md typography, primary color)
        Text(
            text = text,
            style = theme.type.label.md,
            color = primaryColor,
            maxLines = 1,
            modifier = Modifier
                .semantics {
                    contentDescription = "Search intent: $text"
                },
        )

        // Dismiss button (20x20dp, circular, 20% opacity bg)
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape) // radius.full
                .background(dismissBgColor)
                .clickable(
                    onClick = onDismiss,
                    role = Role.Button,
                    interactionSource = null,
                    indication = null,
                )
                .semantics {
                    contentDescription = "Dismiss intent"
                },
            contentAlignment = Alignment.Center,
        ) {
            IconSymbol(
                name = "close",
                size = 16.sp.value.dp,
                color = primaryColor,
                testID = "$testTag-dismiss",
            )
        }
    }
}
