package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.ui.components.atoms.Button
import com.laneshadow.ui.components.atoms.ButtonSize
import com.laneshadow.ui.components.atoms.ButtonVariant
import com.laneshadow.ui.components.atoms.IconSymbol
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * FavoritesInfoSheet molecule component
 *
 * Bottom sheet dialog for displaying informational message when favorite roads
 * couldn't be included in route planning due to distance constraints.
 * Following React Native wrapper patterns from react-native/components/sheets/favorites-info-sheet.tsx
 *
 * @param visible Whether to show the info sheet
 * @param onClose Callback when user taps "Got it" button or dismisses the sheet
 * @param unavailableFavorites List of favorite road names that couldn't be included
 * @param testID Optional test ID for UI testing
 */
@Composable
fun FavoritesInfoSheet(
    visible: Boolean,
    onClose: () -> Unit,
    unavailableFavorites: List<String>,
    testID: String? = null,
) {
    if (!visible) {
        return
    }

    val theme = LocalLaneShadowTheme.current

    // Build accessibility description
    val accessibilityDescription = "Favorites not included. These favorite roads are too far from your planned route: ${unavailableFavorites.joinToString(", ")}"

    AlertDialog(
        onDismissRequest = onClose,
        modifier = Modifier
            .testTag(testID ?: "favorites-info-sheet")
            .semantics {
                contentDescription = accessibilityDescription
            },
        icon = {
            // Info icon in circular container (primary color at 15% opacity)
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(
                        color = theme.colors.primary.default.copy(alpha = 0.15f),
                        shape = CircleShape,
                    )
                    .padding(theme.space.md)
                    .testTag(testID?.let { "$it-icon" } ?: "favorites-info-icon"),
                contentAlignment = Alignment.Center
            ) {
                IconSymbol(
                    name = "information",
                    size = 32.dp,
                    color = theme.colors.primary.default,
                )
            }
        },
        title = {
            // Title: "Favorites Not Included" (title.md = 20sp, SemiBold, centered)
            Text(
                text = "Favorites Not Included",
                color = theme.colors.onSurface.default,
                style = theme.type.title.md,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(testID?.let { "$it-title" } ?: "favorites-info-title")
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = theme.space.lg),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(theme.space.md)
            ) {
                // Message (body.md, muted color)
                Text(
                    text = "These favorite roads are too far from your planned route:",
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    style = theme.type.body.md,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-message" } ?: "favorites-info-message")
                )

                // Favorites list (surface bg at 50% opacity, md radius, md padding, sm gap)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = theme.colors.surface.default.copy(alpha = 0.5f),
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md),
                        )
                        .padding(theme.space.md)
                        .testTag(testID?.let { "$it-list" } ?: "favorites-info-list")
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(theme.space.sm)
                    ) {
                        unavailableFavorites.forEach { favorite ->
                            Text(
                                text = "• $favorite",
                                color = theme.colors.onSurface.default,
                                style = theme.type.body.md,
                                modifier = Modifier.testTag("favorite-item-$favorite")
                            )
                        }
                    }
                }

                // Guidance text (body.sm, muted color)
                Text(
                    text = "Try planning a route nearer to these favorites, or add them to a different route.",
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    style = theme.type.body.sm,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-guidance" } ?: "favorites-info-guidance")
                )
            }
        },
        confirmButton = {
            // Got it button (default variant, lg size, full width)
            Button(
                variant = ButtonVariant.Default,
                size = ButtonSize.Large,
                text = "Got it",
                onPress = onClose,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(testID?.let { "$it-close-button" } ?: "favorites-info-close-button"),
            )
        },
        containerColor = theme.colors.surface.default,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.xl),
    )
}
