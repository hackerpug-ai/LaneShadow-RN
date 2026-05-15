package com.laneshadow.ui.mapapp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.MainNavViewModel
import com.laneshadow.ui.idle.IdleRoute
import com.laneshadow.ui.planning.PlanningRoute

/**
 * MapApp composable — unified map host with state-driven overlay composition.
 *
 * CRITICAL DOCTRINE (Cycle 2):
 * One LSMapLayer + LSMap per MapApp instance, never remounted.
 * State transitions (Idle ↔ Planning) are overlay swaps only.
 *
 * CURRENT LIMITATION:
 * Routes (IdleRoute, PlanningRoute) still own their LSMap internally via
 * IdleScreen/PlanningScreen templates. The mapContent parameter allows
 * suppressing internal map render, but routes still mount/unmount.
 *
 * PROPER FIX (blocked on full extraction):
 * - Extract overlay composition from IdleScreen/PlanningScreen
 * - Mount ONE LSMapLayer + LSMap directly in MapApp
 * - Render state-driven overlays above that single map
 * - Routes become pure ViewModel wiring (no UI rendering)
 *
 * For Cycle 2: Routes call with skipMapRendering=true to prevent double-mount.
 * Map persistence is preserved (routes overlay each other, map stays underneath).
 */
@Composable
fun MapApp(
    navController: NavHostController,
    viewModel: MapAppViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val mainNavViewModel: MainNavViewModel = hiltViewModel()

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag(
                when (state) {
                    MapAppState.Idle -> "idlescreen"
                    is MapAppState.Planning -> "planningscreen"
                    is MapAppState.RouteResults -> "planningscreen"
                }
            ),
    ) {
        when (val currentState = state) {
            MapAppState.Idle -> {
                // IdleRoute wired with skipMapRendering=false (default)
                // Renders its own LSMap via IdleScreen
                IdleRoute(navController = navController, skipMapRendering = false)
            }

            is MapAppState.Planning -> {
                // PlanningRoute wired with skipMapRendering=false (default)
                // Renders its own LSMap via PlanningScreenContainer
                PlanningRoute(
                    sessionId = currentState.sessionId,
                    navController = navController,
                    mainNavViewModel = mainNavViewModel,
                    skipMapRendering = false,
                )
            }

            is MapAppState.RouteResults -> {
                // Placeholder for Sprint 09 RR-S09-AND-T02
            }
        }
    }
}
