package com.laneshadow.sandbox.stories.infrastructure

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Infrastructure tier stories for the LaneShadow sandbox.
 *
 * Infrastructure stories include:
 * - Theme controllers
 * - Mock providers
 * - Sandbox utilities
 * - Testing fixtures
 *
 * See UC-SBX-02 and UC-SBX-03 for detailed theme controller and mock provider stories.
 */
object InfrastructureStories {
    val all: List<Story> = listOf(
        // Placeholder story to ensure Infrastructure tier appears in registry
        // UC-SBX-02 and UC-SBX-03 will populate this with:
        // - Theme controller arg controls stories
        // - Mock provider fixtures stories
        Story(
            id = "infrastructure.placeholder.comingSoon",
            tier = ComponentTier.Infrastructure,
            component = "Placeholder",
            name = "Infrastructure Stories Coming Soon",
            summary = "Infrastructure stories (theme controllers, mock providers) will be added in UC-SBX-02 and UC-SBX-03",
            content = {
                Box(modifier = Modifier.fillMaxSize()) {
                    Text("Infrastructure stories coming soon")
                }
            }
        ),
    )
}
