package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Sessions screen data.
 *
 * Provides list of past and active ride sessions
 * for the Sessions/history drawer screen.
 */
object SessionsMockProvider : MockProvider<SessionsScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy")

    override fun value(variant: String): SessionsScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            else -> defaultState()
        }
    }

    private fun defaultState(): SessionsScreenState {
        val sessions = listOf(
            Session(
                id = "session-001",
                title = "Santa Cruz loop",
                preview = "Scenic 2-hour ride, avoid highways",
                meta = "3 routes · Active",
                `when` = "Now",
                active = true,
                routeIds = listOf("route-001", "route-002", "route-003"),
                createdAt = "2026-04-25T10:30:00Z"
            ),
            Session(
                id = "session-002",
                title = "Niles Canyon morning",
                preview = "Twisty roads, coffee stop in Sunol",
                meta = "2 routes",
                `when` = "Tue",
                active = false,
                routeIds = listOf("route-004", "route-005"),
                createdAt = "2026-04-22T08:15:00Z"
            ),
            Session(
                id = "session-003",
                title = "Diablo summit attempt",
                preview = "Early morning climb, light traffic",
                meta = "1 route",
                `when` = "Apr 12",
                active = false,
                routeIds = listOf("route-008"),
                createdAt = "2026-04-12T06:45:00Z"
            )
        )

        return SessionsScreenState(
            sessions = sessions,
            activeSessionId = "session-001"
        )
    }

    private fun emptyState(): SessionsScreenState {
        return SessionsScreenState(
            sessions = emptyList(),
            activeSessionId = null
        )
    }

    private fun overflowState(): SessionsScreenState {
        val sessions = (1..12).map { i ->
            Session(
                id = "session-00$i",
                title = "Session $i",
                preview = "Preview text for session $i",
                meta = "${i} routes",
                `when` = when (i) {
                    1 -> "Now"
                    2 -> "Tue"
                    3 -> "Apr 12"
                    else -> "Apr ${12 - i}"
                },
                active = i == 1,
                routeIds = listOf("route-$i"),
                createdAt = "2026-04-${25 - i}T10:30:00Z"
            )
        }

        return SessionsScreenState(
            sessions = sessions,
            activeSessionId = "session-001"
        )
    }

    private fun longCopyState(): SessionsScreenState {
        val sessions = listOf(
            Session(
                id = "session-001",
                title = "The Ultimate Santa Cruz Coastal Loop Adventure with Multiple Scenic Stops and Optional Extensions",
                preview = "I am looking for a truly scenic and memorable two-hour motorcycle ride that takes me down the coast to Santa Cruz while completely avoiding all highways and major roads. I want to see the ocean, ride through redwood forests, and maybe stop for coffee along the way. Please include optional detours to points of interest.",
                meta = "3 routes · Active · Plus 2 optional extensions",
                `when` = "Now",
                active = true,
                routeIds = listOf("route-001", "route-002", "route-003", "route-012", "route-007"),
                createdAt = "2026-04-25T10:30:00Z"
            ),
            Session(
                id = "session-002",
                title = "Niles Canyon Morning Coffee Run Through The East Bay Hills",
                preview = "An early morning adventure through the twisty roads of Niles Canyon with a planned coffee stop at the famous Sunol Coffee Shop where local riders gather every weekend to share stories and plan their next rides",
                meta = "2 routes · Active",
                `when` = "Tue",
                active = false,
                routeIds = listOf("route-004", "route-005"),
                createdAt = "2026-04-22T08:15:00Z"
            ),
            Session(
                id = "session-003",
                title = "Mount Hamilton Summit Challenge",
                preview = "Early morning climb",
                meta = "1 route",
                `when` = "Apr 12",
                active = false,
                routeIds = listOf("route-008"),
                createdAt = "2026-04-12T06:45:00Z"
            )
        )

        return SessionsScreenState(
            sessions = sessions,
            activeSessionId = "session-001"
        )
    }
}
