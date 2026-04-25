package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Planning screen data.
 *
 * Provides planning phases, navigator message, and thinking state
 * for the Planning/route-building screen.
 */
object PlanningMockProvider : MockProvider<PlanningScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy")

    override fun value(variant: String): PlanningScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            else -> defaultState()
        }
    }

    private fun defaultState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "reading", label = "Reading your ride", status = "done"),
                PlanningPhase(id = "sketching", label = "Sketching roads", status = "done"),
                PlanningPhase(id = "validating", label = "Checking they connect", status = "active"),
                PlanningPhase(id = "weather", label = "Reading the sky", status = "pending"),
                PlanningPhase(id = "building", label = "Ranking your options", status = "pending")
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
            isThinking = true
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
            isThinking = false
        )
    }

    private fun overflowState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(id = "reading", label = "Reading your ride", status = "done"),
                PlanningPhase(id = "sketching", label = "Sketching roads", status = "done"),
                PlanningPhase(id = "validating", label = "Checking they connect", status = "done"),
                PlanningPhase(id = "weather", label = "Reading the sky", status = "done"),
                PlanningPhase(id = "building", label = "Ranking your options", status = "active"),
                PlanningPhase(id = "rendering", label = "Preparing display", status = "pending"),
                PlanningPhase(id = "optimizing", label = "Optimizing routes", status = "pending"),
                PlanningPhase(id = "finalizing", label = "Finalizing details", status = "pending")
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
            isThinking = true
        )
    }

    private fun longCopyState(): PlanningScreenState {
        return PlanningScreenState(
            phases = listOf(
                PlanningPhase(
                    id = "reading",
                    label = "Reading your ride request and understanding your preferences",
                    status = "done"
                ),
                PlanningPhase(
                    id = "sketching",
                    label = "Sketching potential road routes through the Santa Cruz Mountains",
                    status = "done"
                ),
                PlanningPhase(
                    id = "validating",
                    label = "Checking that all road segments connect properly and are rideable",
                    status = "active"
                ),
                PlanningPhase(
                    id = "weather",
                    label = "Reading the sky and checking current weather conditions along all routes",
                    status = "pending"
                ),
                PlanningPhase(
                    id = "building",
                    label = "Ranking your options based on scenery, difficulty, and weather",
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
            isThinking = true
        )
    }
}
