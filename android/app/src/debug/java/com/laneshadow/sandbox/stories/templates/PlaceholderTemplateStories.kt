package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Placeholder template stories.
 *
 * This is a temporary placeholder until UC-SCR-01 through UC-SCR-06
 * populate this tier with real screen stories.
 */
object PlaceholderTemplateStories {
    val all: List<Story> = listOf(
        Story(
            id = "templates.placeholder.comingSoon",
            tier = ComponentTier.Template,
            component = "Placeholder",
            name = "Template Stories Coming Soon",
            summary = "Template screen stories will be added in UC-SCR-01 through UC-SCR-06",
            content = {
                Box(modifier = Modifier.fillMaxSize()) {
                    Text("Template screen stories coming soon")
                }
            }
        ),
    )
}
