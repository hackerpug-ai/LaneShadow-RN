package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.ErrorMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.ErrorScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * ErrorScreen story for the LaneShadow sandbox.
 *
 * Story ID: templates.error.default
 * Tier: Template
 *
 * Renders the Navigator ErrorScreen with map backdrop,
 * LSInlineErrorCallout (warn-stripe + compass chip + "THE NAVIGATOR" label +
 * opinion-serif body + muted detail + suggestion chips), and recovery chat input.
 */
object ErrorScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.error.default",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (Default)",
            summary = "Navigator error recovery screen with broken segment error, 2 suggestion chips, and recovery chat input",
            content = {
                val state = ErrorMockProvider.value("default")
                LaneShadowTheme {
                    ErrorScreen(
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
            id = "templates.error.network",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (Network Timeout)",
            summary = "Network timeout error with 3 suggestion chips drawn from recent rides",
            content = {
                val state = ErrorMockProvider.value("network")
                LaneShadowTheme {
                    ErrorScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = { chip ->
                            println("Suggestion tapped: ${chip.label}")
                        },
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
            id = "templates.error.impossible",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (Constraint Impossible)",
            summary = "Geographically impossible route error with 3 constraint-relaxation chips",
            content = {
                val state = ErrorMockProvider.value("impossible")
                LaneShadowTheme {
                    ErrorScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = { chip ->
                            println("Suggestion tapped: ${chip.label}")
                        },
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
            id = "templates.error.safety-gate",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (Safety Gate)",
            summary = "Storm-blocked route error with 3 rescheduling chips",
            content = {
                val state = ErrorMockProvider.value("safety-gate")
                LaneShadowTheme {
                    ErrorScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = { chip ->
                            println("Suggestion tapped: ${chip.label}")
                        },
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
            id = "templates.error.long-detail",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (Long Detail)",
            summary = "Error with long detail text (tests text wrapping)",
            content = {
                val state = ErrorMockProvider.value("long-detail")
                LaneShadowTheme {
                    ErrorScreen(
                        state = state,
                        onMenuTap = {},
                        onSuggestionTap = { chip ->
                            println("Suggestion tapped: ${chip.label}")
                        },
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
            id = "templates.error.no-suggestions",
            tier = ComponentTier.Template,
            component = "ErrorScreen",
            name = "Error Screen (No Suggestions)",
            summary = "Generic error with no suggestion chips",
            content = {
                val state = ErrorMockProvider.value("no-suggestions")
                LaneShadowTheme {
                    ErrorScreen(
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
