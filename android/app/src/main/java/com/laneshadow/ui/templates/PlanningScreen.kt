package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.PlanningScreenState
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.LSPhaseIndicator
import com.laneshadow.ui.molecules.PlanningPhase
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar

/**
 * PlanningScreen template — continuous sketching polyline + phase indicator + thinking chat.
 *
 * Renders the Navigator PlanningScreen with map, sketching polyline animation,
 * phase indicator with pulsing active step, top bar, and disabled chat input
 * showing the rider's prompt with spinner in trailing slot.
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
}

