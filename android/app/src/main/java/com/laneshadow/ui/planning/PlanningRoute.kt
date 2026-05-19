package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.Route
import com.laneshadow.navigation.MainNavViewModel
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.ui.error.errorRoute
import com.laneshadow.ui.mapapp.MapApp
import com.laneshadow.ui.mapapp.MapAppViewModel
import com.laneshadow.sandbox.mockproviders.NavigatorMessage
import com.laneshadow.sandbox.mockproviders.PlanningScreenState
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@Composable
fun PlanningRoute(
    sessionId: String,
    navController: NavHostController,
    mainNavViewModel: MainNavViewModel,
    skipMapRendering: Boolean = false,
) {
    val viewModel: PlanningViewModel = hiltViewModel<PlanningViewModel, PlanningViewModel.Factory>(
        creationCallback = { factory -> factory.create(sessionId) },
    )
    val mapAppViewModel: MapAppViewModel = hiltViewModel()
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(sessionId) {
        mapAppViewModel.goToPlanning(sessionId)
    }

    MapApp(
        navController = navController,
        viewModel = mapAppViewModel,
        onPlanningReturnToIdle = mapAppViewModel::goToIdle,
    )

    LaunchedEffect(uiState.transition) {
        when (val transition = uiState.transition) {
            is PlanningTransition.Success -> {
                mainNavViewModel.clearPlanningRetry()
                navController.navigate(Route.RouteResults(sessionId))
                viewModel.consumeTransition()
            }
            is PlanningTransition.Failure -> {
                mainNavViewModel.cachePlanningRetry(
                    sessionId = sessionId,
                    content = uiState.messages.latestPlanningRetryContent(),
                )
                navController.navigate(
                    errorRoute(
                        errorCode = transition.error.originalCode,
                        errorMessage = transition.message,
                    ),
                )
                viewModel.consumeTransition()
            }
            PlanningTransition.Cancelled, null -> Unit
        }
    }
}

internal fun PlanningUiState.toMockState(): PlanningScreenState {
    val latestPrompt = messages.lastOrNull { message ->
        message.role.equals("rider", ignoreCase = true) ||
            message.role.equals("user", ignoreCase = true)
    }
    val latestMessage = latestPrompt ?: messages.latestAgentMessage() ?: messages.lastOrNull()
    val message = NavigatorMessage(
        id = latestMessage?.id?.takeIf { it.isNotBlank() } ?: "planning-message-$sessionId",
        sessionId = sessionId,
        body = latestMessage?.content?.takeIf { it.isNotBlank() } ?: "Planning your ride…",
        timestamp = latestMessage?.createdAt?.takeIf { it > 0L }?.let { isoTimestamp(it) }
            ?: isoTimestamp(System.currentTimeMillis()),
        kind = when (latestMessage?.role?.lowercase()) {
            "rider" -> "prompt"
            else -> "response"
        },
        attachments = null,
        detail = null,
        pinned = false,
    )

    return PlanningScreenState(
        phases = phaseSteps.map { step ->
            com.laneshadow.sandbox.mockproviders.PlanningPhase(
                id = step.id,
                label = step.label,
                status = when (step.state) {
                    com.laneshadow.ui.atoms.PhaseDotState.Pending -> "pending"
                    com.laneshadow.ui.atoms.PhaseDotState.Active -> "active"
                    com.laneshadow.ui.atoms.PhaseDotState.Done -> "done"
                },
            )
        },
        message = message,
        isThinking = isThinking,
        capsuleHeadline = capsuleHeadline,
        phaseSteps = phaseSteps,
        headerLabel = headerLabel,
        showCancelConfirm = showCancelConfirm,
        phaseHeaders = phaseHeaders,
        sketchRoute = sketchRoute,
    )
}

private fun isoTimestamp(epochMillis: Long): String =
    Instant.ofEpochMilli(epochMillis)
        .atZone(ZoneOffset.UTC)
        .format(DateTimeFormatter.ISO_INSTANT)

private fun List<SessionMessage>.latestPlanningRetryContent(): String? =
    lastOrNull { message ->
        message.role.equals("rider", ignoreCase = true) ||
            message.role.equals("user", ignoreCase = true)
    }?.content?.takeIf { it.isNotBlank() }
