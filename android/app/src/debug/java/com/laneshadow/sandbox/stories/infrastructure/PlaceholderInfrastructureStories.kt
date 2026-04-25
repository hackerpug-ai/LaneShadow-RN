package com.laneshadow.sandbox.stories.infrastructure

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Placeholder infrastructure stories.
 *
 * This is a temporary placeholder until UC-SBX-02 and UC-SBX-03
 * populate this tier with theme controller and mock provider stories.
 */
object PlaceholderInfrastructureStories {
    val all: List<Story> = listOf(
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
