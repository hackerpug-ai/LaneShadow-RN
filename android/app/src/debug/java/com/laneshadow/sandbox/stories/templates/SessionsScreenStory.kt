package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.SessionsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.templates.SessionsScreen
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * SessionsScreen story for the LaneShadow sandbox.
 *
 * Story ID: templates.sessions.default
 * Tier: Template
 *
 * Renders the Navigator SessionsScreen with dimmed map backdrop,
 * 0.35 opacity scrim, and left-anchored drawer showing ride sessions
 * grouped by recency. The active session is highlighted with a
 * signal stripe and tinted background.
 */
object SessionsScreenStory {
    val all: List<Story> = listOf(
        Story(
            id = "templates.sessions.default",
            tier = ComponentTier.Template,
            component = "SessionsScreen",
            name = "Sessions Screen (Default)",
            summary = "Sessions screen with 5 sessions, 1 active (Santa Cruz loop), scrim at 0.35, drawer slides in from left",
            content = {
                val state = SessionsMockProvider.value("default")
                LaneShadowTheme {
                    SessionsScreen(
                        state = state,
                        onSelect = { sessionId -> println("Session selected: $sessionId") },
                        onNew = { println("NEW button tapped") },
                        onDismiss = { println("Scrim tapped, dismissing drawer") },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.sessions.empty",
            tier = ComponentTier.Template,
            component = "SessionsScreen",
            name = "Sessions Screen (Empty)",
            summary = "Sessions screen with no sessions (empty state with compass icon and prose)",
            content = {
                val state = SessionsMockProvider.value("empty")
                LaneShadowTheme {
                    SessionsScreen(
                        state = state,
                        onSelect = { },
                        onNew = { println("NEW button tapped") },
                        onDismiss = { println("Scrim tapped, dismissing drawer") },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.sessions.overflow",
            tier = ComponentTier.Template,
            component = "SessionsScreen",
            name = "Sessions Screen (Overflow)",
            summary = "Sessions screen with 12 sessions (tests scrolling and sticky section labels)",
            content = {
                val state = SessionsMockProvider.value("overflow")
                LaneShadowTheme {
                    SessionsScreen(
                        state = state,
                        onSelect = { sessionId -> println("Session selected: $sessionId") },
                        onNew = { println("NEW button tapped") },
                        onDismiss = { println("Scrim tapped, dismissing drawer") },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
        Story(
            id = "templates.sessions.long-copy",
            tier = ComponentTier.Template,
            component = "SessionsScreen",
            name = "Sessions Screen (Long Copy)",
            summary = "Sessions screen with long titles and previews (tests text wrapping and truncation)",
            content = {
                val state = SessionsMockProvider.value("long-copy")
                LaneShadowTheme {
                    SessionsScreen(
                        state = state,
                        onSelect = { sessionId -> println("Session selected: $sessionId") },
                        onNew = { println("NEW button tapped") },
                        onDismiss = { println("Scrim tapped, dismissing drawer") },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
        ),
    )
}
