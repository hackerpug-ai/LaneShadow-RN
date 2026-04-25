package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Route Results screen data.
 *
 * Provides navigator message with route attachments and route list
 * for the Route Results/selection screen.
 */
object RouteResultsMockProvider : MockProvider<RouteResultsScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy")

    override fun value(variant: String): RouteResultsScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            else -> defaultState()
        }
    }

    private fun defaultState(): RouteResultsScreenState {
        val routes = listOf(
            Route(
                id = "route-001",
                name = "The Skyline Spine",
                via = "280 → 92 → Skyline to Alice's",
                distance = 42500,
                estimatedTime = 5400,
                climb = 3200,
                scenicScore = 9,
                difficulty = "advanced",
                polyline = "q`xwF|~kjVAo@f@e@lBiYfOaMnJcZ`FoOnFyDtL}DnK{DvB{FbEyE~CyC`Dy@hCq@|A}@jC]lBg@fBs@bBc@|@a@r@U`@O`@If@E\\G\\I`@Mf@Ul@Uz@w@hBe@f@i@`@c@x@]t@Qr@Op@M`@K`@I\\G",
                variant = "best"
            ),
            Route(
                id = "route-002",
                name = "Coastal Highway 1 Classic",
                via = "Great Highway → Hwy 1 → Pacifica",
                distance = 38000,
                estimatedTime = 4800,
                climb = 2100,
                scenicScore = 10,
                difficulty = "moderate",
                polyline = "y|rwFv`ojVHELGFWAYOu@i@sAo@aAk@eA]oAEk@Ai@Aa@?W@W@UBQ@OBODQBKDQFSF]H_@Da@Ba@?[@KBK@I@I@G@E@G@E?G?E?C?A?A?@?@?",
                variant = "alt1"
            ),
            Route(
                id = "route-003",
                name = "Mount Hamilton Loop",
                via = "Alum Rock → Mt Hamilton → San Antonio",
                distance = 56000,
                estimatedTime = 7200,
                climb = 4500,
                scenicScore = 8,
                difficulty = "advanced",
                polyline = "kvswFzcbjV~@p@~@t@|@l@p@n@p@t@x@z@x@z@|@~@p@n@l@j@h@f@d@`@^\\V^\\Z",
                variant = "alt2"
            )
        )

        return RouteResultsScreenState(
            message = NavigatorMessage(
                id = "msg-001",
                sessionId = "session-001",
                body = "I found three great options for your Santa Cruz ride. The Skyline Spine is the most scenic - it'll take you through the redwoods with incredible views. Highway 1 is the classic coastal route if you want ocean vistas the whole way. Mt Hamilton is a challenging climb with rewarding panoramas at the summit.",
                timestamp = "2026-04-25T10:31:00Z",
                kind = "response",
                attachments = listOf(
                    RouteAttachment(
                        routeId = "route-001",
                        variant = "best",
                        isBest = true,
                        weather = WeatherSummary(condition = "clear", label = "Clear"),
                        scenic = 5,
                        includesFavorite = true,
                        includesFavoriteLabel = "INCLUDES SUNSET CLIMB"
                    ),
                    RouteAttachment(
                        routeId = "route-002",
                        variant = "alt1",
                        isBest = false,
                        weather = WeatherSummary(condition = "clear", label = "Clear"),
                        scenic = 5,
                        includesFavorite = null,
                        includesFavoriteLabel = null
                    ),
                    RouteAttachment(
                        routeId = "route-003",
                        variant = "alt2",
                        isBest = false,
                        weather = WeatherSummary(condition = "wind", label = "18mph NW"),
                        scenic = 4,
                        includesFavorite = null,
                        includesFavoriteLabel = null
                    )
                ),
                detail = null,
                pinned = true
            ),
            routes = routes,
            selectedRouteId = "route-001"
        )
    }

    private fun emptyState(): RouteResultsScreenState {
        return RouteResultsScreenState(
            message = NavigatorMessage(
                id = "msg-empty",
                sessionId = "session-empty",
                body = "No routes found. Try adjusting your search criteria.",
                timestamp = "2026-04-25T10:31:00Z",
                kind = "error",
                attachments = null,
                detail = null,
                pinned = false
            ),
            routes = emptyList(),
            selectedRouteId = null
        )
    }

    private fun overflowState(): RouteResultsScreenState {
        val routes = (1..12).map { i ->
            Route(
                id = "route-$i",
                name = "Route Option $i",
                via = "Via $i",
                distance = 30000 + (i * 2000),
                estimatedTime = 4000 + (i * 300),
                climb = 2000 + (i * 200),
                scenicScore = (i % 5) + 5,
                difficulty = if (i % 3 == 0) "advanced" else if (i % 2 == 0) "moderate" else "easy",
                polyline = "test_polyline_$i",
                variant = when (i % 3) {
                    0 -> "best"
                    1 -> "alt1"
                    else -> "alt2"
                }
            )
        }

        return RouteResultsScreenState(
            message = NavigatorMessage(
                id = "msg-overflow",
                sessionId = "session-overflow",
                body = "I found 12 route options for your ride. Here they are ranked by scenic score and difficulty.",
                timestamp = "2026-04-25T10:31:00Z",
                kind = "response",
                attachments = routes.take(3).mapIndexed { index, route ->
                    RouteAttachment(
                        routeId = route.id,
                        variant = route.variant ?: "best",
                        isBest = index == 0,
                        weather = WeatherSummary(condition = "clear", label = "Clear"),
                        scenic = (route.scenicScore + 1) / 2,
                        includesFavorite = if (index == 0) true else null,
                        includesFavoriteLabel = if (index == 0) "BEST ROUTE" else null
                    )
                },
                detail = null,
                pinned = true
            ),
            routes = routes,
            selectedRouteId = "route-1"
        )
    }

    private fun longCopyState(): RouteResultsScreenState {
        val routes = listOf(
            Route(
                id = "route-001",
                name = "The Magnificent and Legendary Skyline Spine Adventure Through The Santa Cruz Mountains",
                via = "Interstate 280 West toward San Francisco → Highway 92 West toward Half Moon Bay → Skyline Boulevard South all the way to the famous and historic Alice's Restaurant",
                distance = 42500,
                estimatedTime = 5400,
                climb = 3200,
                scenicScore = 9,
                difficulty = "advanced",
                polyline = "q`xwF|~kjVAo@f@e@lBiYfOaMnJcZ`FoOnFyDtL}DnK{DvB{FbEyE~CyC`Dy@hCq@|A}@jC]lBg@fBs@bBc@|@a@r@U`@O`@If@E\\G\\I`@Mf@Ul@Uz@w@hBe@f@i@`@c@x@]t@Qr@Op@M`@K`@I\\G",
                variant = "best"
            )
        )

        return RouteResultsScreenState(
            message = NavigatorMessage(
                id = "msg-long",
                sessionId = "session-long",
                body = "I have analyzed your request for a scenic two-hour ride to Santa Cruz while avoiding all highways and major roads, and I am pleased to report that I have found an exceptional route that perfectly matches your criteria. The Skyline Spine is a magnificent route that will take you through towering ancient redwood forests in the Santa Cruz Mountains, offering breathtaking panoramic views at every turn and including the famous Sunset Climb section that experienced riders consider one of the premier riding experiences in all of Northern California.",
                timestamp = "2026-04-25T10:31:00Z",
                kind = "response",
                attachments = listOf(
                    RouteAttachment(
                        routeId = "route-001",
                        variant = "best",
                        isBest = true,
                        weather = WeatherSummary(condition = "clear", label = "Clear"),
                        scenic = 5,
                        includesFavorite = true,
                        includesFavoriteLabel = "INCLUDES THE LEGENDARY SUNSET CLIMB SECTION"
                    )
                ),
                detail = null,
                pinned = true
            ),
            routes = routes,
            selectedRouteId = "route-001"
        )
    }
}
