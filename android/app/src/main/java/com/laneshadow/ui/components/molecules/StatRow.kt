package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol

/**
 * StatRow molecule component
 *
 * Row displaying a stat with icon and value text (e.g., duration, distance, wind level).
 * Following React Native wrapper patterns from react-native/components/ui/stat-row.tsx
 *
 * @param icon Material icon name (from IconSymbol mapping)
 * @param value Value text to display
 * @param iconSize Icon size in dp (default: 18.dp)
 * @param modifier Modifier for the component container
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun StatRow(
    icon: String,
    value: String,
    iconSize: Dp = 18.dp,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .testTag(testID ?: "stat-row")
            .semantics {
                contentDescription = value
            },
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Icon with onSurface color at 60% opacity (subtle)
        IconSymbol(
            name = icon,
            size = iconSize,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
            modifier = Modifier.testTag(testID?.let { "$it-icon" } ?: "stat-row-icon"),
        )

        // Value text with onSurface.default color and body.md typography (14sp)
        Text(
            text = value,
            style = theme.type.body.md,
            color = theme.colors.onSurface.default,
            modifier = Modifier.testTag(testID?.let { "$it-value" } ?: "stat-row-value"),
        )
    }
}
