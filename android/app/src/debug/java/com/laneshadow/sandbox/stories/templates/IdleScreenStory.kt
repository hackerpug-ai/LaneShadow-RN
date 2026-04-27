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
    )
}
