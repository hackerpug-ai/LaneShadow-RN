package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.planningRoute
import com.laneshadow.ui.atoms.LSMapCameraController
import com.laneshadow.ui.idle.IdleRoute
import com.laneshadow.ui.idle.IdleViewModel
import com.laneshadow.ui.idle.IdleNavTarget

/**
 * IdleScreenOverlays — provides the idle state overlays (chat input, suggestions, etc.).
 *
 * This composable manages the idle state without mounting a map.
 * The actual LSMapLayer + LSMap are mounted in MapApp and persist across state transitions.
 *
 * Handles:
 * - ViewModel injection (IdleViewModel)
 * - Input value and autocomplete state
 * - Suggestion chips and location badge
 * - Navigation to planning on session start
 * - Map camera controller integration
 *
 * @param navController Navigation controller for route transitions
 */
@Composable
fun IdleScreenOverlays(
    navController: NavHostController,
) {
    val viewModel: IdleViewModel = hiltViewModel()
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    // IdleRoute is called with skipMapRendering=true because MapApp already mounts
    // the persistent LSMapLayer + LSMap. IdleRoute still provides the overlay
    // composition (chat input, suggestions) via IdleScreen template.
    IdleRoute(
        navController = navController,
        skipMapRendering = true,
    )

    // Listen for navigation to planning
    LaunchedEffect(uiState.navigateTo) {
        when (val destination = uiState.navigateTo) {
            is IdleNavTarget.Planning -> {
                navController.navigate(planningRoute(destination.sessionId))
                viewModel.consumeNavigation()
            }
            null -> Unit
        }
    }
}
