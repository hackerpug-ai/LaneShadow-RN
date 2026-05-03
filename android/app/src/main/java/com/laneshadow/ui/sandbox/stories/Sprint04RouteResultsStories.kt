package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.RouteResultsScreen

/**
 * Sprint 04 RouteResultsScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.route-results-screen.default
 * - templates.route-results-screen.s02-alt-selected
 * - templates.route-results-screen.s03-dark
 * - templates.route-results-screen.s04-refining
 * - templates.route-results-screen.v01-default
 * - templates.route-results-screen.v02-weather-divergent
 * - templates.route-results-screen.v03-recall
 */
object Sprint04RouteResultsStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.route-results-screen.default",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "Default — 3 Routes",
            summary = "Three polylines on map, pinned NavigatorMessage with 3 route attachments (best selected), refine chat input.",
        ) {
            val state = RouteResultsMockProvider.value("default")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.s02-alt-selected",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "S02 — Alt Selected",
            summary = "Alt route (Coastal Highway Classic) selected — polyline promotes from dashed to solid, card border re-tints to alt1 color.",
        ) {
            val state = RouteResultsMockProvider.value("s02-alt-selected")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.s03-dark",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "S03 — Dark Mode",
            summary = "Dark mode variant of default route results.",
        ) {
            val state = RouteResultsMockProvider.value("default")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.s04-refining",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "S04 — Refining Mode",
            summary = "Warm scrim overlay, polylines at 0.4 opacity, hidden callout, three primer chips above chat input, copper send button.",
        ) {
            val state = RouteResultsMockProvider.value("s04-refining")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.v01-default",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "V01 — Default Variant",
            summary = "Base variant with default mock data.",
        ) {
            val state = RouteResultsMockProvider.value("default")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.v02-weather-divergent",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "V02 — Weather Divergent",
            summary = "Weather conditions diverge across routes — storm on coastal, clear inland.",
        ) {
            val state = RouteResultsMockProvider.value("default")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },

        SandboxStory(
            id = "templates.route-results-screen.v03-recall",
            tier = SandboxTier.Template,
            component = "RouteResultsScreen",
            name = "V03 — Recall Chip",
            summary = "Glass Recall pill at message position — tap restores callout visibility.",
        ) {
            val state = RouteResultsMockProvider.value("v03-recall")
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {}
            )
        },
    )
}
