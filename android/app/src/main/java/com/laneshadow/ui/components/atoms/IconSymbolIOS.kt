package com.laneshadow.ui.components.atoms

import com.laneshadow.ui.atoms.Glyphs

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
        "check", "checkmark", "done" -> Glyphs.Filled.Check
        "close", "x", "cancel" -> Glyphs.Filled.Close
        "add", "plus" -> Glyphs.Filled.Add
        "delete", "trash" -> Glyphs.Filled.Delete
        "edit", "pencil" -> Glyphs.Filled.Edit
        "refresh", "reload" -> Glyphs.Filled.Refresh
        "search", "find" -> Glyphs.Filled.Search
        "settings", "gear" -> Glyphs.Filled.Settings
        "home", "house" -> Glyphs.Filled.Home
        "menu", "hamburger" -> Glyphs.Filled.Menu
        "more", "ellipsis" -> Glyphs.Filled.MoreVert
        "info", "information" -> Glyphs.Filled.Info
        "send" -> Glyphs.Filled.Send

        // Navigation icons
        "arrow-back", "back" -> Glyphs.AutoMirrored.Filled.ArrowBack
        "arrow-up", "up", "arrow-upward" -> Glyphs.AutoMirrored.Filled.KeyboardArrowRight
        "arrow-down", "down", "arrow-downward" -> Glyphs.AutoMirrored.Filled.List
        "chevron-left" -> Glyphs.AutoMirrored.Filled.KeyboardArrowLeft
        "chevron-right" -> Glyphs.AutoMirrored.Filled.KeyboardArrowRight
        "chevron-up" -> Glyphs.AutoMirrored.Filled.KeyboardArrowLeft
        "chevron-down" -> Glyphs.AutoMirrored.Filled.KeyboardArrowRight

        // Feedback icons
        "star", "favorite", "heart", "like" -> Glyphs.Filled.Star
        "thumb-up", "thumbs-up" -> Glyphs.Filled.ThumbUp

        // Communication icons
        "mail", "email", "message" -> Glyphs.Filled.Email
        "phone", "call" -> Glyphs.Filled.Call
        "share" -> Glyphs.Filled.Share

        // Media icons
        "play" -> Glyphs.Filled.PlayArrow

        // User icons
        "person", "user", "profile" -> Glyphs.Filled.Person
        "account", "avatar" -> Glyphs.Filled.AccountCircle

        // Security icons
        "lock", "locked" -> Glyphs.Filled.Lock

        // Location icons
        "location", "map", "pin", "place" -> Glyphs.Filled.Place
        "navigation", "directions" -> Glyphs.Filled.LocationOn

        // Time icons
        "calendar", "date", "date-range" -> Glyphs.Filled.DateRange

        // Status icons
        "check-circle", "success" -> Glyphs.Filled.CheckCircle

        // Default fallback
        else -> Glyphs.Filled.Star
    }
}
