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
            id = "templates.route-details.s03-dark",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "S03 Dark",
            summary = "Dark theme variant.",
            previewMode = PreviewMode.FullScreen,
            content = { S03DarkStory() },
        ),
        Story(
            id = "templates.route-details.s04-medium",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "S04 Medium",
            summary = "Medium sheet detent variant.",
            previewMode = PreviewMode.FullScreen,
            content = { S04MediumStory() },
        ),
        Story(
            id = "templates.route-details.s05-dismissing",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "S05 Dismissing",
            summary = "Dismissing state with copper stripe flash.",
            previewMode = PreviewMode.FullScreen,
            content = { S05DismissingStory() },
        ),
        Story(
            id = "templates.route-details.v01-saved",
            tier = ComponentTier.Template,
            component = "RouteDetailsScreen",
            name = "V01 Saved",
            summary = "Saved state with toast, Save button flip, and LSSavedPill.",
            previewMode = PreviewMode.FullScreen,
            content = { V01SavedStory() },
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

    @Composable
    private fun S03DarkStory() {
        val state = RouteDetailsMockProvider.value("s03-dark")
        // Note: Dark theme is controlled by sandbox theme settings
        // The state.darkTheme = true flag can be used by UI components
        // to adjust their rendering when in dark mode
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
    private fun S04MediumStory() {
        val state = RouteDetailsMockProvider.value("s04-medium")
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
    private fun S05DismissingStory() {
        val state = RouteDetailsMockProvider.value("s05-dismissing")
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
    private fun V01SavedStory() {
        val state = RouteDetailsMockProvider.value("v01-saved")
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
