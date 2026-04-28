package com.laneshadow.ui.templates

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.PlanningScreenState
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.LSCancelConfirmSheet
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.LSPhaseIndicator
import com.laneshadow.ui.molecules.PlanningPhase
import com.laneshadow.theme.LSMotion
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar

/**
 * Data class representing a sketch polyline animation recipe based on motion tokens.
 *
 * Reads from `LaneShadowTheme.motion.recipe.sketchPolylineLoop` which specifies:
 * - duration: motion.duration.deliberate (600ms)
 * - easing: motion.easing.linear
 * - iteration: loop
 */
internal data class SketchPolylineRecipe(
    val name: String,
    val durationMillis: Int,
    val easing: Easing,
)

/**
 * Build a SketchPolylineRecipe from theme motion tokens.
 *
 * References `motion.recipe.sketchPolylineLoop` which uses:
 * - motion.duration["deliberate"] (600ms)
 * - motion.easing["linear"]
 *
 * Fails hard if tokens are unavailable (no fallback to hardcoded values).
 */
internal fun sketchPolylineRecipe(theme: LaneShadowThemeValues): SketchPolylineRecipe {
    // Must use deliberate (600ms) for sketch polyline loop animation
    val duration = requireNotNull(theme.motion.duration["deliberate"]) {
        "LaneShadowTheme is missing motion.duration[\"deliberate\"] for sketch polyline loop (600ms)"
    }

    // Must use linear easing
    val easingPoints = requireNotNull(theme.motion.easing["linear"]) {
        "LaneShadowTheme is missing motion.easing[\"linear\"] for sketch polyline"
    }

    require(easingPoints.size == 4) {
        "LaneShadowTheme easing[\"linear\"] must expose four cubic bezier points"
    }

    return SketchPolylineRecipe(
        name = "motion.recipe.sketchPolylineLoop",
        durationMillis = duration.toInt(),
        easing = CubicBezierEasing(
            easingPoints[0].toFloat(),
            easingPoints[1].toFloat(),
            easingPoints[2].toFloat(),
            easingPoints[3].toFloat(),
        ),
    )
}

/**
 * PlanningScreen template — continuous sketching polyline + phase indicator + thinking chat.
 *
 * Renders the Navigator PlanningScreen with map, sketching polyline animation,
 * phase indicator with pulsing active step, top bar, and disabled chat input
 * showing the rider's prompt with spinner in trailing slot.
 *
 * The sketching polyline animation is driven by `motion.recipe.sketchPolylineLoop`
 * which continuously animates the path-draw progress from 0 to 1 in an infinite loop.
 *
 * Driven entirely by mock data from PlanningMockProvider — no live data fetching.
 *
 * @param state Screen state from PlanningMockProvider
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onCollapse Callback when collapse button is tapped
 * @param onFilter Callback when filter button is tapped
 * @param modifier Modifier for the root composable
 */
@Composable
fun PlanningScreen(
    state: PlanningScreenState,
    onMenuTap: () -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val sketchRecipe = sketchPolylineRecipe(theme)

    // Animate polyline path-draw progress using LSMotion helper
    val infiniteTransition = rememberInfiniteTransition(label = "sketch_polyline_loop")
    val pathProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = LSMotion.sketchPolylineLoop(
            durationMillis = sketchRecipe.durationMillis,
            easing = sketchRecipe.easing
        ),
        label = "sketch_polyline_progress",
    )

    // Create a sample sketching polyline (for demonstration)
    // In production, this would come from the route data
    val sketchingPolyline = PolylineData(
        coordinates = listOf(
            LatLng(37.8104, -122.4752),
            LatLng(37.8120, -122.4760),
            LatLng(37.8150, -122.4800),
            LatLng(37.8180, -122.4850),
        ),
        variant = RouteVariant.Best,
        drawProgress = pathProgress,
    )

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 11.0,
                ),
                polylines = listOf(sketchingPolyline),
            )
        },
        topOverlays = listOf(
            GlassOverlaySlot(
                id = "phase-indicator",
                content = {
                    LSPhaseIndicator(
                        phases = state.phases.map { phase ->
                            PlanningPhase(
                                label = phase.label,
                                state = when (phase.status) {
                                    "pending" -> PhaseDotState.Pending
                                    "active" -> PhaseDotState.Active
                                    "done" -> PhaseDotState.Done
                                    else -> PhaseDotState.Pending
                                }
                            )
                        },
                        modifier = Modifier.testTag("phase-indicator"),
                    )
                }
            )
        ),
        bottomOverlays = listOf(
            GlassOverlaySlot(
                id = "chat-input",
                content = {
                    LSChatInput(
                        value = state.message.body,
                        onValueChange = { /* No-op: input is disabled */ },
                        placeholder = "Awaiting response...",
                        onSend = { /* No-op: input is disabled */ },
                        onCollapse = onCollapse,
                        onFilter = onFilter,
                        isThinking = state.isThinking,
                        isEnabled = false,
                        modifier = Modifier.testTag("chat-input"),
                    )
                }
            )
        ),
        topBar = {
            LSTopBar(
                onMenuTap = onMenuTap,
                modifier = Modifier.testTag("ls-topbar"),
            )
        },
        modifier = modifier.fillMaxSize(),
    )

    // V02: cancel-confirm sheet
    if (state.showCancelConfirm) {
        LSCancelConfirmSheet(
            title = "Cancel this plan?",
            body = "I've drawn one route already. You can back out now — but I'll toss what I have.",
            keepLabel = "Keep thinking",
            cancelLabel = "Cancel plan",
            onKeep = { println("Keep thinking tapped") },
            onCancel = { println("Cancel plan tapped") },
            onDismiss = { println("Cancel confirm dismissed") },
        )
    }
}

