package com.laneshadow.ui.organisms

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSScrim
import com.laneshadow.ui.molecules.BottomSheetDetent
import com.laneshadow.ui.molecules.LSBottomSheet

/**
 * LSMapLayer organism — map-primary canvas with overlay slots.
 *
 * Z-order bottom-to-top: map → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar
 *
 * @param map The map atom (required)
 * @param scrim Optional scrim specification
 * @param topOverlays Top-aligned overlays (NavigatorMessage, greeting, etc.)
 * @param bottomOverlays Bottom-aligned overlays (ChatInput, etc.)
 * @param leadingDrawer Left-anchored drawer (SessionsDrawer)
 * @param bottomSheet Bottom-anchored sheet (RouteSheet)
 * @param topBar Optional top chrome
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSMapLayer(
    map: @Composable () -> Unit,
    scrim: ScrimSpec? = null,
    topOverlays: List<GlassOverlaySlot> = emptyList(),
    bottomOverlays: List<GlassOverlaySlot> = emptyList(),
    leadingDrawer: DrawerSpec? = null,
    bottomSheet: BottomSheetSpec? = null,
    topBar: (@Composable () -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier.fillMaxSize(),
    ) {
        // Z-index 0: Map (base layer)
        map()

        // Z-index 1: Scrim (above map, below overlays)
        scrim?.let { spec ->
            LSScrim(
                opacity = spec.opacity,
                blocking = leadingDrawer != null,
                onTap = leadingDrawer?.onDismiss,
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("LSScrim"),
            )
        }

        // Z-index 2: Top overlays (NavigatorMessage, greeting, etc.)
        topOverlays.forEach { slot ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("GlassOverlaySlot:${slot.id}"),
                contentAlignment = Alignment.TopCenter,
            ) {
                Box(
                    modifier = Modifier
                        .statusBarsPadding()
                ) {
                    slot.content()
                }
            }
        }

        // Z-index 2: Bottom overlays (ChatInput, etc.)
        bottomOverlays.forEach { slot ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("GlassOverlaySlot:${slot.id}"),
                contentAlignment = Alignment.BottomCenter,
            ) {
                Box(
                    modifier = Modifier
                        .navigationBarsPadding()
                ) {
                    slot.content()
                }
            }
        }

        // Z-index 3: Bottom sheet (RouteSheet)
        bottomSheet?.let { spec ->
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.BottomCenter,
            ) {
                LSBottomSheet(
                    detent = when (spec.detent) {
                        SheetDetent.Small -> BottomSheetDetent.Small
                        SheetDetent.Medium -> BottomSheetDetent.Medium
                        SheetDetent.Large -> BottomSheetDetent.Large
                    },
                    onDismiss = spec.onDismiss,
                ) {
                    spec.content()
                }
            }
        }

        // Z-index 4: Leading drawer (SessionsDrawer)
        // AC-3: Drawer slide uses spring(dampingRatio = 0.85f, stiffness = StiffnessMedium)
        leadingDrawer?.let { spec ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("LeadingDrawerSlot"),
                contentAlignment = Alignment.CenterStart,
            ) {
                androidx.compose.animation.AnimatedVisibility(
                    visible = true,
                    enter = slideInHorizontally(
                        initialOffsetX = { -it },
                        animationSpec = spring(
                            dampingRatio = 0.85f,
                            stiffness = androidx.compose.animation.core.Spring.StiffnessMedium,
                        ),
                    ),
                    exit = slideOutHorizontally(
                        targetOffsetX = { -it },
                        animationSpec = spring(
                            dampingRatio = 0.85f,
                            stiffness = androidx.compose.animation.core.Spring.StiffnessMedium,
                        ),
                    ),
                ) {
                    spec.content()
                }
            }
        }

        // Z-index 5: Top bar (always topmost)
        topBar?.invoke()
    }
}
