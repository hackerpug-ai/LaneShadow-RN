package com.laneshadow.ui.components.molecules

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * LocationSearchCard molecule component
 *
 * Renders location search results (from searchNearby / searchAlongRoute)
 * as a structured card in the chat transcript.
 *
 * States:
 *   running    → "Searching..." with pulsing dot
 *   complete   → 1-5 place result rows with type badges
 *   failed     → red-tinted error message
 *
 * Following React Native wrapper from react-native/components/chat/cards/location-search-card.tsx
 *
 * @param status Current search status (Running, Complete, or Failed)
 * @param headerText Optional header text (agent's conversational summary)
 * @param selectedResultId ID of the currently selected result (for highlighting)
 * @param onResultPress Optional callback when a result is pressed
 * @param modifier Modifier for the card container
 * @param testTag Test tag for testing
 */
@Composable
fun LocationSearchCard(
    status: LocationSearchStatus,
    headerText: String = "",
    selectedResultId: String? = null,
    onResultPress: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
    testTag: String = "location-search-card",
) {
    val theme = LocalLaneShadowTheme.current

    when (status) {
        is LocationSearchStatus.Running -> RunningState(
            theme = theme,
            modifier = modifier,
            testTag = testTag,
        )
        is LocationSearchStatus.Failed -> FailedState(
            message = status.message,
            theme = theme,
            modifier = modifier,
            testTag = testTag,
        )
        is LocationSearchStatus.Complete -> CompleteState(
            results = status.results,
            headerText = headerText,
            selectedResultId = selectedResultId,
            onResultPress = onResultPress,
            theme = theme,
            modifier = modifier,
            testTag = testTag,
        )
    }
}

/**
 * Running state component
 *
 * Displays a pulsing dot with "Searching nearby places..." text.
 *
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the container
 * @param testTag Test tag for testing
 */
@Composable
private fun RunningState(
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
    testTag: String = "location-search-card",
) {
    Surface(
        modifier = modifier
            .semantics {
                role = Role.Button
                contentDescription = "Searching for places"
            }
            .testTag("$testTag-running"),
        shape = RoundedCornerShape(theme.radius.md),
        color = theme.colors.surfaceVariant.default,
    ) {
        Row(
            modifier = Modifier
                .padding(theme.space.md)
                .testTag("$testTag-running-content"),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PulsingDot(
                color = theme.colors.info.default,
                modifier = Modifier.testTag("$testTag-pulsing-dot"),
            )
            Text(
                text = "Searching nearby places...",
                style = theme.type.body.sm,
                color = theme.colors.muted.default,
            )
        }
    }
}

/**
 * Failed state component
 *
 * Displays an error message with danger-tinted background.
 *
 * @param message Error message to display
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the container
 * @param testTag Test tag for testing
 */
@Composable
private fun FailedState(
    message: String,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
    testTag: String = "location-search-card",
) {
    Surface(
        modifier = modifier
            .semantics {
                role = Role.Button
                contentDescription = "Search failed: $message"
            }
            .testTag("$testTag-failed"),
        shape = RoundedCornerShape(theme.radius.md),
        color = theme.colors.danger.default.copy(alpha = 0.1f),
        border = BorderStroke(
            width = 1.dp,
            color = theme.colors.danger.default.copy(alpha = 0.3f),
        ),
    ) {
        Text(
            text = message,
            style = theme.type.body.sm,
            color = theme.colors.danger.default,
            modifier = Modifier
                .padding(theme.space.md)
                .testTag("$testTag-failed-message"),
        )
    }
}

/**
 * Complete state component
 *
 * Displays search results as a list of place rows with optional header text.
 *
 * @param results List of place search results
 * @param headerText Optional header text (agent's conversational summary)
 * @param selectedResultId ID of the currently selected result
 * @param onResultPress Optional callback when a result is pressed
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the container
 * @param testTag Test tag for testing
 */
@Composable
private fun CompleteState(
    results: List<PlaceResult>,
    headerText: String,
    selectedResultId: String?,
    onResultPress: ((String) -> Unit)?,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
    testTag: String = "location-search-card",
) {
    Surface(
        modifier = modifier.testTag("$testTag-complete"),
        shape = RoundedCornerShape(theme.radius.md),
        color = theme.colors.surfaceVariant.default,
    ) {
        Column(
            modifier = Modifier.testTag("$testTag-complete-content"),
            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            // Header text (agent's conversational summary)
            if (headerText.isNotEmpty()) {
                Text(
                    text = headerText,
                    style = theme.type.body.sm,
                    color = theme.colors.onSurface.default,
                    modifier = Modifier
                        .padding(
                            horizontal = theme.space.md,
                            vertical = theme.space.md,
                        )
                        .testTag("$testTag-header"),
                )
            }

            // Results list
            Column(
                modifier = Modifier
                    .padding(horizontal = theme.space.xs)
                    .testTag("$testTag-results"),
                verticalArrangement = Arrangement.spacedBy(0.dp),
            ) {
                if (results.isEmpty()) {
                    // Empty state
                    Text(
                        text = "No places found.",
                        style = theme.type.body.sm,
                        color = theme.colors.muted.default,
                        modifier = Modifier
                            .padding(theme.space.md)
                            .testTag("$testTag-empty"),
                    )
                } else {
                    results.forEachIndexed { index, result ->
                        PlaceResultRow(
                            result = result,
                            index = index + 1,
                            isSelected = result.id == selectedResultId,
                            onPress = onResultPress,
                            theme = theme,
                            testTag = testTag,
                        )
                    }
                }
            }
        }
    }
}

/**
 * PlaceResultRow component
 *
 * Displays a single place search result with numbered circle, name, badge,
 * address, distance, and detour time.
 *
 * @param result Place result to display
 * @param index 1-based index for the numbered circle
 * @param isSelected Whether this result is currently selected
 * @param onPress Optional callback when this result is pressed
 * @param theme LaneShadow theme values
 * @param testTag Test tag prefix for testing
 */
@Composable
private fun PlaceResultRow(
    result: PlaceResult,
    index: Int,
    isSelected: Boolean,
    onPress: ((String) -> Unit)?,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    testTag: String,
) {
    val badgeInfo = remember(result.types) { getPlaceTypeBadge(result.types) }

    // Format distance
    val distanceLabel = remember(result.distanceMeters) {
        result.distanceMeters?.let { meters ->
            if (meters >= 1000) {
                "${(meters / 1000).toFixed(1)} km"
            } else {
                "${meters.toInt()} m"
            }
        }
    }

    // Background color based on selection/press state
    val backgroundColor = if (isSelected) {
        theme.colors.info.default.copy(alpha = 0.1f)
    } else {
        Color.Transparent
    }

    val rowModifier = Modifier
        .fillMaxWidth()
        .background(
            color = backgroundColor,
            shape = RoundedCornerShape(theme.radius.md),
        )
        .then(
            if (onPress != null) {
                Modifier.clickable(
                    onClickLabel = "View ${result.name}",
                    onClick = { onPress(result.id) },
                    role = Role.Button,
                )
            } else {
                Modifier
            }
        )
        .padding(
            horizontal = theme.space.sm,
            vertical = theme.space.sm,
        )
        .testTag("$testTag-result-$index")
        .semantics {
            contentDescription = "${result.name}, ${result.address}"
        }

    Row(
        modifier = rowModifier,
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Numbered circle
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(
                    color = if (isSelected) {
                        theme.colors.info.default
                    } else {
                        theme.colors.info.default.copy(alpha = 0.15f)
                    },
                    shape = CircleShape,
                )
                .testTag("$testTag-result-$index-circle"),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = index.toString(),
                style = theme.type.label.sm,
                color = if (isSelected) {
                    theme.colors.onPrimary.default
                } else {
                    theme.colors.info.default
                },
                fontWeight = FontWeight.Bold,
            )
        }

        // Center content
        Column(
            modifier = Modifier
                .weight(1f)
                .testTag("$testTag-result-$index-content"),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            // Name row with badge
            Row(
                modifier = Modifier.testTag("$testTag-result-$index-name-row"),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = result.name,
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("$testTag-result-$index-name"),
                )

                // Type badge
                Badge(
                    label = badgeInfo.label,
                    color = badgeInfo.color,
                    theme = theme,
                    modifier = Modifier.testTag("$testTag-result-$index-badge"),
                )
            }

            // Address
            Text(
                text = result.address,
                style = theme.type.body.sm,
                color = theme.colors.muted.default,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.testTag("$testTag-result-$index-address"),
            )
        }

        // Right info (distance and detour)
        Column(
            modifier = Modifier
                .width(50.dp)
                .testTag("$testTag-result-${index}-info"),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            // Detour time
            if (result.detourMinutes != null && result.detourMinutes > 0) {
                Text(
                    text = "+${result.detourMinutes} min",
                    style = theme.type.label.sm,
                    color = theme.colors.warning.default,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    modifier = Modifier.testTag("$testTag-result-$index-detour"),
                )
            }

            // Distance
            distanceLabel?.let { distance ->
                Text(
                    text = distance,
                    style = theme.type.label.sm,
                    color = theme.colors.muted.default,
                    maxLines = 1,
                    modifier = Modifier.testTag("$testTag-result-$index-distance"),
                )
            }
        }
    }
}

