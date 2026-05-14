package com.laneshadow.ui.planning

import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.Phase
import com.laneshadow.services.PlannedRouteOptions

data class PlanningUiState(
    val sessionId: String,
    val messages: List<SessionMessage> = emptyList(),
    val recentSessions: List<PlanningSession> = emptyList(),
    val currentPhase: Phase = Phase.Parsing,
    val activePhaseIndex: Int = 0,
    val capsuleHeadline: String = planningPhaseDefinition(Phase.Parsing).capsuleHeadline,
    val phaseSteps: List<PlanningPhaseStep> = phaseStepsFor(Phase.Parsing),
    val headerLabel: String = planningPhaseDefinition(Phase.Parsing).capsuleHeadline,
    val activePlanId: String? = null,
    val isThinking: Boolean = true,
    val transition: PlanningTransition? = null,
    val subscriptionError: String? = null,
    val phaseHeaders: Map<String, String> = phaseHeaders(),
    val showCancelConfirm: Boolean = false,
)

sealed interface PlanningTransition {
    data object Cancelled : PlanningTransition
    data class Success(val routeOptions: PlannedRouteOptions) : PlanningTransition
    data class Failure(
        val error: LaneShadowError,
        val message: String? = null,
    ) : PlanningTransition
}
