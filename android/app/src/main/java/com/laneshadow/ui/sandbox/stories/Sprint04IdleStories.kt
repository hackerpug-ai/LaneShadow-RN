package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.IdleScreen

/**
 * Sprint 04 IdleScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.idle-screen.default
 * - templates.idle-screen.s02-typing-send
 * - templates.idle-screen.s03-dark
 * - templates.idle-screen.s04-filter-sheet
 * - templates.idle-screen.v-first-ride
 * - templates.idle-screen.v-no-location
 * - templates.idle-screen.v-weather-advisory
 */
object Sprint04IdleStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.idle-screen.default",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "Default",
            summary = "Welcome screen with greeting overlay, map, and chat input with suggestions.",
        ) {
            val state = IdleMockProvider.value("default")
            IdleScreen(
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
            id = "templates.idle-screen.s02-typing-send",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "S02 · Typing with Send",
            summary = "User typing in chat input with suggestions visible.",
        ) {
            val state = IdleMockProvider.value("default")
            IdleScreen(
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
            id = "templates.idle-screen.s03-dark",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "S03 · Dark Mode",
            summary = "Dark mode variant of default idle state.",
        ) {
            val state = IdleMockProvider.value("default")
            IdleScreen(
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
            id = "templates.idle-screen.s04-filter-sheet",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "S04 · Filter Sheet",
            summary = "Filter sheet visible with route preferences.",
        ) {
            val state = IdleMockProvider.value("default")
            IdleScreen(
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
            id = "templates.idle-screen.v-first-ride",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "V02 · First Ride",
            summary = "No saved favorites yet — onboarding suggestion chips.",
        ) {
            val state = IdleMockProvider.value("v-first-ride")
            IdleScreen(
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
            id = "templates.idle-screen.v-no-location",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "V01 · No Location",
            summary = "GPS denied — copper-framed 'Tap to set start' pill, dimmed chat input.",
        ) {
            val state = IdleMockProvider.value("v-no-location")
            IdleScreen(
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
            id = "templates.idle-screen.v-weather-advisory",
            tier = SandboxTier.Template,
            component = "IdleScreen",
            name = "V03 · Weather Advisory",
            summary = "Heavy rain — warning meta, advisory card, short/dry suggestions.",
        ) {
            val state = IdleMockProvider.value("v-weather-advisory")
            IdleScreen(
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
