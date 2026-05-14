package com.laneshadow.ui.templates

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.PlanningScreenState
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.MapSketchAnimationLayer
import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.planning.PlanningCancelConfirmSheet
import com.laneshadow.ui.molecules.LSContextCapsule
import com.laneshadow.ui.molecules.LSPhaseIndicator
import com.laneshadow.ui.molecules.PlanningPhase
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSMapControls
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.MapControlsHandlers
import com.laneshadow.ui.organisms.MapControlsMode

/**
 * Data class representing a sketch polyline animation recipe based on motion tokens.
 *
 * Used by MapSketchAnimationLayer to drive the animated sketch polyline.
 * Reads from `LaneShadowTheme.motion.recipe.sketchPolylineLoop` which specifies:
 * - duration: motion.duration.verySlow (1400ms)
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
 * - motion.duration["verySlow"] (1400ms)
 * - motion.easing["linear"]
 *
 * Fails hard if tokens are unavailable (no fallback to hardcoded values).
 * Shared by PlanningScreen and MapSketchAnimationLayer.
 */
internal fun sketchPolylineRecipe(theme: LaneShadowThemeValues): SketchPolylineRecipe {
    // Must use verySlow (1400ms) for sketch polyline loop animation
    val duration = requireNotNull(theme.motion.duration["verySlow"]) {
        "LaneShadowTheme is missing motion.duration[\"verySlow\"] for sketch polyline loop (1400ms)"
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
 * PlanningScreen template — persistent map host with planning overlay composition.
 *
 * Renders the planning state of the canonical map view with:
 * - Persistent LSMapHost (same instance across idle → planning transitions)
 * - Top overlay with LSContextCapsule(--planning) above LSPhaseIndicator
 * - LSMapControls configured for planning state
 * - Bottom overlay with disabled LSChatInput (input locked by T04)
 *
 * The sketching polyline animation is driven by `motion.recipe.sketchPolylineLoop`
 * which continuously animates the path-draw progress from 0 to 1 in an infinite loop.
 *
 * CRITICAL: LSMapHost must NOT be remounted between idle and planning states — only
 * the overlay composition and map source configuration change.
 *
 * @param state UiState from PlanningViewModel (PLAN-S08-AND-T01)
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onCollapse Callback when collapse button is tapped (requestCancel)
 * @param onFilter Callback when filter button is tapped
 * @param onDismissCancelConfirm Callback when cancel confirm dialog is dismissed
 * @param onKeepPlanning Callback when "Keep thinking" is tapped
 * @param onCancelPlan Callback when "Cancel plan" is tapped (confirmCancel)
 * @param modifier Modifier for the root composable
 */
@Composable
fun PlanningScreen(
    state: PlanningScreenState,
    onMenuTap: () -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onDismissCancelConfirm: () -> Unit = {},
    onKeepPlanning: () -> Unit = {},
    onCancelPlan: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Compute camera center from sketch route, or default to equator/prime meridian
    // if no route is available yet (should not happen in production)
    val cameraCenter = state.sketchRoute?.firstOrNull() ?: LatLng(0.0, 0.0)

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = cameraCenter,
                    zoom = 11.0,
                ),
                modifier = Modifier.testTag("planning.map-host-instance"),
            )
            // MapSketchAnimationLayer: overlay composable for animated sketch polyline
            // Driven by state.sketchRoute; animates path-draw progress from 0→1 (1400ms loop)
            if (state.sketchRoute != null) {
                MapSketchAnimationLayer(
                    path = state.sketchRoute,
                    modifier = Modifier.testTag("planning.sketch-animation-layer"),
                )
            }
        },
        topOverlays = listOf(
            GlassOverlaySlot(
                id = "org-map-layer__top-overlay",
                content = {
                    // AC-1 & AC-2: Capsule above indicator composition
                    // Both molecules visible simultaneously per 2026-05-07 layout decision
                    Box(
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        Column(
                            modifier = Modifier.align(Alignment.TopCenter),
                            verticalArrangement = Arrangement.spacedBy(theme.space.md),
                        ) {
                            // AC-1: LSContextCapsule in planning state with capsule headline
                            LSContextCapsule(
                                state = CapsuleState.Planning(
                                    headline = state.capsuleHeadline,
                                ),
                                modifier = Modifier.testTag("planning.context-capsule"),
                            )

                            // AC-2: LSPhaseIndicator directly below capsule
                            LSPhaseIndicator(
                                phases = state.phaseSteps.map { step ->
                                    PlanningPhase(
                                        label = step.label,
                                        state = step.state,
                                    )
                                },
                                header = state.headerLabel,
                                modifier = Modifier.testTag("planning.phase-indicator"),
                            )
                        }
                    }
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
            Box(
                modifier = Modifier.fillMaxSize(),
            ) {
                Box(
                    modifier = Modifier.align(Alignment.CenterEnd),
                ) {
                    // AC-4: LSMapControls in planning configuration
                    LSMapControls(
                        mode = MapControlsMode.Map,
                        handlers = MapControlsHandlers(
                            onZoomIn = { /* Handled by map controller */ },
                            onZoomOut = { /* Handled by map controller */ },
                            onRecenter = { /* Recenter remains active */ },
                        ),
                        modifier = Modifier.testTag("planning.map-controls"),
                    )
                }
                LSTopBar(
                    onMenuTap = onMenuTap,
                    modifier = Modifier.testTag("ls-topbar"),
                )
            }
        },
        modifier = modifier.fillMaxSize(),
    )

    // V02: cancel-confirm sheet (planning-specific wrapper with testTags for cross-platform parity)
    if (state.showCancelConfirm) {
        PlanningCancelConfirmSheet(
            onKeep = onKeepPlanning,
            onCancel = onCancelPlan,
            onDismiss = onDismissCancelConfirm,
        )
    }
}

