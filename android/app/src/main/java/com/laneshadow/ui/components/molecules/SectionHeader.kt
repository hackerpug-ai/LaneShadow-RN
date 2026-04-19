package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * SectionHeader molecule component
 *
 * Section title with optional subtitle and action button.
 * Following React Native wrapper patterns from react-native/components/ui/section-header.tsx
 *
 * @param title Section title text
 * @param subtitle Optional subtitle text
 * @param action Optional action button text
 * @param onActionPress Optional action button callback
 * @param modifier Modifier for the component container
 * @param testId Optional test identifier for UI testing
 */
@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    action: String? = null,
    onActionPress: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Build accessibility description combining title and subtitle
    val accessibilityDescription = if (subtitle != null) {
        "$title. $subtitle"
    } else {
        title
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .testTag(testId ?: "section-header")
            .semantics {
                contentDescription = accessibilityDescription
            },
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
    ) {
        // Text container (title + subtitle) on the left
        Column(
            modifier = Modifier
                .weight(1f)
                .testTag(testId?.let { "$it-text-container" } ?: "section-header-text-container"),
        ) {
            // Title (16sp, SemiBold, onSurface.default)
            Text(
                text = title,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.onSurface.default,
                modifier = Modifier.testTag(
                    testId?.let { "$it-title" } ?: "section-header-title"
                ),
            )

            // Optional subtitle (12sp, Normal, onSurface.default with 0.6f alpha)
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = subtitle,
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.sp,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    modifier = Modifier.testTag(
                        testId?.let { "$it-subtitle" } ?: "section-header-subtitle"
                    ),
                )
            }
        }

        // Optional action button on the right
        if (action != null) {
            Spacer(modifier = Modifier.width(theme.space.md))

            val actionModifier = if (onActionPress != null) {
                Modifier
                    .testTag(testId?.let { "$it-action" } ?: "section-header-action")
                    .clickable(
                        onClickLabel = action,
                        onClick = onActionPress,
                    )
            } else {
                Modifier.testTag(testId?.let { "$it-action" } ?: "section-header-action")
            }

            Text(
                text = action,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 0.sp,
                ),
                color = theme.colors.primary.default,
                modifier = actionModifier,
            )
        }
    }
}
