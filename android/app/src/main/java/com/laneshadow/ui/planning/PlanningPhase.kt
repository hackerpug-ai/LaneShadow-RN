package com.laneshadow.ui.planning

import com.laneshadow.services.Phase
import com.laneshadow.ui.atoms.PhaseDotState

data class PlanningPhaseStep(
    val id: String,
    val label: String,
    val state: PhaseDotState,
)

internal data class PlanningPhaseDefinition(
    val phase: Phase,
    val id: String,
    val label: String,
    val capsuleHeadline: String,
)

internal val planningPhaseDefinitions: List<PlanningPhaseDefinition> = listOf(
    PlanningPhaseDefinition(
        phase = Phase.Parsing,
        id = "parsing",
        label = "Parsing your request",
        capsuleHeadline = "Sketching…",
    ),
    PlanningPhaseDefinition(
        phase = Phase.Searching,
        id = "searching",
        label = "Searching for routes",
        capsuleHeadline = "Asking…",
    ),
    PlanningPhaseDefinition(
        phase = Phase.Drafting,
        id = "drafting",
        label = "Drafting options",
        capsuleHeadline = "Refining…",
    ),
    PlanningPhaseDefinition(
        phase = Phase.Enriching,
        id = "enriching",
        label = "Enriching details",
        capsuleHeadline = "Scoring…",
    ),
    PlanningPhaseDefinition(
        phase = Phase.Finalizing,
        id = "finalizing",
        label = "Finalizing plan",
        capsuleHeadline = "Finalizing…",
    ),
)

internal fun planningPhaseDefinition(phase: Phase): PlanningPhaseDefinition =
    planningPhaseDefinitions.firstOrNull { definition -> definition.phase == phase }
        ?: planningPhaseDefinitions.first()

internal fun phaseStepsFor(activePhase: Phase): List<PlanningPhaseStep> {
    val activeIndex = planningPhaseDefinitions.indexOfFirst { definition ->
        definition.phase == activePhase
    }.coerceAtLeast(0)

    return planningPhaseDefinitions.mapIndexed { index, definition ->
        val state = when {
            index < activeIndex -> PhaseDotState.Done
            index == activeIndex -> PhaseDotState.Active
            else -> PhaseDotState.Pending
        }

        PlanningPhaseStep(
            id = definition.id,
            label = definition.label,
            state = state,
        )
    }
}

internal fun phaseHeaders(): Map<String, String> =
    planningPhaseDefinitions.associate { definition ->
        definition.id to definition.capsuleHeadline
    }
