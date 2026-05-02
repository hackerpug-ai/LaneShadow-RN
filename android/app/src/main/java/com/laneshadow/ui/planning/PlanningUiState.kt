package com.laneshadow.ui.planning

import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.services.PlannedRouteOptions

data class PlanningUiState(
    val sessionId: String,
    val messages: List<SessionMessage> = emptyList(),
    val recentSessions: List<PlanningSession> = emptyList(),
    val currentPhase: String = "parsing",
    val activePhaseIndex: Int = 1,
    val headerLabel: String = phaseHeaderForIndex(1),
    val activePlanId: String? = null,
    val isThinking: Boolean = true,
    val transition: PlanningTransition? = null,
    val showCancelConfirm: Boolean = false,
    val phaseHeaders: Map<String, String> = defaultPhaseHeaders(),
)

sealed interface PlanningTransition {
    data class Success(val routeOptions: PlannedRouteOptions) : PlanningTransition
    data class Failure(val message: String) : PlanningTransition
}

internal fun phaseIndexForStatus(status: String?): Int =
    when (status?.lowercase()) {
        "searching" -> 2
        "drafting" -> 3
        "enriching" -> 4
        "finalizing" -> 5
        "parsing" -> 1
        else -> 1
    }

internal fun phaseHeaderForIndex(index: Int): String =
    when (index) {
        2 -> "Three loops are forming…"
        3 -> "Sun on one leg, wind on another…"
        4 -> "Ranking by scenic + twist…"
        5 -> "Picking the best three"
        else -> "Let me think on that…"
    }

internal fun defaultPhaseHeaders(): Map<String, String> =
    linkedMapOf(
        "reading" to phaseHeaderForIndex(1),
        "sketching" to phaseHeaderForIndex(2),
        "validating" to phaseHeaderForIndex(3),
        "weather" to phaseHeaderForIndex(4),
        "building" to phaseHeaderForIndex(5),
    )
