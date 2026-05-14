package com.laneshadow.sandbox.mockproviders

import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.planning.PlanningPhaseStep

/**
 * Mock provider for Planning screen data.
 *
 * Provides planning phases, navigator message, and thinking state
 * for the Planning/route-building screen.
 *
 * PLAN-S08-AND-T02: Updated to provide capsuleHeadline, phaseSteps, and headerLabel
 * to support the PlanningScreen composition with LSContextCapsule and LSPhaseIndicator.
 */
object PlanningMockProvider : MockProvider<PlanningScreenState> {

    override val variants: List<String> = listOf(
        "default", "empty", "overflow", "long-copy",
        "v-slow", "v-cancel-confirm", "v-single-candidate"
    )

    override fun value(variant: String): PlanningScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            "v-slow" -> slowState()
            "v-cancel-confirm" -> cancelConfirmState()
            "v-single-candidate" -> singleCandidateState()
            else -> defaultState()
        }
    }

    private fun defaultState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "parsing", label = "Parsing your request", status = "done"),
                PlanningPhase(id = "searching", label = "Searching for routes", status = "done"),
                PlanningPhase(id = "drafting", label = "Drafting options", status = "active"),
                PlanningPhase(id = "enriching", label = "Enriching details", status = "pending"),
                PlanningPhase(id = "finalizing", label = "Finalizing plan", status = "pending")
            ),
            message = NavigatorMessage(
                id = "msg-planning-001",
                sessionId = "session-001",
                body = "Scenic 2-hour ride, avoid highways",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Refining…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your request", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for routes", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "drafting", label = "Drafting options", state = PhaseDotState.Active),
                PlanningPhaseStep(id = "enriching", label = "Enriching details", state = PhaseDotState.Pending),
                PlanningPhaseStep(id = "finalizing", label = "Finalizing plan", state = PhaseDotState.Pending)
            ),
            headerLabel = "Let me think on that…"
        )
    }

    private fun emptyState(): PlanningScreenState {
        return PlanningScreenState(
            phases = emptyList(),
            message = NavigatorMessage(
                id = "msg-planning-empty",
                sessionId = "session-empty",
                body = "",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = false,
            capsuleHeadline = "Sketching…",
            phaseSteps = emptyList(),
            headerLabel = "Let me think on that…"
        )
    }

    private fun overflowState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "parsing", label = "Parsing your request", status = "done"),
                PlanningPhase(id = "searching", label = "Searching for routes", status = "done"),
                PlanningPhase(id = "drafting", label = "Drafting options", status = "done"),
                PlanningPhase(id = "enriching", label = "Enriching details", status = "active"),
                PlanningPhase(id = "finalizing", label = "Finalizing plan", status = "pending")
            ),
            message = NavigatorMessage(
                id = "msg-planning-overflow",
                sessionId = "session-overflow",
                body = "Scenic 2-hour ride, avoid highways, include stops at viewpoints and coffee shops",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Scoring…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your request", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for routes", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "drafting", label = "Drafting options", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "enriching", label = "Enriching details", state = PhaseDotState.Active),
                PlanningPhaseStep(id = "finalizing", label = "Finalizing plan", state = PhaseDotState.Pending)
            ),
            headerLabel = "Let me think on that…"
        )
    }

    private fun longCopyState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(
                    id = "parsing",
                    label = "Parsing your ride request and understanding your preferences",
                    status = "done"
                ),
                PlanningPhase(
                    id = "searching",
                    label = "Searching for potential road routes through the Santa Cruz Mountains",
                    status = "done"
                ),
                PlanningPhase(
                    id = "drafting",
                    label = "Drafting route options and checking that all segments connect properly",
                    status = "active"
                ),
                PlanningPhase(
                    id = "enriching",
                    label = "Enriching with weather conditions and scenic details",
                    status = "pending"
                ),
                PlanningPhase(
                    id = "finalizing",
                    label = "Finalizing plan based on scenery, difficulty, and weather",
                    status = "pending"
                )
            ),
            message = NavigatorMessage(
                id = "msg-planning-long",
                sessionId = "session-long",
                body = "I am looking for a truly scenic and memorable two-hour motorcycle ride that takes me down the coast to Santa Cruz while completely avoiding all highways and major roads. I want to see the ocean, ride through redwood forests, and maybe stop for coffee along the way.",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Refining…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your ride request and understanding your preferences", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for potential road routes through the Santa Cruz Mountains", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "drafting", label = "Drafting route options and checking that all segments connect properly", state = PhaseDotState.Active),
                PlanningPhaseStep(id = "enriching", label = "Enriching with weather conditions and scenic details", state = PhaseDotState.Pending),
                PlanningPhaseStep(id = "finalizing", label = "Finalizing plan based on scenery, difficulty, and weather", state = PhaseDotState.Pending)
            ),
            headerLabel = "Let me think on that…"
        )
    }

    /**
     * V01: slow variant
     * Italic apology message + dashed border
     */
    private fun slowState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "parsing", label = "Parsing your request", status = "done"),
                PlanningPhase(id = "searching", label = "Searching for routes", status = "active"),
                PlanningPhase(id = "drafting", label = "Drafting options", status = "pending"),
                PlanningPhase(id = "enriching", label = "Enriching details", status = "pending"),
                PlanningPhase(id = "finalizing", label = "Finalizing plan", status = "pending")
            ),
            message = NavigatorMessage(
                id = "msg-planning-slow",
                sessionId = "session-slow",
                body = "Scenic 2-hour ride, avoid highways",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Asking…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your request", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for routes", state = PhaseDotState.Active),
                PlanningPhaseStep(id = "drafting", label = "Drafting options", state = PhaseDotState.Pending),
                PlanningPhaseStep(id = "enriching", label = "Enriching details", state = PhaseDotState.Pending),
                PlanningPhaseStep(id = "finalizing", label = "Finalizing plan", state = PhaseDotState.Pending)
            ),
            headerLabel = "Let me think on that…",
            slowApology = "Taking a moment to think"
        )
    }

    /**
     * V02: cancel-confirm variant
     * Show cancel confirmation modal
     */
    private fun cancelConfirmState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "parsing", label = "Parsing your request", status = "done"),
                PlanningPhase(id = "searching", label = "Searching for routes", status = "done"),
                PlanningPhase(id = "drafting", label = "Drafting options", status = "active"),
                PlanningPhase(id = "enriching", label = "Enriching details", status = "pending"),
                PlanningPhase(id = "finalizing", label = "Finalizing plan", status = "pending")
            ),
            message = NavigatorMessage(
                id = "msg-planning-cancel",
                sessionId = "session-cancel",
                body = "Scenic 2-hour ride, avoid highways",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Refining…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your request", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for routes", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "drafting", label = "Drafting options", state = PhaseDotState.Active),
                PlanningPhaseStep(id = "enriching", label = "Enriching details", state = PhaseDotState.Pending),
                PlanningPhaseStep(id = "finalizing", label = "Finalizing plan", state = PhaseDotState.Pending)
            ),
            headerLabel = "Let me think on that…",
            showCancelConfirm = true
        )
    }

    /**
     * V03: single-candidate variant
     * Warning border + phase headers
     */
    private fun singleCandidateState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "parsing", label = "Parsing your request", status = "done"),
                PlanningPhase(id = "searching", label = "Searching for routes", status = "done"),
                PlanningPhase(id = "drafting", label = "Drafting options", status = "active")
            ),
            message = NavigatorMessage(
                id = "msg-planning-single",
                sessionId = "session-single",
                body = "Scenic 2-hour ride, avoid highways",
                timestamp = "2026-04-25T10:30:00Z",
                kind = "prompt",
                attachments = null,
                detail = null,
                pinned = false
            ),
            isThinking = true,
            capsuleHeadline = "Refining…",
            phaseSteps = listOf(
                PlanningPhaseStep(id = "parsing", label = "Parsing your request", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "searching", label = "Searching for routes", state = PhaseDotState.Done),
                PlanningPhaseStep(id = "drafting", label = "Drafting options", state = PhaseDotState.Active)
            ),
            headerLabel = "Let me think on that…",
            warningBorder = true,
            phaseHeaders = mapOf(
                "parsing" to "Checking your preferences",
                "searching" to "Finding the best roads",
                "drafting" to "Refining the route"
            )
        )
    }
}
