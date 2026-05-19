package com.laneshadow.ui.mapapp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LSMapCameraController
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSMapControls
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.MapControlsHandlers
import com.laneshadow.ui.organisms.MapControlsMode
import com.laneshadow.ui.planning.IdleScreenOverlays
import com.laneshadow.ui.planning.PlanningScreenOverlays

internal data class MapControlsModel(
    val testTag: String,
    val mode: MapControlsMode,
    val handlers: MapControlsHandlers,
    val hasRouteToSave: Boolean = false,
    val isSavedRoute: Boolean = false,
)

internal fun planningMapControlsModel(
    onZoomIn: () -> Unit,
    onZoomOut: () -> Unit,
    onRecenter: () -> Unit,
    onClear: (() -> Unit)? = null,
    onToggleView: () -> Unit,
): MapControlsModel =
    MapControlsModel(
        testTag = "planning.map-controls",
        mode = MapControlsMode.Map,
        handlers = MapControlsHandlers(
            onZoomIn = onZoomIn,
            onZoomOut = onZoomOut,
            onRecenter = onRecenter,
            onClear = onClear,
            onToggleView = onToggleView,
        ),
    )

/**
 * MapApp composable — unified map host with state-driven overlay composition.
 *
 * CRITICAL DOCTRINE (Cycle 3):
 * One LSMapLayer + LSMap per MapApp instance, NEVER remounted.
 * State transitions (Idle ↔ Planning ↔ RouteResults) are overlay swaps only.
 *
 * The map persists across all state transitions. Only overlay content,
 * controls mode, and camera behavior change based on state.
 *
 * Architecture:
 * - MapApp mounts LSMapLayer + LSMap once
 * - State-driven overlay composition via topOverlays, bottomOverlays
 * - IdleScreenOverlays wired as overlay provider when state is Idle
 * - PlanningScreenOverlays wired as overlay provider when state is Planning
 * - Map controls mode switches between Map/Planning based on state
 * - Camera controller shared across all states
 *
 * @param navController Navigation controller for route transitions
 * @param viewModel MapApp state machine and coordination ViewModel
 * @param modifier Modifier for the root composable
 */
@Composable
fun MapApp(
    navController: NavHostController,
    viewModel: MapAppViewModel = androidx.hilt.navigation.compose.hiltViewModel(),
    onPlanningReturnToIdle: () -> Unit = viewModel::goToIdle,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    MapAppContent(
        state = state,
        navController = navController,
        onPlanningReturnToIdle = onPlanningReturnToIdle,
        modifier = modifier,
    )
}

@Composable
internal fun MapAppContent(
    state: MapAppState,
    navController: NavHostController,
    onPlanningReturnToIdle: () -> Unit,
    modifier: Modifier = Modifier,
    mapContent: @Composable (state: MapAppState, cameraController: LSMapCameraController) -> Unit = { currentState, currentCameraController ->
        LSMap(
            mode = when (currentState) {
                MapAppState.Idle -> MapMode.Interactive
                is MapAppState.Planning -> MapMode.Preview
                is MapAppState.RouteResults -> MapMode.Preview
            },
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
            cameraController = currentCameraController,
            modifier = Modifier
                .fillMaxSize()
                .testTag("mapapp-map"),
        )
    },
    planningOverlays: @Composable (sessionId: String, onReturnToIdle: () -> Unit) -> Unit = { sessionId, returnToIdle ->
        PlanningScreenOverlays(
            sessionId = sessionId,
            navController = navController,
            onReturnToIdle = returnToIdle,
        )
    },
) {
    val cameraController = remember { LSMapCameraController(initialZoom = 10.8) }
    var isMenuOpen by remember { mutableStateOf(false) }
    var controlsMode by remember { mutableStateOf(MapControlsMode.Map) }
    val planningSessionKey = (state as? MapAppState.Planning)?.sessionId.orEmpty()

    LaunchedEffect(planningSessionKey) {
        controlsMode = MapControlsMode.Map
    }

    val mapControlsModel = when (state) {
        MapAppState.Idle -> MapControlsModel(
            testTag = "mapapp-controls",
            mode = MapControlsMode.Map,
            handlers = MapControlsHandlers(
                onZoomIn = { cameraController.zoomIn() },
                onZoomOut = { cameraController.zoomOut() },
                onRecenter = { cameraController.recenterToUserLocation() },
            ),
        )
        is MapAppState.Planning -> planningMapControlsModel(
            onZoomIn = { cameraController.zoomIn() },
            onZoomOut = { cameraController.zoomOut() },
            onRecenter = { cameraController.recenterToUserLocation() },
            onToggleView = {
                controlsMode = when (controlsMode) {
                    MapControlsMode.Map -> MapControlsMode.Chat
                    MapControlsMode.Chat -> MapControlsMode.Map
                }
            },
        ).copy(mode = controlsMode)
        is MapAppState.RouteResults -> MapControlsModel(
            testTag = "mapapp-controls",
            mode = MapControlsMode.Map,
            handlers = MapControlsHandlers(
                onZoomIn = { cameraController.zoomIn() },
                onZoomOut = { cameraController.zoomOut() },
                onRecenter = { cameraController.recenterToUserLocation() },
            ),
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag(
                when (state) {
                    MapAppState.Idle -> "idlescreen"
                    is MapAppState.Planning -> "planningscreen"
                    is MapAppState.RouteResults -> "routeresultsscreen"
                }
            ),
    ) {
        // DOCTRINE INVARIANT: ONE LSMapLayer mounted, never remounted across state transitions.
        // Map content stays constant; overlays swap based on state.
        LSMapLayer(
            map = {
                mapContent(state, cameraController)
            },
            topOverlays = emptyList(),
            bottomOverlays = bottomOverlaysFor(state, navController),
            topBar = {
                Box(modifier = Modifier.fillMaxSize()) {
                    LSTopBar(
                        onMenuTap = { isMenuOpen = !isMenuOpen },
                        onNewTap = { /* Handled by idle overlay */ },
                        modifier = Modifier.testTag("ls-topbar"),
                    )
                    // Map controls positioned at right edge
                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .fillMaxSize(),
                    ) {
                        LSMapControls(
                            mode = mapControlsModel.mode,
                            handlers = mapControlsModel.handlers,
                            hasRouteToSave = mapControlsModel.hasRouteToSave,
                            isSavedRoute = mapControlsModel.isSavedRoute,
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .testTag(mapControlsModel.testTag),
                        )
                    }
                }
            },
            modifier = modifier.fillMaxSize(),
        )

        // Planning screen overlays (including cancel-confirm sheet) when in planning state
        if (state is MapAppState.Planning) {
            planningOverlays((state as MapAppState.Planning).sessionId, onPlanningReturnToIdle)
        }
    }
}

/**
 * Compose bottom overlays based on current MapApp state.
 * Idle state: idle screen overlays (chat input, suggestions, etc.)
 * Planning state: empty (handled by PlanningScreenOverlays)
 * RouteResults state: empty (Sprint 09 placeholder)
 */
@Composable
private fun bottomOverlaysFor(
    state: MapAppState,
    navController: NavHostController,
): List<GlassOverlaySlot> {
    return when (state) {
        MapAppState.Idle -> {
            listOf(
                GlassOverlaySlot(
                    id = "idle-overlays",
                    content = {
                        IdleScreenOverlays(
                            navController = navController,
                        )
                    }
                )
            )
        }
        is MapAppState.Planning -> emptyList()
        is MapAppState.RouteResults -> emptyList()
    }
}
