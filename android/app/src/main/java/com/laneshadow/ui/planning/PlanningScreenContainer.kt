package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.sandbox.mockproviders.PlanningScreenState as MockPlanningScreenState
import com.laneshadow.ui.templates.PlanningScreen

/**
 * PlanningScreenContainer — Hilt-aware container for the planning state.
 *
 * AC-5: Resolves PlanningViewModel via assisted Hilt injection and binds:
 * - uiState to the stateless PlanningScreen composable
 * - intent callbacks (onCancel, etc.) to ViewModel methods
 * - transition observations (PlanningTransition.Cancelled) to invoke onReturnToIdle
 *
 * The persistent LSMapHost and overlay composition are managed by PlanningScreen;
 * this container only handles ViewModel injection and state flow collection.
 *
 * @param sessionId Session ID for ViewModel factory
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onCollapse Callback when collapse button is tapped (requestCancel)
 * @param onFilter Callback when filter button is tapped
 * @param onDismissCancelConfirm Callback when cancel confirm dialog is dismissed
 * @param onKeepPlanning Callback when "Keep thinking" is tapped
 * @param onCancelPlan Callback when "Cancel plan" is tapped (confirmCancel)
 * @param onReturnToIdle Callback when PlanningTransition.Cancelled is observed
 */
@Composable
fun PlanningScreenContainer(
    sessionId: String,
    onMenuTap: () -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onDismissCancelConfirm: () -> Unit = {},
    onKeepPlanning: () -> Unit = {},
    onCancelPlan: () -> Unit = {},
    onReturnToIdle: () -> Unit = {},
) {
    // AC-5: Resolve ViewModel via assisted Hilt injection
    val viewModel: PlanningViewModel = hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>(
        creationCallback = { factory -> factory.create(sessionId) },
    )

    // AC-5: Collect state as state with lifecycle
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    // AC-5: Observe transition and invoke onReturnToIdle when cancelled
    LaunchedEffect(uiState.transition) {
        when (uiState.transition) {
            PlanningTransition.Cancelled -> {
                viewModel.consumeTransition()
                onReturnToIdle()
            }
            else -> Unit
        }
    }

    // Convert ViewModel state to mock state for PlanningScreen
    val mockState = uiState.toMockState()

    // Render the stateless PlanningScreen with ViewModel state and callbacks
    PlanningScreen(
        state = mockState,
        onMenuTap = onMenuTap,
        onCollapse = {
            onCollapse()
            viewModel.requestCancel()
        },
        onFilter = onFilter,
        onDismissCancelConfirm = {
            onDismissCancelConfirm()
            viewModel.dismissCancelConfirm()
        },
        onKeepPlanning = {
            onKeepPlanning()
            viewModel.dismissCancelConfirm()
        },
        onCancelPlan = {
            onCancelPlan()
            viewModel.confirmCancel()
        },
    )
}
