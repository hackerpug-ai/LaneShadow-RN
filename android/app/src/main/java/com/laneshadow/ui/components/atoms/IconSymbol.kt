package com.laneshadow.ui.components.atoms

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Icon name to Material Design icon mapping
 *
 * Maps common MaterialCommunityIcons glyph names to their Material Icons equivalents.
 * Fallback to Icons.Default.Info for unmapped names (no Help icon available).
 */
private fun iconByName(name: String): ImageVector = when (name.lowercase()) {
    "home" -> Icons.Default.Home
    "settings" -> Icons.Default.Settings
    "search" -> Icons.Default.Search
    "heart" -> Icons.Default.Favorite
    "star" -> Icons.Default.Star
    "map" -> Icons.Default.Info // Fallback: no Map icon in default set
    "person" -> Icons.Default.Person
    "close" -> Icons.Default.Close
    "menu" -> Icons.Default.Menu
    "arrow-left" -> Icons.Default.ArrowBack
    else -> Icons.Default.Info // Fallback: no Help icon in default set
}

/**
 * IconSymbol component
 *
 * Cross-platform icon component. On Android, this renders Material Design icons.
 * Following RN wrapper API from react-native/components/ui/icon-symbol.tsx
 *
 * @param name Icon name (MaterialCommunityIcons glyph name)
 * @param size Icon size in dp (default: 24.dp)
 * @param color Icon tint color (required)
 * @param modifier Modifier for the icon
 * @param testID Test ID for UI testing (optional)
 */
@Composable
fun IconSymbol(
    name: String,
    size: Dp = 24.dp,
    color: Color,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val iconVector = iconByName(name)

    val baseModifier = modifier
        .semantics {
            role = Role.Image
            contentDescription = name
        }

    val finalModifier = if (testID != null) {
        baseModifier.testTag(testID)
    } else {
        baseModifier
    }

    Icon(
        imageVector = iconVector,
        contentDescription = name,
        modifier = finalModifier,
        tint = color,
    )
}
