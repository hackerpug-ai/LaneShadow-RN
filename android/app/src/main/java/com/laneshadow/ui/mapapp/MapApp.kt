package com.laneshadow.ui.mapapp

import androidx.compose.foundation.layout.Box
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

@Composable
fun MapApp(
    navController: NavHostController,
    viewModel: MapAppViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val mainNavViewModel: MainNavViewModel = hiltViewModel()

    when (val currentState = state) {
        MapAppState.Idle -> {
            Box(modifier = modifier.testTag("idlescreen")) {
                IdleRoute(navController = navController)
            }
        }

        is MapAppState.Planning -> {
            Box(modifier = modifier.testTag("planningscreen")) {
                PlanningRoute(
                    sessionId = currentState.sessionId,
                    navController = navController,
                    mainNavViewModel = mainNavViewModel,
                )
            }
        }

        is MapAppState.RouteResults -> {
            // Placeholder for Sprint 09 RR-S09-AND-T02
        }
    }
}
