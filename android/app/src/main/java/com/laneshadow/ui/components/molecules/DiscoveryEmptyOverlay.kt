package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DiscoveryEmptyOverlay molecule component
 *
 * Full-screen overlay with semi-transparent background for empty state
 * in the discovery screen. Wraps EmptyState with 80% opacity surface background.
 * Following React Native wrapper patterns from react-native/components/discovery/discovery-empty-overlay.tsx
 *
 * @param visible Whether the overlay is visible
 * @param message Optional headline message (default: "No routes in this area")
 * @param suggestion Optional body suggestion text (default: "Try adjusting your filters or zooming out")
 * @param ctaLabel Optional CTA button label
 * @param onCtaPress Optional CTA button callback
 * @param modifier Modifier for the component
 * @param testId Test ID for UI testing
 */
@Composable
fun DiscoveryEmptyOverlay(
    visible: Boolean,
    message: String = "No routes in this area",
    suggestion: String = "Try adjusting your filters or zooming out",
    ctaLabel: String? = null,
    onCtaPress: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Build accessibility description
    val accessibilityDescription = if (visible) {
        "$message. $suggestion"
    } else {
        ""
    }

    // If not visible, render empty Box
    if (!visible) {
        Box(modifier = modifier)
        return
    }

    // Semi-transparent surface background (80% opacity = 0.8f alpha)
    val overlayBackgroundColor = theme.colors.surface.default.copy(alpha = 0.8f)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(overlayBackgroundColor)
            .testTag(testId ?: "discovery-empty-overlay")
            .semantics {
                contentDescription = accessibilityDescription
            },
        contentAlignment = Alignment.Center,
    ) {
        EmptyState(
            icon = Icons.Default.Search,
            headline = message,
            body = suggestion,
            ctaLabel = ctaLabel,
            onCtaClick = onCtaPress,
            testId = testId?.let { "$it-empty-state" } ?: "discovery-empty-overlay-empty-state",
        )
    }
}
