package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.SessionsMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.SessionsScreen

/**
 * Sprint 04 SessionsScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.sessions-screen.default
 */
object Sprint04SessionsStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.sessions-screen.default",
            tier = SandboxTier.Template,
            component = "SessionsScreen",
            name = "Default — This Week",
            summary = "Sessions drawer with scrim at 0.35 opacity, 'Rides' header, NEW button, THIS WEEK section, and 5 session rows with Santa Cruz loop marked active",
        ) {
            val state = SessionsMockProvider.value("default")
            SessionsScreen(
                state = state,
                onSelect = {},
                onNew = {},
                onDismiss = {},
                onConfirmNew = {},
                onCancelNew = {}
            )
        },
    )
}
