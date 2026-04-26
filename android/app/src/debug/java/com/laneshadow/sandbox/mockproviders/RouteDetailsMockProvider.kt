package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider for Route Details screen data.
 *
 * Provides a single route with weather timeline
 * for the Route Details/bottom sheet screen.
 */
object RouteDetailsMockProvider : MockProvider<RouteDetailsScreenState> {

    override val variants: List<String> = listOf("default", "empty", "overflow", "long-copy", "mixed-weather", "alt-route")

    override fun value(variant: String): RouteDetailsScreenState {
        return when (variant) {
            "empty" -> emptyState()
            "overflow" -> overflowState()
            "long-copy" -> longCopyState()
            "mixed-weather" -> mixedWeatherState()
            "alt-route" -> altRouteState()
            else -> defaultState()
        }
    }

    private fun defaultState(): RouteDetailsScreenState {
        val route = Route(
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
        )

        val weatherTimeline = listOf(
            WeatherTimelineEntry(hour = "9", temperature = 62, condition = "clear"),
            WeatherTimelineEntry(hour = "10", temperature = 65, condition = "clear"),
            WeatherTimelineEntry(hour = "11", temperature = 68, condition = "clear"),
            WeatherTimelineEntry(hour = "12", temperature = 71, condition = "clear"),
            WeatherTimelineEntry(hour = "13", temperature = 73, condition = "clear"),
            WeatherTimelineEntry(hour = "14", temperature = 74, condition = "clear")
        )

        return RouteDetailsScreenState(
            route = route,
            weatherTimeline = weatherTimeline
        )
    }

    private fun emptyState(): RouteDetailsScreenState {
        return RouteDetailsScreenState(
            route = Route(
                id = "route-empty",
                name = "No Route Available",
                via = "",
                distance = 0,
                estimatedTime = 0,
                climb = 0,
                scenicScore = 0,
                difficulty = "easy",
                polyline = "",
                variant = null
            ),
            weatherTimeline = emptyList()
        )
    }

    private fun overflowState(): RouteDetailsScreenState {
        val route = Route(
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
        )

        val weatherTimeline = listOf(
            WeatherTimelineEntry(hour = "6", temperature = 55, condition = "clear"),
            WeatherTimelineEntry(hour = "7", temperature = 58, condition = "clear"),
            WeatherTimelineEntry(hour = "8", temperature = 60, condition = "clear"),
            WeatherTimelineEntry(hour = "9", temperature = 62, condition = "clear"),
            WeatherTimelineEntry(hour = "10", temperature = 65, condition = "clear"),
            WeatherTimelineEntry(hour = "11", temperature = 68, condition = "clear"),
            WeatherTimelineEntry(hour = "12", temperature = 71, condition = "clear"),
            WeatherTimelineEntry(hour = "13", temperature = 73, condition = "clear"),
            WeatherTimelineEntry(hour = "14", temperature = 74, condition = "clear"),
            WeatherTimelineEntry(hour = "15", temperature = 75, condition = "clear"),
            WeatherTimelineEntry(hour = "16", temperature = 74, condition = "clear"),
            WeatherTimelineEntry(hour = "17", temperature = 72, condition = "clear")
        )

        return RouteDetailsScreenState(
            route = route,
            weatherTimeline = weatherTimeline
        )
    }

