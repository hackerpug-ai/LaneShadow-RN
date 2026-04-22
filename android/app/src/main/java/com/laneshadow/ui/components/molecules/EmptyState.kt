package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.ui.components.atoms.Button
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * EmptyState molecule component
 *
 * Generic reusable empty state with icon, headline, body, and optional CTA button.
 * Following React Native wrapper patterns from react-native/components/ui/empty-state.tsx
 *
 * @param icon Icon to display (64dp)
 * @param headline Headline text
 * @param body Body description text
 * @param ctaLabel Optional CTA button text
 * @param onCtaClick Optional CTA button callback
 * @param modifier Modifier for the component
 * @param testId Test ID for UI testing
 */
@Composable
fun EmptyState(
    icon: ImageVector,
    headline: String,
    body: String,
    ctaLabel: String? = null,
    onCtaClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Build accessibility description combining headline and body
    val accessibilityDescription = "$headline. $body"

    Column(
        modifier = modifier
            .fillMaxSize()
            .testTag(testId ?: "empty-state")
            .semantics {
                contentDescription = accessibilityDescription
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Icon (64dp, muted color with 0.4f alpha)
        Icon(
            imageVector = icon,
            contentDescription = null, // Decorative icon, description is in parent
            modifier = Modifier
                .size(64.dp)
                .testTag(testId?.let { "$it-icon" } ?: "empty-state-icon"),
            tint = theme.colors.onSurface.default.copy(alpha = 0.4f),
        )

        Spacer(modifier = Modifier.height(theme.space.lg))

        // Headline (18sp, SemiBold)
        Text(
            text = headline,
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 18.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
            ),
            color = theme.colors.onSurface.default,
            modifier = Modifier.testTag(
                testId?.let { "$it-headline" } ?: "empty-state-headline"
            ),
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Body (14sp, Normal, 0.6f alpha for muted)
        Text(
            text = body,
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 14.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
            ),
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
            modifier = Modifier.testTag(
                testId?.let { "$it-body" } ?: "empty-state-body"
            ),
        )

        // Optional CTA button
        if (ctaLabel != null && onCtaClick != null) {
            Spacer(modifier = Modifier.height(24.dp))

            Button(
                variant = com.laneshadow.ui.components.atoms.ButtonVariant.Default,
                size = com.laneshadow.ui.components.atoms.ButtonSize.Default,
                text = ctaLabel,
                onPress = onCtaClick,
                accessibilityLabel = ctaLabel,
                testID = testId?.let { "$it-cta" } ?: "empty-state-cta",
            )
        }
    }
}
