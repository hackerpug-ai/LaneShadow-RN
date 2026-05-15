package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import com.laneshadow.navigation.MainNavViewModel

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
 * @param mainNavViewModel Main navigation ViewModel for retry caching
 */
@Composable
fun PlanningScreenOverlays(
    sessionId: String,
    navController: NavHostController,
    mainNavViewModel: MainNavViewModel,
) {
    // PlanningScreenContainer is wired as an overlay provider.
    // It handles ViewModel injection, state binding, and transition observation.
    // The LSMapLayer and LSMap are NOT remounted; only overlays change.
    PlanningScreenContainer(
        sessionId = sessionId,
        onMenuTap = { navController.navigate(com.laneshadow.navigation.Route.Sessions) },
        onCollapse = { navController.navigate(com.laneshadow.navigation.Route.Sessions) },
        onFilter = { navController.navigate(com.laneshadow.navigation.Route.Sessions) },
        onDismissCancelConfirm = {},
        onKeepPlanning = {},
        onCancelPlan = {},
        onReturnToIdle = { navController.popBackStack() },
        skipMapRendering = true, // Map is already mounted in MapApp
    )
}
