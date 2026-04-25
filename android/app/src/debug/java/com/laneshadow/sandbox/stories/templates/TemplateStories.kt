package com.laneshadow.sandbox.stories.templates

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Template tier stories for the LaneShadow sandbox.
 *
 * Template stories include:
 * - Screen layouts
 * - Full component compositions
 * - Page templates
 *
 * See UC-SCR-01 through UC-SCR-06 for detailed screen stories.
 */
object TemplateStories {
    val all: List<Story> = listOf(
        // Placeholder story to ensure Template tier appears in registry
        // UC-SCR-01 through UC-SCR-06 will populate this with real screen stories
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
