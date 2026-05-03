package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.RouteDetailsScreen

/**
 * Sprint 04 RouteDetailsScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.route-details-screen.default
 * - templates.route-details-screen.s02-mixed-weather
 * - templates.route-details-screen.s03-dark
 * - templates.route-details-screen.s04-medium
 * - templates.route-details-screen.s05-dismissing
 * - templates.route-details-screen.v01-saved
 */
object Sprint04RouteDetailsStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.route-details-screen.default",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "Default — Skyline Spine",
            summary = "Route details with best badge, instrument readout, weather timeline, and Save/Ride actions.",
        ) {
            val state = RouteDetailsMockProvider.value("default")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },

        SandboxStory(
            id = "templates.route-details-screen.s02-mixed-weather",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "Mixed Weather — Coast & Ridge",
            summary = "Route details with mixed weather timeline (clear → wind → rain).",
        ) {
            val state = RouteDetailsMockProvider.value("mixedWeather")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },

        SandboxStory(
            id = "templates.route-details-screen.s03-dark",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "S03 — Dark Mode",
            summary = "Route details in dark mode — all theme tokens resolve to dark variants.",
        ) {
            val state = RouteDetailsMockProvider.value("s03-dark")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },

        SandboxStory(
            id = "templates.route-details-screen.s04-medium",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "S04 — Medium Detent",
            summary = "Route details sheet at medium detent (~0.45) with map and overlay visible.",
        ) {
            val state = RouteDetailsMockProvider.value("s04-medium")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },

        SandboxStory(
            id = "templates.route-details-screen.s05-dismissing",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "S05 — Dismissing Copper Stripe",
            summary = "Copper top-edge stripe gradient flash on dismiss drag past medium detent.",
        ) {
            val state = RouteDetailsMockProvider.value("s05-dismissing")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },

        SandboxStory(
            id = "templates.route-details-screen.v01-saved",
            tier = SandboxTier.Template,
            component = "RouteDetailsScreen",
            name = "V01 — Saved State",
            summary = "Glass+ copper-stripe toast, Save button saved variant, 'Saved' pill beside best badge.",
        ) {
            val state = RouteDetailsMockProvider.value("v01-saved")
            RouteDetailsScreen(
                state = state,
                onSave = {},
                onRide = {},
                onDismiss = {}
            )
        },
    )
}
