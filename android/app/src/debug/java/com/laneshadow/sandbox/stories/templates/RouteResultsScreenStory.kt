package com.laneshadow.sandbox.stories.templates

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.RouteResultsScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

/**
 * RouteResultsScreen stories for sandbox.
 */
object RouteResultsScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.route-results.default",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Default",
            summary = "Three polylines with NavigatorMessage and refine chat input.",
            previewMode = PreviewMode.FullScreen,
            content = { DefaultStory() },
        ),
        Story(
            id = "templates.route-results.s02-alt-selected",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "S02 Alt Selected",
            summary = "Alt1 route selected (not best), demonstrates alt-selection re-promote.",
            previewMode = PreviewMode.FullScreen,
            content = { S02AltSelectedStory() },
        ),
        Story(
            id = "templates.route-results.s04-refining",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "S04 Refining",
            summary = "Refining mode with scrim overlay, dimmed polylines, hidden callout, primer chips, send button.",
            previewMode = PreviewMode.FullScreen,
            content = { S04RefiningStory() },
        ),
        Story(
            id = "templates.route-results.v03-recall",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "V03 Recall",
            summary = "Recall chip to restore dismissed callout.",
            previewMode = PreviewMode.FullScreen,
            content = { V03RecallStory() },
        ),
        Story(
            id = "templates.routeResults.empty",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Empty",
            summary = "No routes found state.",
            previewMode = PreviewMode.FullScreen,
            content = { EmptyStory() },
        ),
        Story(
            id = "templates.routeResults.overflow",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Overflow",
            summary = "Many route options.",
            previewMode = PreviewMode.FullScreen,
            content = { OverflowStory() },
        ),
    )

    @Composable
    private fun DefaultStory() {
        val state = RouteResultsMockProvider.value("default")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }

    @Composable
    private fun EmptyStory() {
        val state = RouteResultsMockProvider.value("empty")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }

    @Composable
    private fun OverflowStory() {
        val state = RouteResultsMockProvider.value("overflow")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }

    @Composable
    private fun S02AltSelectedStory() {
        val state = RouteResultsMockProvider.value("s02-alt-selected")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }

    @Composable
    private fun S04RefiningStory() {
        val state = RouteResultsMockProvider.value("s04-refining")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }

    @Composable
    private fun V03RecallStory() {
        val state = RouteResultsMockProvider.value("v03-recall")
        LaneShadowTheme {
            RouteResultsScreen(
                state = state,
                onMenuTap = {},
                onRouteCardTap = {},
                onPinTap = {},
                onDismissTap = {},
                onRefineChange = {},
                onRefineSend = {},
                onCollapseTap = {},
                onFilterTap = {},
            )
        }
    }
}
