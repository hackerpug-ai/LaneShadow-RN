package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.IdleScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

/**
 * IdleScreen story for the LaneShadow sandbox.
 *
 * Story ID: templates.idle.default
 * Tier: Template
 *
 * Renders the dormant Navigator IdleScreen with map, greeting overlay,
 * top bar, and chat input with suggestion chips + location badge.
 */
object IdleScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.idle.default",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen (Default)",
            summary = "Dormant Navigator idle screen with map, greeting overlay, top bar, and chat input with 4 suggestion chips + location badge",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("default")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = { /* TODO: Present sessions drawer */ },
                        onSuggestionTap = { chip ->
                            println("Suggestion tapped: ${chip.label}")
                        },
                        onSend = { value ->
                            println("Send: $value")
                        },
                        onCollapse = { /* TODO: Collapse chat */ },
                        onFilter = { /* TODO: Present filters */ },
                        onValueChange = { /* TODO: Update input state */ },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.idle.empty",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen (Empty Suggestions)",
            summary = "Idle screen with no suggestion chips",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("empty")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.idle.overflow",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen (Overflow Chips)",
            summary = "Idle screen with many suggestion chips (tests scrolling)",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("overflow")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.idle.long-copy",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen (Long Copy)",
            summary = "Idle screen with long greeting text (tests text wrapping)",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("longCopy")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        // V01: no-location
        Story(
            id = "templates.idle-screen.v-no-location",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen V01 (No Location)",
            summary = "Copper-bordered 'Tap to set start' pill + dim chat input",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("v-no-location")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        // V02: first-ride
        Story(
            id = "templates.idle-screen.v-first-ride",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen V02 (First Ride)",
            summary = "No favorite pin overlays + onboarding suggestion chips",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("v-first-ride")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        // V03: weather-advisory
        Story(
            id = "templates.idle-screen.v-weather-advisory",
            tier = ComponentTier.Template,
            component = "IdleScreen",
            name = "Idle Screen V03 (Weather Advisory)",
            summary = "Meta row in status.warning + advisory card",
            previewMode = PreviewMode.FullScreen,
            content = {
                val state = IdleMockProvider.value("v-weather-advisory")
                LaneShadowTheme {
                    IdleScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
    )
}
