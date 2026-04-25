package com.laneshadow.sandbox.stories.modifiers

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Modifier tier stories for the LaneShadow sandbox.
 *
 * Modifier stories include:
 * - Compose modifiers
 * - Layout modifiers
 * - Behavior modifiers
 *
 * These are reusable modifiers that can be applied to any composable.
 */
object ModifierStories {
    val all: List<Story> = listOf(
        // Placeholder story to ensure Modifier tier appears in registry
        // Future modifier stories will be added here as needed
        Story(
            id = "modifiers.placeholder.comingSoon",
            tier = ComponentTier.Modifier,
            component = "Placeholder",
            name = "Modifier Stories Coming Soon",
            summary = "Modifier stories will be added in future tasks",
            content = {
                Box(modifier = Modifier.fillMaxSize()) {
                    Text("Modifier stories coming soon")
                }
            }
        ),
    )
}
