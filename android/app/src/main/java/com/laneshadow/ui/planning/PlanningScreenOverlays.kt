package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController

/**
 * PlanningScreenOverlays — provides the planning-state overlays and interactions.
 *
 * Manages:
 * - LSPhaseIndicator overlay composition
 * - Planning context capsule (shown in topBar)
 * - MapSketchAnimationLayer overlay
 * - Cancel-confirm sheet modal
 * - Planning session navigation
 *
 * Called by MapApp when state is Planning; coordinates with PlanningScreenContainer
 * for ViewModel injection and state binding.
 *
 * @param sessionId Session ID for ViewModel factory
 * @param navController Navigation controller for route transitions
 */
@Composable
fun PlanningScreenOverlays(
    sessionId: String,
    navController: NavHostController,
    onReturnToIdle: () -> Unit = { navController.popBackStack() },
    container: @Composable (onReturnToIdle: () -> Unit) -> Unit = { returnToIdle ->
        PlanningScreenContainer(
            sessionId = sessionId,
            onMenuTap = { navController.navigate(com.laneshadow.navigation.Route.Sessions) },
            onCollapse = {},
            onFilter = { navController.navigate(com.laneshadow.navigation.Route.Sessions) },
            onDismissCancelConfirm = {},
            onKeepPlanning = {},
            onCancelPlan = {},
            onReturnToIdle = returnToIdle,
            skipMapRendering = true,
        )
    },
) {
    container(onReturnToIdle)
}
