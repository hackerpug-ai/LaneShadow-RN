package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

enum class MapControlsMode {
    MAP,
    CHAT,
}

@Composable
fun MapControls(
    mode: MapControlsMode = MapControlsMode.MAP,
    onZoomIn: (() -> Unit)? = null,
    onZoomOut: (() -> Unit)? = null,
    onRecenter: (() -> Unit)? = null,
    onClear: (() -> Unit)? = null,
    onToggleView: (() -> Unit)? = null,
    onSaveRoute: (() -> Unit)? = null,
    hasRouteToSave: Boolean = false,
    isSavedRoute: Boolean = false,
    showLabels: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier.testTag("map-controls"),
    ) {
        Column(
            modifier = Modifier.testTag("map-controls-column"),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            if (mode == MapControlsMode.MAP) {
                ZoomCluster(
                    onZoomIn = onZoomIn,
                    onZoomOut = onZoomOut,
                    showLabels = showLabels,
                    theme = theme,
                )

                if (onRecenter != null) {
                    ControlButton(
                        icon = Glyphs.Filled.Star,
                        label = if (showLabels) "Recenter" else null,
                        onPress = onRecenter,
                        theme = theme,
                        testTag = "control-recenter",
                        accessibilityLabel = "Recenter map",
                    )
                }

                if (onClear != null) {
                    ControlButton(
                        icon = Glyphs.Filled.Clear,
                        label = if (showLabels) "Layers" else null,
                        onPress = onClear,
                        theme = theme,
                        testTag = "control-clear",
                        accessibilityLabel = "Reset map state",
                    )
                }

                if (hasRouteToSave && onSaveRoute != null) {
                    ControlButton(
                        icon = Glyphs.Filled.Favorite,
                        label = if (showLabels) "Save" else null,
                        onPress = onSaveRoute,
                        theme = theme,
                        testTag = "control-save-route",
                        accessibilityLabel = "Save route",
                        accent = isSavedRoute,
                    )
                }
            }

            if (onToggleView != null) {
                val toggleIcon: ImageVector
                val toggleLabel: String?
                val toggleA11y: String

                when (mode) {
                    MapControlsMode.MAP -> {
                        toggleIcon = Glyphs.Filled.Email
                        toggleLabel = if (showLabels) "Chat" else null
                        toggleA11y = "Open chat"
                    }
                    MapControlsMode.CHAT -> {
                        toggleIcon = Glyphs.Filled.Check
                        toggleLabel = if (showLabels) "Map" else null
                        toggleA11y = "Back to map"
                    }
                }

                ControlButton(
                    icon = toggleIcon,
                    label = toggleLabel,
                    onPress = onToggleView,
                    theme = theme,
                    testTag = "control-toggle-view",
                    accessibilityLabel = toggleA11y,
                )
            }
        }
    }
}

@Composable
private fun ZoomCluster(
    onZoomIn: (() -> Unit)?,
    onZoomOut: (() -> Unit)?,
    showLabels: Boolean,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
) {
    val clusterShape = RoundedCornerShape(theme.radius.xxl)
    val borderColor = theme.colors.border.default
    val backgroundColor = theme.colors.surfaceVariant.default

    Box(
        modifier = Modifier
            .testTag("zoom-cluster")
            .background(backgroundColor, clusterShape)
            .border(BorderStroke(1.5.dp, borderColor), clusterShape)
            .shadow(theme.elevation.light.level3, clusterShape),
    ) {
        Column(
            modifier = Modifier.padding(theme.space.xs),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(0.dp),
        ) {
            ControlButton(
                icon = Glyphs.Filled.Add,
                label = if (showLabels) "Zoom" else null,
                onPress = onZoomIn ?: {},
                theme = theme,
                testTag = "control-zoom-in",
                accessibilityLabel = "Zoom in",
                showBorder = false,
                showElevation = false,
            )

            Spacer(
                modifier = Modifier
                    .height(1.dp)
                    .width(theme.space.xxxl)
                    .background(borderColor)
                    .testTag("zoom-divider"),
            )

            ControlButton(
                icon = Glyphs.Filled.Clear,
                label = if (showLabels) "Zoom" else null,
                onPress = onZoomOut ?: {},
                theme = theme,
                testTag = "control-zoom-out",
                accessibilityLabel = "Zoom out",
                showBorder = false,
                showElevation = false,
            )
        }
    }
}

@Composable
private fun ControlButton(
    icon: ImageVector,
    label: String?,
    onPress: () -> Unit,
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    testTag: String,
    accessibilityLabel: String,
    accent: Boolean = false,
    showBorder: Boolean = true,
    showElevation: Boolean = true,
) {
    val buttonShape = RoundedCornerShape(theme.radius.xxl)

    val backgroundColor = theme.colors.let {
        if (accent) it.primary.default else it.surfaceVariant.default
    }
    val iconColor = theme.colors.let {
        if (accent) it.onPrimary.default else it.onSurface.default
    }
    val borderColor = theme.colors.let {
        if (accent) it.primary.default else it.border.default
    }

    val buttonSize = if (label == null) theme.space.xxxl else Dp.Unspecified

    Box(
        modifier = Modifier
            .testTag(testTag)
            .semantics { contentDescription = accessibilityLabel }
            .clickable(onClick = onPress)
            .then(if (label == null) Modifier.size(buttonSize) else Modifier)
            .background(backgroundColor, buttonShape)
            .then(if (showBorder) Modifier.border(BorderStroke(1.5.dp, borderColor), buttonShape) else Modifier)
            .then(if (showElevation) Modifier.shadow(theme.elevation.light.level3, buttonShape) else Modifier)
            .padding(
                horizontal = if (label != null) theme.space.sm else theme.space.xs,
                vertical = theme.space.xs,
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (label != null) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(20.dp),
                )
                Text(
                    text = label,
                    style = theme.type.body.sm,
                    color = iconColor,
                )
            }
        } else {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}
