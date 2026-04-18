package com.laneshadow.ui.atoms

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.foundation.layout.size
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun IconSymbol(
    name: String,
    modifier: Modifier = Modifier,
    size: Dp = 24.dp,
    color: Color? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Icon(
        imageVector = iconVectorForName(name),
        contentDescription = name,
        modifier = modifier.size(size),
        tint = color ?: theme.colors.onSurface.default,
    )
}

internal fun iconVectorForName(name: String): ImageVector =
    when (name) {
        "search", "magnify" -> Icons.Filled.Search
        "close", "x", "minus-circle" -> Icons.Filled.Close
        "location", "map-marker", "map-marker-radius", "map-marker-path" -> Icons.Filled.Place
        "check", "check-circle" -> Icons.Filled.CheckCircle
        "plus", "plus-circle" -> Icons.Filled.Add
        "minus" -> Icons.Filled.Close
        "home" -> Icons.Filled.Home
        "heart", "favorite" -> Icons.Filled.Favorite
        "settings", "cog" -> Icons.Filled.Settings
        "arrow-left", "chevron-left" -> Icons.AutoMirrored.Filled.ArrowBack
        "arrow-right", "chevron-right" -> Icons.AutoMirrored.Filled.ArrowForward
        "arrow-up", "chevron-up" -> Icons.Filled.KeyboardArrowUp
        "arrow-down", "chevron-down" -> Icons.Filled.KeyboardArrowDown
        "menu" -> Icons.Filled.Menu
        "dots-horizontal" -> Icons.Filled.MoreVert
        "dots-vertical" -> Icons.Filled.MoreVert
        "warning", "alert-circle" -> Icons.Filled.Warning
        "info" -> Icons.Filled.Info
        "drag-handle" -> Icons.Filled.KeyboardArrowUp
        "sheet-handle" -> Icons.Filled.KeyboardArrowDown
        else -> Icons.Filled.Check
    }
