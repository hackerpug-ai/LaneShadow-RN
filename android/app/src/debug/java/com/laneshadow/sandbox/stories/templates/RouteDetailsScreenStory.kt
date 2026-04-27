package com.laneshadow.sandbox.stories.templates

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.RouteDetailsScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

/**
 * RouteDetailsScreen stories for sandbox.
 */
object RouteDetailsScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.route-details.default",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "Default",
            summary = "Single best polyline with LSRouteSheet showing best badge, opinion title, 4-column readout, 6-hour weather timeline, and Save/Ride actions.",
            previewMode = PreviewMode.FullScreen,
            content = { DefaultStory() },
        ),
        Story(
            id = "templates.route-details.mixed-weather",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "Mixed Weather",
            summary = "Route with mixed weather conditions (clear → wind → rain) showing per-condition tints.",
            previewMode = PreviewMode.FullScreen,
            content = { MixedWeatherStory() },
        ),
        Story(
            id = "templates.route-details.alt-route",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "Alt Route",
            summary = "Alternative route without best badge, showing alt variant styling.",
            previewMode = PreviewMode.FullScreen,
            content = { AltRouteStory() },
        ),
    )

    @Composable
    private fun DefaultStory() {
        val state = RouteDetailsMockProvider.value("default")
        LaneShadowTheme {
            RouteDetailsScreen(
                state = state,
                onSave = { println("Save tapped") },
                onRide = { println("Ride tapped") },
                onDismiss = { println("Dismissed") },
            )
        }
    }

    @Composable
    private fun MixedWeatherStory() {
        val state = RouteDetailsMockProvider.value("mixed-weather")
        LaneShadowTheme {
            RouteDetailsScreen(
                state = state,
                onSave = { println("Save tapped") },
                onRide = { println("Ride tapped") },
                onDismiss = { println("Dismissed") },
            )
        }
    }

    @Composable
    private fun AltRouteStory() {
        val state = RouteDetailsMockProvider.value("alt-route")
        LaneShadowTheme {
            RouteDetailsScreen(
                state = state,
                onSave = { println("Save tapped") },
                onRide = { println("Ride tapped") },
                onDismiss = { println("Dismissed") },
            )
        }
    }
}
