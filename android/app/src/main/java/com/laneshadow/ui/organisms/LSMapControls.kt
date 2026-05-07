package com.laneshadow.ui.organisms

import android.os.Build
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon

// Test tags
const val LSMAPCONTROLS_TAG = "ls-map-controls"
const val LSMAPCONTROLS_ZOOM_CLUSTER_TAG = "ls-map-controls-zoom-cluster"
const val LSMAPCONTROLS_ZOOM_IN_TAG = "ls-map-controls-zoom-in"
const val LSMAPCONTROLS_ZOOM_OUT_TAG = "ls-map-controls-zoom-out"
const val LSMAPCONTROLS_RECENTER_TAG = "ls-map-controls-recenter"
const val LSMAPCONTROLS_LAYERS_TAG = "ls-map-controls-layers"
const val LSMAPCONTROLS_SAVE_TAG = "ls-map-controls-save"
const val LSMAPCONTROLS_TOGGLE_TAG = "ls-map-controls-toggle"

/**
 * LSMapControls organism - right-side vertical workbar for map controls.
 *
 * Renders a floating glass-morphic workbar on the right edge of the map with:
 * - Zoom in/out cluster (2 buttons + divider, conditional)
 * - Recenter chip (conditional)
 * - Layers chip (conditional)
 * - Save chip (conditional, copper when saved)
 * - Mode-toggle chip (always at bottom)
 *
 * All handlers are nullable. When a handler is null, the corresponding chip is omitted.
 * Mode-toggle ALWAYS lives at the bottom of the workbar in both modes.
 *
 * @param mode Which mode to render (Map or Chat)
 * @param handlers All 6 handlers (nullable)
 * @param hasRouteToSave Whether a route is available to save (controls save chip visibility)
 * @param isSavedRoute Whether the route is currently saved (controls save chip styling to copper)
 * @param modifier Optional modifier
 */
@Composable
fun LSMapControls(
    mode: MapControlsMode = MapControlsMode.Map,
    handlers: MapControlsHandlers = MapControlsHandlers(),
    hasRouteToSave: Boolean = false,
    isSavedRoute: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val chipSize = 40.dp
    val chipRadius = theme.radius.md
    val blurRadius = 8.dp
    val density = LocalDensity.current

    // Compute blur strategy based on SDK version
    val blurStrategy = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        "RenderEffect"
    } else {
        "ModifierBlur"
    }

    Column(
        modifier = modifier
            .semantics { contentDescription = "Map controls workbar" },
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(theme.space.sm, Alignment.Bottom),
    ) {
        // Render different chip sets based on mode
        when (mode) {
            MapControlsMode.Map -> {
                // Zoom cluster (zoom in + divider + zoom out)
                if (handlers.onZoomIn != null || handlers.onZoomOut != null) {
                    MapControlChip(
                        modifier = Modifier
                            .size(chipSize, 88.dp)
                            .semantics { contentDescription = "Zoom controls" },
                        tag = LSMAPCONTROLS_ZOOM_CLUSTER_TAG,
                        blurRadius = blurRadius,
                        blurStrategy = blurStrategy,
                    ) {
                        Column(
                            modifier = Modifier.size(chipSize, 88.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                        ) {
                            // Zoom in button
                            if (handlers.onZoomIn != null) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clickable { handlers.onZoomIn.invoke() }
                                        .semantics { contentDescription = "Zoom in" },
                                    contentAlignment = Alignment.Center,
                                ) {
                                    LSIcon(
                                        name = IconName.Plus,
                                        size = IconSize.Md,
                                        color = IconColor.Content(
                                            com.laneshadow.ui.atoms.ContentColor.Primary
                                        ),
                                    )
                                }
                            }

                            // Divider
                            Box(
                                modifier = Modifier
                                    .width(24.dp)
                                    .height(1.dp)
                                    .background(theme.colors.border.default),
                            )

                            // Zoom out button with custom minus icon
                            if (handlers.onZoomOut != null) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clickable { handlers.onZoomOut.invoke() }
                                        .semantics { contentDescription = "Zoom out" },
                                    contentAlignment = Alignment.Center,
                                ) {
                                    MinusIcon(
                                        color = theme.colors.onSurface.default,
                                        strokeWidth = theme.icon.stroke.width,
                                    )
                                }
                            }
                        }
                    }
                }

                // Recenter chip
                if (handlers.onRecenter != null) {
                    MapControlChip(
                        modifier = Modifier
                            .size(chipSize)
                            .clickable { handlers.onRecenter.invoke() }
                            .semantics { contentDescription = "Recenter map" },
                        tag = LSMAPCONTROLS_RECENTER_TAG,
                        blurRadius = blurRadius,
                        blurStrategy = blurStrategy,
                    ) {
                        LSIcon(
                            name = IconName.Compass,
                            size = IconSize.Md,
                            color = IconColor.Content(
                                com.laneshadow.ui.atoms.ContentColor.Primary
                            ),
                        )
                    }
                }

                // Layers chip
                if (handlers.onClear != null) {
                    MapControlChip(
                        modifier = Modifier
                            .size(chipSize)
                            .clickable { handlers.onClear.invoke() }
                            .semantics { contentDescription = "Reset map state" },
                        tag = LSMAPCONTROLS_LAYERS_TAG,
                        blurRadius = blurRadius,
                        blurStrategy = blurStrategy,
                    ) {
                        LSIcon(
                            name = IconName.Layers,
                            size = IconSize.Md,
                            color = IconColor.Content(
                                com.laneshadow.ui.atoms.ContentColor.Primary
                            ),
                        )
                    }
                }

                // Save chip (conditional on hasRouteToSave and onSaveRoute)
                if (hasRouteToSave && handlers.onSaveRoute != null) {
                    val isSaved = isSavedRoute
                    val backgroundColor = if (isSaved) {
                        theme.colors.accent.default  // copper signal color for saved state
                    } else {
                        theme.colors.surfaceVariant.default
                    }
                    val borderColor = if (isSaved) {
                        theme.colors.accent.default  // copper signal color for saved state
                    } else {
                        theme.colors.border.default
                    }
                    val iconColor = if (isSaved) {
                        com.laneshadow.ui.atoms.ContentColor.OnSignal
                    } else {
                        com.laneshadow.ui.atoms.ContentColor.Primary
                    }

                    MapControlChip(
                        modifier = Modifier
                            .size(chipSize)
                            .clickable { handlers.onSaveRoute.invoke() }
                            .semantics {
                                contentDescription = if (isSaved) "Saved route" else "Save route"
                            },
                        tag = LSMAPCONTROLS_SAVE_TAG,
                        blurRadius = blurRadius,
                        blurStrategy = blurStrategy,
                        backgroundColor = backgroundColor,
                        borderColor = borderColor,
                    ) {
                        LSIcon(
                            name = if (isSaved) IconName.BookmarkFill else IconName.Bookmark,
                            size = IconSize.Md,
                            color = IconColor.Content(iconColor),
                        )
                    }
                }
            }

            MapControlsMode.Chat -> {
                // Chat mode: only show the map toggle at the bottom
            }
        }

        // Mode-toggle chip (always at bottom in both modes)
        if (handlers.onToggleView != null) {
            MapControlChip(
                modifier = Modifier
                    .size(chipSize)
                    .clickable { handlers.onToggleView.invoke() }
                    .semantics {
                        contentDescription = when (mode) {
                            MapControlsMode.Map -> "Open chat"
                            MapControlsMode.Chat -> "Back to map"
                        }
                    },
                tag = LSMAPCONTROLS_TOGGLE_TAG,
                blurRadius = blurRadius,
                blurStrategy = blurStrategy,
            ) {
                LSIcon(
                    name = when (mode) {
                        MapControlsMode.Map -> IconName.Send
                        MapControlsMode.Chat -> IconName.Map
                    },
                    size = IconSize.Md,
                    color = IconColor.Content(
                        com.laneshadow.ui.atoms.ContentColor.Primary
                    ),
                )
            }
        }
    }
}

