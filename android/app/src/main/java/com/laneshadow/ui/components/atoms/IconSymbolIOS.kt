package com.laneshadow.ui.components.atoms

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.Icon
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
 * IconSymbol-iOS - Icon wrapper component
 *
 * Android implementation of the IconSymbol-iOS component.
 * On Android, this renders Material Design icons since we don't have SF Symbols.
 *
 * This component accepts a Material icon name and maps it to the appropriate
 * ImageVector from the Material Icons library.
 *
 * Following the translation matrix from:
 * .spec/prds/native-rewrite/matrices/ui/atoms/IconSymbol-iOS.md
 *
 * @param name Icon name (Material icon identifier, e.g., "star", "check", "close")
 * @param size Icon size in density-independent pixels (default: 24.dp per matrix)
 * @param color Icon tint color (required per RN wrapper)
 * @param modifier Modifier for the icon
 * @param testID Test ID for UI testing
 */
@Composable
fun IconSymbolIOS(
    name: String,
    size: Dp = 24.dp,
    color: Color,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    // Map icon name to Material Design icon
    val imageVector: ImageVector = mapNameToMaterialIcon(name)

    // Build semantics with proper accessibility role and content description
    val baseModifier = modifier.semantics {
        role = Role.Image
        contentDescription = name
    }

    // Add testTag if testID is provided
    val finalModifier = if (testID != null) {
        baseModifier.testTag(testID)
    } else {
        baseModifier
    }

    Icon(
        imageVector = imageVector,
        contentDescription = name,
        tint = color,
        modifier = finalModifier,
    )
}

/**
 * Maps icon names to Material Design icons
 *
 * This is a simple mapping that covers common icon names.
 * For a production app, you would expand this mapping or use a more
 * sophisticated approach like parsing icon names or using a lookup table.
 */
private fun mapNameToMaterialIcon(name: String): ImageVector {
    return when (name.lowercase()) {
        // Common action icons
        "check", "checkmark", "done" -> Icons.Filled.Check
        "close", "x", "cancel" -> Icons.Filled.Close
        "add", "plus" -> Icons.Filled.Add
        "delete", "trash" -> Icons.Filled.Delete
        "edit", "pencil" -> Icons.Filled.Edit
        "refresh", "reload" -> Icons.Filled.Refresh
        "search", "find" -> Icons.Filled.Search
        "settings", "gear" -> Icons.Filled.Settings
        "home", "house" -> Icons.Filled.Home
        "menu", "hamburger" -> Icons.Filled.Menu
        "more", "ellipsis" -> Icons.Filled.MoreVert
        "info", "information" -> Icons.Filled.Info
        "send" -> Icons.Filled.Send

        // Navigation icons
        "arrow-back", "back" -> Icons.AutoMirrored.Filled.ArrowBack
        "arrow-up", "up", "arrow-upward" -> Icons.AutoMirrored.Filled.KeyboardArrowRight
        "arrow-down", "down", "arrow-downward" -> Icons.AutoMirrored.Filled.List
        "chevron-left" -> Icons.AutoMirrored.Filled.KeyboardArrowLeft
        "chevron-right" -> Icons.AutoMirrored.Filled.KeyboardArrowRight
        "chevron-up" -> Icons.AutoMirrored.Filled.KeyboardArrowLeft
        "chevron-down" -> Icons.AutoMirrored.Filled.KeyboardArrowRight

        // Feedback icons
        "star", "favorite", "heart", "like" -> Icons.Filled.Star
        "thumb-up", "thumbs-up" -> Icons.Filled.ThumbUp

        // Communication icons
        "mail", "email", "message" -> Icons.Filled.Email
        "phone", "call" -> Icons.Filled.Call
        "share" -> Icons.Filled.Share

        // Media icons
        "play" -> Icons.Filled.PlayArrow

        // User icons
        "person", "user", "profile" -> Icons.Filled.Person
        "account", "avatar" -> Icons.Filled.AccountCircle

        // Security icons
        "lock", "locked" -> Icons.Filled.Lock

        // Location icons
        "location", "map", "pin", "place" -> Icons.Filled.Place
        "navigation", "directions" -> Icons.Filled.LocationOn

        // Time icons
        "calendar", "date", "date-range" -> Icons.Filled.DateRange

        // Status icons
        "check-circle", "success" -> Icons.Filled.CheckCircle

        // Default fallback
        else -> Icons.Filled.Star
    }
}
