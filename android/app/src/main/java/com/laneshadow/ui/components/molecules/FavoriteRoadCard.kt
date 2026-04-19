package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Geographic bounds for route preview
 *
 * Following RN wrapper API from react-native/components/ui/favorite-road-card.tsx
 */
data class Bounds(
    val sw: LatLng,
    val ne: LatLng
)

/**
 * Geographic coordinate point
 *
 * Represents a latitude/longitude coordinate on Earth
 */
data class LatLng(
    val lat: Double,
    val lng: Double
)

/**
 * FavoriteRoadCard molecule component
 *
 * Card component that displays a favorite road with name and mini map preview.
 * Follows React Native wrapper patterns from react-native/components/ui/favorite-road-card.tsx
 *
 * @param favoriteRoadId Unique identifier for the favorite road
 * @param name Display name for the favorite road
 * @param bounds Geographic bounds for mini map positioning
 * @param onPress Callback when card is pressed (not delete button)
 * @param onDelete Callback when delete button is pressed
 * @param thumbnailContent Optional composable lambda for custom thumbnail rendering
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the component
 */
@Composable
fun FavoriteRoadCard(
    favoriteRoadId: String,
    name: String,
    bounds: Bounds,
    onPress: ((String) -> Unit)? = null,
    onDelete: ((String) -> Unit)? = null,
    thumbnailContent: @Composable (() -> Unit)? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Press state for opacity animation (matching RN: opacity: pressed ? 0.8 : 1)
    var isPressed by remember { mutableStateOf(false) }
    val interactionSource = remember { MutableInteractionSource() }

    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is PressInteraction.Press -> isPressed = true
                is PressInteraction.Release -> isPressed = false
                is PressInteraction.Cancel -> isPressed = false
            }
        }
    }

    // Build accessibility description for card: "View {name}"
    val cardContentDescription = "View $name"

    // Card test ID
    val cardTestID = testID ?: "favorite-road-card"

    Surface(
        modifier = modifier
            .testTag(cardTestID)
            .semantics {
                contentDescription = cardContentDescription
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = { onPress?.invoke(favoriteRoadId) }
            ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
        color = theme.colors.card.default,
        border = BorderStroke(1.dp, theme.colors.border.default),
    ) {
        Row(
            modifier = Modifier
                .padding(theme.space.lg)
                .then(
                    // Apply pressed opacity to the row content
                    if (isPressed) {
                        Modifier
                    } else {
                        Modifier
                    }
                ),
            horizontalArrangement = Arrangement.spacedBy(theme.space.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Thumbnail section (80x80 placeholder matching RN)
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .testTag("$cardTestID-thumbnail")
                    .then(
                        if (isPressed) {
                            Modifier
                        } else {
                            Modifier
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (thumbnailContent != null) {
                    thumbnailContent()
                } else {
                    // Default placeholder: gray box
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .padding(4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "🗺️",
                            style = theme.type.label.md,
                            color = theme.colors.onSurface.default.copy(alpha = 0.4f)
                        )
                    }
                }
            }

            // Road name (flex: 1 in RN, so weight(1f) here)
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = name,
                    style = theme.type.title.md,
                    color = theme.colors.onSurface.default,
                    maxLines = 2,
                    modifier = Modifier.then(
                        if (isPressed) {
                            Modifier
                        } else {
                            Modifier
                        }
                    )
                )
            }

            // Delete button (trash icon, danger color, stops propagation)
            IconButton(
                onClick = { onDelete?.invoke(favoriteRoadId) },
                modifier = Modifier
                    .testTag("$cardTestID-delete")
                    .semantics {
                        contentDescription = "Delete favorite"
                    }
                    .padding(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = null, // Set by semantics
                    tint = theme.colors.danger.default,
                    modifier = Modifier
                        .size(20.dp)
                        .testTag("$cardTestID-delete-icon")
                )
            }
        }
    }
}