/**
 * Reusable chip component for map controls.
 *
 * 40x40dp glass chip with configurable background/border colors,
 * 8dp blur, and theme-driven elevation.
 */
@Composable
private fun MapControlChip(
    modifier: Modifier = Modifier,
    tag: String = "",
    blurRadius: Dp = 8.dp,
    blurStrategy: String = "ModifierBlur",
    backgroundColor: Color? = null,
    borderColor: Color? = null,
    content: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val chipRadius = theme.radius.md
    val shape = RoundedCornerShape(chipRadius)
    val density = LocalDensity.current
    val bgColor = backgroundColor ?: theme.colors.surfaceVariant.default
    val bColor = borderColor ?: theme.colors.border.default

    // Apply blur based on SDK version
    val blurModifier = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Modifier.graphicsLayer {
            val blurRadiusPx = with(density) { blurRadius.toPx() }
            renderEffect = BlurEffect(
                radiusX = blurRadiusPx,
                radiusY = blurRadiusPx,
                edgeTreatment = TileMode.Decal,
            )
        }
    } else {
        Modifier.blur(blurRadius)
    }

    Box(
        modifier = modifier
            .clip(shape)
            .then(blurModifier)
            .background(color = bgColor.copy(alpha = 0.92f), shape = shape)
            .border(width = LaneShadowTheme.sizing.stroke.sm, color = bColor, shape = shape)
            .shadow(elevation = theme.elevation.light.level3, shape = shape)
            .then(if (tag.isNotEmpty()) Modifier.testTag(tag) else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        content()
    }
}

/**
 * Custom minus icon (horizontal line) for zoom-out control.
 * Drawn inline with Canvas since Minus is not in the icon catalog.
 */
@Composable
private fun MinusIcon(
    color: Color,
    strokeWidth: Dp,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier.size(18.dp)) {
        val strokePx = strokeWidth.toPx()
        drawLine(
            color = color,
            start = Offset(2f, size.height / 2),
            end = Offset(size.width - 2f, size.height / 2),
            strokeWidth = strokePx,
            cap = StrokeCap.Round,
        )
    }
}
