package com.laneshadow.sandbox.stories.modifiers

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Placeholder modifier stories.
 *
 * This is a temporary placeholder until future modifier stories are added.
 */
object PlaceholderModifierStories {
    val all: List<Story> = listOf(
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