/**
 * Badge component for place type
 *
 * Simple surface with text for place type badges.
 *
 * @param label Badge text label
 * @param color Badge color
 * @param theme LaneShadow theme values
 * @param modifier Modifier for the badge
 */
@Composable
private fun Badge(
    label: String,
    color: Color,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(theme.radius.sm),
        color = color.copy(alpha = 0.2f),
    ) {
        Text(
            text = label,
            style = theme.type.label.sm,
            color = color,
            modifier = Modifier.padding(
                horizontal = theme.space.sm,
                vertical = 4.dp,
            ),
        )
    }
}

/**
 * PulsingDot component
 *
 * Animated dot that pulses in opacity for running state.
 *
 * @param color Color of the dot
 * @param reduceMotion Whether to reduce motion (always false for now)
 * @param modifier Modifier for the dot
 */
@Composable
private fun PulsingDot(
    color: Color,
    reduceMotion: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulsing_dot")

    val opacity by if (reduceMotion) {
        androidx.compose.runtime.derivedStateOf { 0.7f }
    } else {
        infiniteTransition.animateFloat(
            initialValue = 0.4f,
            targetValue = 1.0f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = 600, delayMillis = 0),
                repeatMode = RepeatMode.Reverse,
            ),
            label = "pulsing_dot_opacity",
        )
    }

    Box(
        modifier = modifier
            .size(8.dp)
            .alpha(opacity)
            .background(
                color = color,
                shape = CircleShape,
            ),
    )
}

