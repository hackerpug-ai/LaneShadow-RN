package com.laneshadow.ui.planning

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.sandbox.mockproviders.PlanningScreenState as MockPlanningScreenState
import com.laneshadow.ui.templates.PlanningOverlayChrome
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
 * @param onKeepPlanning Callback when "Keep planning" is tapped
 * @param onCancelPlan Callback when "Cancel ride" is tapped
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
    skipMapRendering: Boolean = false,
) {
    val viewModel: PlanningViewModel = hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>(
        creationCallback = { factory -> factory.create(sessionId) },
    )
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    PlanningScreenContent(
        uiState = uiState,
        onMenuTap = onMenuTap,
        onCollapse = onCollapse,
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
            viewModel.cancel()
        },
        onReturnToIdle = onReturnToIdle,
        consumeTransition = viewModel::consumeTransition,
        requestCancel = viewModel::requestCancel,
        skipMapRendering = skipMapRendering,
    )
}

@Composable
internal fun PlanningScreenContent(
    uiState: PlanningUiState,
    onMenuTap: () -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onDismissCancelConfirm: () -> Unit,
    onKeepPlanning: () -> Unit,
    onCancelPlan: () -> Unit,
    onReturnToIdle: () -> Unit,
    consumeTransition: () -> Unit,
    requestCancel: () -> Unit,
    skipMapRendering: Boolean,
    mapContent: @Composable (MockPlanningScreenState, com.laneshadow.ui.atoms.LSMapCameraController) -> Unit = { planningState, cameraController ->
        com.laneshadow.ui.atoms.LSMap(
            mode = com.laneshadow.ui.atoms.MapMode.Preview,
            camera = com.laneshadow.ui.atoms.CameraPosition(
                center = planningState.sketchRoute?.firstOrNull() ?: com.laneshadow.ui.atoms.LatLng(0.0, 0.0),
                zoom = 11.0,
            ),
            cameraController = cameraController,
            modifier = Modifier.testTag("planning.map-host-instance"),
        )
        if (planningState.sketchRoute != null) {
            com.laneshadow.ui.atoms.MapSketchAnimationLayer(
                path = planningState.sketchRoute,
                modifier = Modifier.testTag("planning.sketch-animation-layer"),
            )
        }
    },
) {
    BackHandler {
        if (uiState.showCancelConfirm) {
            onDismissCancelConfirm()
        } else {
            requestCancel()
        }
    }

    LaunchedEffect(uiState.transition) {
        if (uiState.transition == PlanningTransition.Cancelled) {
            consumeTransition()
            onReturnToIdle()
        }
    }

    val mockState = uiState.toMockState()

    if (skipMapRendering) {
        PlanningOverlayChrome(
            state = mockState,
            onCollapse = {
                onCollapse()
                requestCancel()
            },
            onFilter = onFilter,
            modifier = Modifier
                .fillMaxSize()
                .testTag("planning.overlay-chrome"),
        )
        if (uiState.showCancelConfirm) {
            PlanningCancelConfirmSheet(
                onKeep = onKeepPlanning,
                onCancel = onCancelPlan,
                onDismiss = onDismissCancelConfirm,
            )
        }
        return
    }

    PlanningScreen(
        state = mockState,
        onMenuTap = onMenuTap,
        onCollapse = {
            onCollapse()
            requestCancel()
        },
        onFilter = onFilter,
        onDismissCancelConfirm = onDismissCancelConfirm,
        onKeepPlanning = onKeepPlanning,
        onCancelPlan = onCancelPlan,
        mapContent = mapContent,
    )
}
