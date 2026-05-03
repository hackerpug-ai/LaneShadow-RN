package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.ErrorMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.ErrorScreen

/**
 * Sprint 04 ErrorScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.error-screen.default
 * - templates.error-screen.s02-dark
 * - templates.error-screen.s03-extended
 * - templates.error-screen.s04-recovered
 * - templates.error-screen.v01-offline
 * - templates.error-screen.v02-generic
 */
object Sprint04ErrorStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.error-screen.default",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "Default — Lucia Segment",
            summary = "Error screen with warn-stripe callout showing Lucia segment failure, recovery suggestions, and chat input.",
        ) {
            val state = ErrorMockProvider.value("default")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },

        SandboxStory(
            id = "templates.error-screen.s02-dark",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "S02 — Dark / Storm Gate",
            summary = "Dark mode error with storm gate warning.",
        ) {
            val state = ErrorMockProvider.value("default")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },

        SandboxStory(
            id = "templates.error-screen.s03-extended",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "S03 — Extended",
            summary = "Extended error with detailed recovery suggestions.",
        ) {
            val state = ErrorMockProvider.value("default")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },

        SandboxStory(
            id = "templates.error-screen.s04-recovered",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "S04 — Recovered State",
            summary = "Error screen with recovered state — callout faded to 0.55 opacity, chat field primed on chip tap",
        ) {
            val state = ErrorMockProvider.value("s04-recovered")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },

        SandboxStory(
            id = "templates.error-screen.v01-offline",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "V01 — Offline",
            summary = "Error screen with wifi-off watermark at 0.25 opacity, chat input at 0.7 opacity with disabled buttons",
        ) {
            val state = ErrorMockProvider.value("v01-offline")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },

        SandboxStory(
            id = "templates.error-screen.v02-generic",
            tier = SandboxTier.Template,
            component = "ErrorScreen",
            name = "V02 — Generic Fallback",
            summary = "Generic error fallback for unknown error states.",
        ) {
            val state = ErrorMockProvider.value("empty")
            ErrorScreen(
                state = state,
                onMenuTap = {},
                onSuggestionTap = {},
                onSend = {},
                onCollapse = {},
                onFilter = {},
                onValueChange = {}
            )
        },
    )
}