/**
 * Place type badge mapping
 *
 * Maps Google Place types to badge labels and colors.
 *
 * @param types List of place type strings
 * @return Pair of label and color
 */
private fun getPlaceTypeBadge(types: List<String>): BadgeInfo {
    if (types.isEmpty()) {
        return BadgeInfo("Place", Color.Gray)
    }

    // Place type mapping
    val typeMap = mapOf(
        "gas_station" to BadgeInfo("Gas", Color(0xFFF59E0B)), // warning
        "restaurant" to BadgeInfo("Food", Color(0xFF10B981)), // success
        "cafe" to BadgeInfo("Coffee", Color(0xFF3B82F6)), // info
        "coffee_shop" to BadgeInfo("Coffee", Color(0xFF3B82F6)), // info
        "lodging" to BadgeInfo("Stay", Color(0xFF8B5CF6)), // secondary
        "hotel" to BadgeInfo("Stay", Color(0xFF8B5CF6)), // secondary
        "tourist_attraction" to BadgeInfo("Scenic", Color(0xFF6366F1)), // primary
        "point_of_interest" to BadgeInfo("POI", Color(0xFF6366F1)), // primary
        "park" to BadgeInfo("Park", Color(0xFF10B981)), // success
        "parking" to BadgeInfo("Parking", Color(0xFF8B5CF6)), // secondary
        "car_repair" to BadgeInfo("Repair", Color(0xFFF59E0B)), // warning
        "convenience_store" to BadgeInfo("Store", Color(0xFF8B5CF6)), // secondary
    )

    // Find first matching type
    for (type in types) {
        typeMap[type]?.let { return it }
    }

    // Fallback: capitalize first type, strip underscores
    val fallback = types[0]
        .replace("_", " ")
        .split(" ")
        .joinToString(" ") { word ->
            word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    return BadgeInfo(fallback, Color.Gray)
}

/**
 * BadgeInfo data class
 *
 * Holds label and color for place type badges.
 *
 * @property label Badge text label
 * @property color Badge color
 */
private data class BadgeInfo(
    val label: String,
    val color: Color,
)

/**
 * PlaceResult data class
 *
 * Represents a single place search result.
 *
 * @property id Unique identifier for the place
 * @property name Place name
 * @property address Place address
 * @property types List of Google Place type strings
 * @property distanceMeters Distance in meters (optional)
 * @property detourMinutes Detour time in minutes (optional)
 */
data class PlaceResult(
    val id: String,
    val name: String,
    val address: String,
    val types: List<String> = emptyList(),
    val distanceMeters: Double? = null,
    val detourMinutes: Int? = null,
)

/**
 * LocationSearchStatus sealed class
 *
 * Represents the current status of location search.
 *
 * @property Running Search is in progress
 * @property Complete Search completed with results
 * @property Failed Search failed with error message
 */
sealed class LocationSearchStatus {
    /**
     * Running state - search is in progress
     */
    data object Running : LocationSearchStatus()

    /**
     * Complete state - search completed with results
     * @property results List of place search results
     */
    data class Complete(val results: List<PlaceResult>) : LocationSearchStatus()

    /**
     * Failed state - search failed
     * @property message Error message to display
     */
    data class Failed(val message: String = "Search failed.") : LocationSearchStatus()
}

/**
 * Extension function to format Double to fixed decimal places
 */
private fun Double.toFixed(decimals: Int): String {
    return "%.${decimals}f".format(this)
}