    private fun longCopyState(): RouteDetailsScreenState {
        val route = Route(
            id = "route-001",
            name = "The Magnificent and Legendary Skyline Spine Adventure Through The Santa Cruz Mountains",
            via = "Interstate 280 West toward San Francisco → Highway 92 West toward Half Moon Bay → Skyline Boulevard South all the way to the famous and historic Alice's Restaurant at the intersection of Highway 84 and Skyline Boulevard where riders from all over Northern California gather every weekend",
            distance = 42500,
            estimatedTime = 5400,
            climb = 3200,
            scenicScore = 9,
            difficulty = "advanced",
            polyline = "q`xwF|~kjVAo@f@e@lBiYfOaMnJcZ`FoOnFyDtL}DnK{DvB{FbEyE~CyC`Dy@hCq@|A}@jC]lBg@fBs@bBc@|@a@r@U`@O`@If@E\\G\\I`@Mf@Ul@Uz@w@hBe@f@i@`@c@x@]t@Qr@Op@M`@K`@I\\G",
            variant = "best"
        )

        val weatherTimeline = listOf(
            WeatherTimelineEntry(hour = "9", temperature = 62, condition = "clear"),
            WeatherTimelineEntry(hour = "10", temperature = 65, condition = "clear"),
            WeatherTimelineEntry(hour = "11", temperature = 68, condition = "clear"),
            WeatherTimelineEntry(hour = "12", temperature = 71, condition = "clear"),
            WeatherTimelineEntry(hour = "13", temperature = 73, condition = "clear"),
            WeatherTimelineEntry(hour = "14", temperature = 74, condition = "clear"),
            WeatherTimelineEntry(hour = "15", temperature = 75, condition = "clear"),
            WeatherTimelineEntry(hour = "16", temperature = 74, condition = "clear"),
            WeatherTimelineEntry(hour = "17", temperature = 72, condition = "clear"),
            WeatherTimelineEntry(hour = "18", temperature = 70, condition = "clear"),
            WeatherTimelineEntry(hour = "19", temperature = 68, condition = "clear"),
            WeatherTimelineEntry(hour = "20", temperature = 65, condition = "clear")
        )

        return RouteDetailsScreenState(
            route = route,
            weatherTimeline = weatherTimeline
        )
    }

    private fun mixedWeatherState(): RouteDetailsScreenState {
        val route = Route(
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
        )

        val weatherTimeline = listOf(
            WeatherTimelineEntry(hour = "9", temperature = 62, condition = "clear"),
            WeatherTimelineEntry(hour = "10", temperature = 65, condition = "wind"),
            WeatherTimelineEntry(hour = "11", temperature = 68, condition = "rain"),
            WeatherTimelineEntry(hour = "12", temperature = 71, condition = "rain"),
            WeatherTimelineEntry(hour = "13", temperature = 73, condition = "wind"),
            WeatherTimelineEntry(hour = "14", temperature = 74, condition = "clear")
        )

        return RouteDetailsScreenState(
            route = route,
            weatherTimeline = weatherTimeline
        )
    }

    private fun altRouteState(): RouteDetailsScreenState {
        val route = Route(
            id = "route-002",
            name = "Coastal Highway Escape",
            via = "1 South to Half Moon Bay",
            distance = 38000,
            estimatedTime = 4800,
            climb = 2100,
            scenicScore = 8,
            difficulty = "moderate",
            polyline = "q`xwF|~kjVAo@f@e@lBiYfOaMnJcZ`FoOnFyDtL}DnK{DvB{FbEyE~CyC`Dy@hCq@|A}@jC]lBg@fBs@bBc@|@a@r@U`@O`@If@E\\G\\I`@Mf@Ul@Uz@w@hBe@f@i@`@c@x@]t@Qr@Op@M`@K`@I\\G",
            variant = "alt1"
        )

        val weatherTimeline = listOf(
            WeatherTimelineEntry(hour = "9", temperature = 60, condition = "clear"),
            WeatherTimelineEntry(hour = "10", temperature = 63, condition = "clear"),
            WeatherTimelineEntry(hour = "11", temperature = 66, condition = "clear"),
            WeatherTimelineEntry(hour = "12", temperature = 69, condition = "clear"),
            WeatherTimelineEntry(hour = "13", temperature = 71, condition = "clear"),
            WeatherTimelineEntry(hour = "14", temperature = 72, condition = "clear")
        )

        return RouteDetailsScreenState(
            route = route,
            weatherTimeline = weatherTimeline
        )
    }
}
