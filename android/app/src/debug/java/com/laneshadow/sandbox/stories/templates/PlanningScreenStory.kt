package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.PlanningMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.PlanningScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

/**
 * PlanningScreen story for the LaneShadow sandbox.
 *
 * Story ID: templates.planning.default
 * Tier: Template
 *
 * Renders the Navigator PlanningScreen with map, sketching polyline animation,
 * phase indicator with pulsing active step, top bar, and disabled chat input
 * showing the rider's prompt with spinner in trailing slot.
 */
object PlanningScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.planning.default",
            tier = ComponentTier.Template,
            component = "PlanningScreen",
            name = "Planning Screen (Default)",
            summary = "Planning screen with 5 phases, active on 'Validating', sketching polyline animation, and thinking spinner in chat input",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = PlanningMockProvider.value("default")
                LaneShadowTheme {
                    PlanningScreen(
                        state = state,
                        onMenuTap = { println("Menu tapped") },
                        onCollapse = { println("Collapse tapped") },
                        onFilter = { println("Filter tapped") },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.planning.empty",
            tier = ComponentTier.Template,
            component = "PlanningScreen",
            name = "Planning Screen (Empty)",
            summary = "Planning screen with no phases",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = PlanningMockProvider.value("empty")
                LaneShadowTheme {
                    PlanningScreen(
                        state = state,
                        onMenuTap = {},
                        onCollapse = {},
                        onFilter = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.planning.overflow",
            tier = ComponentTier.Template,
            component = "PlanningScreen",
            name = "Planning Screen (Overflow Phases)",
            summary = "Planning screen with 8 phases (tests scrolling)",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = PlanningMockProvider.value("overflow")
                LaneShadowTheme {
                    PlanningScreen(
                        state = state,
                        onMenuTap = {},
                        onCollapse = {},
                        onFilter = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.planning.long-copy",
            tier = ComponentTier.Template,
            component = "PlanningScreen",
            name = "Planning Screen (Long Copy)",
            summary = "Planning screen with long phase labels and message (tests text wrapping)",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = PlanningMockProvider.value("long-copy")
                LaneShadowTheme {
                    PlanningScreen(
                        state = state,
                        onMenuTap = {},
                        onCollapse = {},
                        onFilter = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
    )
}
