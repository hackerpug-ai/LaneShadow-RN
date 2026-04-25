package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.organisms.LSRouteSheet
import com.laneshadow.ui.organisms.RouteDetails
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

object LSRouteSheetStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.routesheet.best-route",
            tier = ComponentTier.Organism,
            component = "LSRouteSheet",
            name = "Best Route",
            summary = "Best badge + scenic tag + title opinion.lg + via + 4-col readout + weather + actions.",
            previewMode = PreviewMode.FullScreen,
            content = { BestRouteStory() },
        ),
        Story(
            id = "organisms.routesheet.alt-route",
            tier = ComponentTier.Organism,
            component = "LSRouteSheet",
            name = "Alt Route",
            summary = "No Best badge. Scenic tag shows lower score. Alt1 sage polyline. All clear weather cells.",
            previewMode = PreviewMode.FullScreen,
            content = { AltRouteStory() },
        ),
        Story(
            id = "organisms.routesheet.long-title",
            tier = ComponentTier.Organism,
            component = "LSRouteSheet",
            name = "Long Title + Via",
            summary = "Title wraps to 2 lines. Via line also wraps. Sheet height expands. Weather omitted for brevity.",
            previewMode = PreviewMode.FullScreen,
            content = { LongTitleStory() },
        ),
        Story(
            id = "organisms.routesheet.mixed-weather",
            tier = ComponentTier.Organism,
            component = "LSRouteSheet",
            name = "Mixed Weather",
            summary = "Clear + wind + rain cells. Each cell resolves its own tint color. Tinted cells warn the rider visually.",
            previewMode = PreviewMode.FullScreen,
            content = { MixedWeatherStory() },
        ),
        Story(
            id = "organisms.routesheet.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSRouteSheet",
            name = "Dark Mode",
            summary = "Sheet surface resolves to ink-700. All tokens re-resolve. Best badge copper remains vivid.",
            previewMode = PreviewMode.FullScreen,
            content = { DarkModeStory() },
        ),
    )
}

@Composable
private fun BestRouteStory() {
    LaneShadowTheme {
        StoryColumn {
            LSRouteSheet(
                route = RouteDetails(
                    id = "route-skyline",
                    title = "The Skyline Spine",
                    via = "via Kings Mountain Rd · Kings Mountain to Woodside",
                    isBest = true,
                    distance = "47",
                    time = "1:22",
                    climb = "3.2k",
                    scenicScore = "4.8",
                ),
                weatherTimeline = listOf(
                    WeatherTimelineEntry("9A", WeatherCondition.Clear, "62°"),
                    WeatherTimelineEntry("10A", WeatherCondition.Clear, "65°"),
                    WeatherTimelineEntry("11A", WeatherCondition.Clear, "67°"),
                    WeatherTimelineEntry("12P", WeatherCondition.Wind, "68°"),
                    WeatherTimelineEntry("1P", WeatherCondition.Wind, "66°"),
                    WeatherTimelineEntry("2P", WeatherCondition.Clear, "64°"),
                ),
                onSave = {},
                onRide = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun AltRouteStory() {
    LaneShadowTheme {
        StoryColumn {
            LSRouteSheet(
                route = RouteDetails(
                    id = "route-old-la-honda",
                    title = "Old La Honda Road",
                    via = "via Page Mill Rd · Palo Alto to Woodside",
                    isBest = false,
                    distance = "38",
                    time = "1:05",
                    climb = "2.1k",
                    scenicScore = "3.6",
                ),
                weatherTimeline = listOf(
                    WeatherTimelineEntry("9A", WeatherCondition.Clear, "61°"),
                    WeatherTimelineEntry("10A", WeatherCondition.Clear, "64°"),
                    WeatherTimelineEntry("11A", WeatherCondition.Clear, "66°"),
                    WeatherTimelineEntry("12P", WeatherCondition.Clear, "67°"),
                    WeatherTimelineEntry("1P", WeatherCondition.Clear, "65°"),
                    WeatherTimelineEntry("2P", WeatherCondition.Clear, "63°"),
                ),
                onSave = {},
                onRide = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun LongTitleStory() {
    LaneShadowTheme {
        StoryColumn {
            LSRouteSheet(
                route = RouteDetails(
                    id = "route-pch",
                    title = "The Pacific Coast Highway Long Haul South",
                    via = "via Cabrillo Hwy · San Francisco to Big Sur · cliffside coastal",
                    isBest = true,
                    distance = "142",
                    time = "3:45",
                    climb = "5.8k",
                    scenicScore = "5.0",
                ),
                weatherTimeline = emptyList(), // Omitted for brevity
                onSave = {},
                onRide = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun MixedWeatherStory() {
    LaneShadowTheme {
        StoryColumn {
            LSRouteSheet(
                route = RouteDetails(
                    id = "route-coastal",
                    title = "Coastal Connector",
                    via = "via Hwy 1 · Half Moon Bay to Monterey",
                    isBest = false,
                    distance = "52",
                    time = "1:35",
                    climb = "1.4k",
                    scenicScore = "4.5",
                ),
                weatherTimeline = listOf(
                    WeatherTimelineEntry("10A", WeatherCondition.Clear, "58°"),
                    WeatherTimelineEntry("11A", WeatherCondition.Wind, "56°"),
                    WeatherTimelineEntry("12P", WeatherCondition.Rain, "54°"),
                    WeatherTimelineEntry("1P", WeatherCondition.Rain, "53°"),
                    WeatherTimelineEntry("2P", WeatherCondition.Wind, "55°"),
                    WeatherTimelineEntry("3P", WeatherCondition.Clear, "57°"),
                ),
                onSave = {},
                onRide = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun DarkModeStory() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSRouteSheet(
                route = RouteDetails(
                    id = "route-skyline-dark",
                    title = "The Skyline Spine",
                    via = "via Kings Mountain Rd",
                    isBest = true,
                    distance = "47",
                    time = "1:22",
                    climb = "3.2k",
                    scenicScore = "4.8",
                ),
                weatherTimeline = emptyList(), // Omitted for brevity
                onSave = {},
                onRide = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.lg),
        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
    ) {
        content()
    }
}
