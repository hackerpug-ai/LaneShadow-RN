package com.laneshadow.sandbox.stories.templates

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.RouteResultsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.RouteResultsScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * RouteResultsScreen stories for sandbox.
 */
object RouteResultsScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.routeResults.default",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Default",
            summary = "Three polylines with NavigatorMessage and refine chat input.",
            content = { DefaultStory() },
        ),
        Story(
            id = "templates.routeResults.empty",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Empty",
            summary = "No routes found state.",
            content = { EmptyStory() },
        ),
        Story(
            id = "templates.routeResults.overflow",
            tier = ComponentTier.Template,
            component = "RouteResultsScreen",
            name = "Overflow",
            summary = "Many route options.",
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
}
