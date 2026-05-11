package com.laneshadow.ui.organisms

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Color
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
import java.util.UUID

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
 * - Recenter chip (conditional)
 * - Layers chip (conditional)
 * - Save chip (conditional, copper when saved)
 * - Mode-toggle chip (always bottom-most in chat mode)
 * - Zoom in/out cluster (2 buttons + divider, conditional, bottom-most in map mode)
 *
 * All handlers are nullable. When a handler is null, the corresponding chip is omitted.
 * In map mode the zoom cluster renders below the mode-toggle chip.
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
    val instanceId = remember { UUID.randomUUID().toString() }
    val zoomButtonSize = 48.dp
    val zoomClusterWidth = zoomButtonSize
    val zoomClusterHeight =
        (zoomButtonSize * 2) + (theme.space.xs * 2) + LaneShadowTheme.sizing.stroke.sm

    // Compute blur strategy based on SDK version
    val blurStrategy = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        "RenderEffect"
    } else {
        "ModifierBlur"
    }

    Column(
        modifier = modifier
            .semantics {
                contentDescription = "Map controls workbar"
                set(LSMapControlsInstanceIdKey, instanceId)
            },
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(theme.space.xs, Alignment.Bottom),
    ) {
        // Render different chip sets based on mode
        when (mode) {
            MapControlsMode.Map -> {
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
                        LaneShadowTheme.color.Signal.default
                    } else {
                        theme.colors.surfaceVariant.default
                    }
                    val borderColor = if (isSaved) {
                        LaneShadowTheme.color.Signal.default
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

        if (mode == MapControlsMode.Map && (handlers.onZoomIn != null || handlers.onZoomOut != null)) {
            MapControlChip(
                modifier = Modifier
                    .size(zoomClusterWidth, zoomClusterHeight)
                    .semantics { contentDescription = "Zoom controls" },
                tag = LSMAPCONTROLS_ZOOM_CLUSTER_TAG,
                blurRadius = blurRadius,
                blurStrategy = blurStrategy,
            ) {
                Column(
                    modifier = Modifier.size(zoomClusterWidth, zoomClusterHeight),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(
                        space = theme.space.xs,
                        alignment = Alignment.CenterVertically,
                    ),
                ) {
                    if (handlers.onZoomIn != null) {
                        ZoomControlButton(
                            tag = LSMAPCONTROLS_ZOOM_IN_TAG,
                            size = zoomButtonSize,
                            contentDescription = "Zoom in",
                            onClick = handlers.onZoomIn,
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

                    Box(
                        modifier = Modifier
                            .width(24.dp)
                            .height(LaneShadowTheme.sizing.stroke.sm)
                            .background(theme.colors.border.default),
                    )

                    if (handlers.onZoomOut != null) {
                        ZoomControlButton(
                            tag = LSMAPCONTROLS_ZOOM_OUT_TAG,
                            size = zoomButtonSize,
                            contentDescription = "Zoom out",
                            onClick = handlers.onZoomOut,
                        ) {
                            LSIcon(
                                name = IconName.Minus,
                                size = IconSize.Md,
                                color = IconColor.Content(
                                    com.laneshadow.ui.atoms.ContentColor.Primary
                                ),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ZoomControlButton(
    tag: String,
    size: Dp,
    contentDescription: String,
    onClick: () -> Unit,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = Modifier
            .minimumInteractiveComponentSize()
            .size(size)
            .testTag(tag)
            .clickable(onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        content()
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
            .minimumInteractiveComponentSize()
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

