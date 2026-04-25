package com.laneshadow.ui.organisms

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable

/**
 * Sealed interface for LSMapLayer slot specifications.
 * All slots are optional and compose in z-order:
 * map (0) → scrim (1) → overlays (2) → bottomSheet (3) → leadingDrawer (4) → topBar (5)
 */

/**
 * Glass overlay slot for top/bottom positioned content.
 * Used for NavigatorMessage, ChatInput, and other overlay components.
 */
@Stable
data class GlassOverlaySlot(
    val id: String,
    val content: @Composable () -> Unit,
)

/**
 * Scrim specification for rendering LSScrim above the map.
 */
@Stable
data class ScrimSpec(
    val opacity: Float = 0.35f,
)

/**
 * Drawer specification for the leading left-anchored drawer.
 */
@Stable
data class DrawerSpec(
    val content: @Composable () -> Unit,
    val onDismiss: () -> Unit,
)

/**
 * Bottom sheet specification for RouteSheet and other bottom-anchored content.
 */
@Stable
data class BottomSheetSpec(
    val content: @Composable () -> Unit,
    val detent: SheetDetent,
    val onDismiss: () -> Unit,
)

/**
 * Bottom sheet detent options.
 */
enum class SheetDetent {
    Small,
    Medium,
    Large,
}
