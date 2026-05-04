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
    val headerLabel: String = phaseHeaderForIndex(0),
    val activePlanId: String? = null,
    val isThinking: Boolean = true,
    val transition: PlanningTransition? = null,
    val subscriptionError: String? = null,
    val phaseHeaders: Map<String, String> = defaultPhaseHeaders(),
)

sealed interface PlanningTransition {
    data class Success(val routeOptions: PlannedRouteOptions) : PlanningTransition
    data class Failure(
        val error: LaneShadowError,
        val message: String? = null,
    ) : PlanningTransition
}

internal fun phaseHeaderForIndex(index: Int): String =
    when (index) {
        1 -> "Three loops are forming…"
        2 -> "Sun on one leg, wind on another…"
        3 -> "Ranking by scenic + twist…"
        4 -> "Picking the best three"
        else -> "Let me think on that…"
    }

internal fun defaultPhaseHeaders(): Map<String, String> =
    linkedMapOf(
        "parsing" to phaseHeaderForIndex(0),
        "searching" to phaseHeaderForIndex(1),
        "drafting" to phaseHeaderForIndex(2),
        "enriching" to phaseHeaderForIndex(3),
        "finalizing" to phaseHeaderForIndex(4),
    )
