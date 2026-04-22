package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Data class representing an excluded favorite
 */
data class ExcludedFavorite(
    val id: String,
    val name: String? = null,
    val reason: String
)

/**
 * Format excluded favorites list for display
 * Shows first 3 names, then "and N more" if applicable
 *
 * @param favorites List of excluded favorites
 * @return Formatted string with favorite names
 */
private fun formatExcludedList(favorites: List<ExcludedFavorite>): String {
    val namedFavorites = favorites.filter { it.name != null }
    val names = namedFavorites.mapNotNull { it.name }

    if (names.isEmpty()) {
        return "some favorites"
    }

    if (names.size <= 3) {
        return names.joinToString(", ")
    }

    val visible = names.take(3)
    val remaining = names.size - 3
    return "${visible.joinToString(", ")} and $remaining more"
}

/**
 * FavoriteExclusionAlert molecule component
 *
 * Displays an info message when favorite roads are excluded from route planning
 * due to distance constraints (> 50km from route).
 *
 * Features:
 * - Lists names of excluded favorites (up to 3, then "and N more")
 * - Auto-dismisses after 10 seconds
 * - Dismissible via tap
 * - Session-aware (doesn't show same exclusion twice)
 * - Full accessibility support
 *
 * Following React Native wrapper from react-native/components/ui/favorite-exclusion-alert.tsx
 *
 * @param excludedFavorites Array of excluded favorites with names and reasons
 * @param includeFavorites Whether include favorites toggle is ON (default: true)
 * @param onDismiss Callback when alert is dismissed
 * @param sessionKey Optional session key for tracking shown exclusions
 */
@Composable
fun FavoriteExclusionAlert(
    excludedFavorites: List<ExcludedFavorite>? = null,
    includeFavorites: Boolean = true,
    onDismiss: () -> Unit,
    sessionKey: String? = null
) {
    val theme = LocalLaneShadowTheme.current

    // Track session keys we've already shown
    val shownSessions = remember { mutableSetOf<String>() }
    var isVisible by remember { mutableStateOf(false) }

    // Don't show if toggle is off or no exclusions
    val shouldShow = includeFavorites &&
                     !excludedFavorites.isNullOrEmpty() &&
                     (sessionKey == null || !shownSessions.contains(sessionKey))

    // Update visibility state
    if (shouldShow && !isVisible) {
        isVisible = true
        // Track this session
        if (sessionKey != null) {
            shownSessions.add(sessionKey)
        }
    } else if (!shouldShow && isVisible) {
        isVisible = false
    }

    // Auto-dismiss after 10 seconds
    LaunchedEffect(isVisible) {
        if (isVisible) {
            kotlinx.coroutines.delay(10000L)
            isVisible = false
            onDismiss()
        }
    }

    // Don't render if not visible
    if (!isVisible) {
        return
    }

    val excludedList = formatExcludedList(excludedFavorites ?: emptyList())
    val accessibilityLabel = "Some favorites couldn't be included. These favorites are too far from your route: $excludedList"

    Surface(
        modifier = Modifier
            .padding(horizontal = theme.space.md, vertical = theme.space.sm)
            .semantics {
                this.contentDescription = accessibilityLabel
            }
            .clickable {
                isVisible = false
                onDismiss()
            },
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md),
        color = theme.colors.warningContainer.default,
        border = BorderStroke(
            width = 1.dp,
            color = theme.colors.warning.default
        )
    ) {
        Row(
            modifier = Modifier
                .padding(theme.space.md),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.Top
        ) {
            // Info icon
            Icon(
                imageVector = Glyphs.Default.Info,
                contentDescription = null, // Decorative
                tint = theme.colors.onWarningContainer.default,
                modifier = Modifier.size(20.dp)
            )

            // Text column
            Column(
                modifier = Modifier
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs)
            ) {
                // Title
                Text(
                    text = "Some favorites couldn't be included",
                    style = theme.type.title.sm,
                    color = theme.colors.onWarningContainer.default
                )

                // Body
                Text(
                    text = "These favorites are too far from your route: $excludedList",
                    style = theme.type.body.md,
                    color = theme.colors.onWarningContainer.default
                )
            }

            // Dismiss button
            IconButton(
                onClick = {
                    isVisible = false
                    onDismiss()
                },
                modifier = Modifier
                    .semantics {
                        this.contentDescription = "Dismiss"
                    }
            ) {
                Icon(
                    imageVector = Glyphs.Default.Close,
                    contentDescription = "Dismiss",
                    tint = theme.colors.onWarningContainer.default,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
