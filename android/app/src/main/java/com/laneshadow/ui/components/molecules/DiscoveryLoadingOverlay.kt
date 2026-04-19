package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.Skeleton
import kotlinx.coroutines.delay

/**
 * DiscoveryLoadingOverlay molecule component
 *
 * Skeleton overlay for initial route discovery loading state.
 * Features 300ms debounce to prevent flash on fast loads.
 * Semi-transparent glassmorphic design (map visible behind).
 *
 * Following React Native wrapper patterns from react-native/components/discovery/discovery-loading-overlay.tsx
 *
 * @param visible Whether the overlay is visible
 * @param testId Test ID for UI testing
 */
@Composable
fun DiscoveryLoadingOverlay(
    visible: Boolean,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // 300ms debounce to prevent flash on fast loads
    var debouncedVisible by remember { mutableStateOf(false) }

    LaunchedEffect(visible) {
        if (visible) {
            delay(300) // 300ms debounce
            debouncedVisible = true
        } else {
            // Immediately hide when data loads
            debouncedVisible = false
        }
    }

    // Early return when not visible (after debounce)
    if (!debouncedVisible) {
        Box(modifier = Modifier.testTag(testId ?: "discovery-loading-overlay"))
        return
    }

    // Semi-transparent surface background (80% opacity = 0.8f alpha)
    val overlayBackgroundColor = theme.colors.surface.default.copy(alpha = 0.8f)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(overlayBackgroundColor)
            .testTag(testId ?: "discovery-loading-overlay"),
    ) {
        Column(
            modifier = Modifier.padding(
                top = theme.space.lg,
                bottom = theme.space.lg,
            ),
        ) {
            // Skeleton for filter bar area
            FilterBarSkeleton(testId = testId)

            // Skeleton for route pins area
            RoutePinsSkeleton(testId = testId)
        }
    }
}

/**
 * Filter bar skeleton component
 *
 * Shows skeleton chips for archetypes filter.
 *
 * @param testId Test ID for UI testing
 */
@Composable
private fun FilterBarSkeleton(
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier
            .padding(horizontal = theme.space.lg)
            .padding(bottom = theme.space.md),
    ) {
        // Skeleton chips for archetypes (80-100dp wide, 32dp tall, rounded)
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            Skeleton(
                width = 80.dp,
                height = 32.dp,
                shape = theme.radius.full,
                testID = testId?.let { "$it-chip-1" } ?: "discovery-loading-overlay-chip-1",
            )
            Skeleton(
                width = 100.dp,
                height = 32.dp,
                shape = theme.radius.full,
                testID = testId?.let { "$it-chip-2" } ?: "discovery-loading-overlay-chip-2",
            )
            Skeleton(
                width = 90.dp,
                height = 32.dp,
                shape = theme.radius.full,
                testID = testId?.let { "$it-chip-3" } ?: "discovery-loading-overlay-chip-3",
            )
        }
    }
}

/**
 * Route pins skeleton component
 *
 * Shows skeleton avatars and labels simulating map pins in a scattered pattern.
 *
 * @param testId Test ID for UI testing
 */
@Composable
private fun RoutePinsSkeleton(
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.xl * 2),
    ) {
        // Pin row 1
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xl * 2),
        ) {
            PinSkeleton(
                labelWidth = 50.dp,
                testId = testId?.let { "$it-pin-1" } ?: "discovery-loading-overlay-pin-1",
            )
            PinSkeleton(
                labelWidth = 60.dp,
                testId = testId?.let { "$it-pin-2" } ?: "discovery-loading-overlay-pin-2",
            )
        }

        // Pin row 2
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xl * 3),
        ) {
            PinSkeleton(
                labelWidth = 45.dp,
                testId = testId?.let { "$it-pin-3" } ?: "discovery-loading-overlay-pin-3",
            )
            PinSkeleton(
                labelWidth = 55.dp,
                testId = testId?.let { "$it-pin-4" } ?: "discovery-loading-overlay-pin-4",
            )
        }

        // Pin row 3
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xl * 2),
            modifier = Modifier.padding(start = theme.space.lg),
        ) {
            PinSkeleton(
                labelWidth = 48.dp,
                testId = testId?.let { "$it-pin-5" } ?: "discovery-loading-overlay-pin-5",
            )
        }
    }
}

/**
 * Pin skeleton component
 *
 * Avatar skeleton + small label skeleton simulating a map pin.
 *
 * @param labelWidth Width of the label skeleton
 * @param testId Test ID for UI testing
 */
@Composable
private fun PinSkeleton(
    labelWidth: Dp,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // SkeletonAvatar (40dp circle matching RN default size)
        Skeleton(
            width = 40.dp,
            height = 40.dp,
            shape = theme.radius.full,
            testID = testId?.let { "$it-avatar" } ?: "discovery-loading-overlay-pin-avatar",
        )

        // Small label skeleton
        Skeleton(
            width = labelWidth,
            height = 12.dp,
            shape = theme.radius.sm,
            testID = testId?.let { "$it-label" } ?: "discovery-loading-overlay-pin-label",
        )
    }
}
