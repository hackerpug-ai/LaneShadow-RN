package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import com.laneshadow.ui.molecules.LSLocationContextBar
import com.laneshadow.ui.molecules.LocationMode
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSLocationContextBarStory {
    val all: List<Story> = listOf(
        moleculeStory(
            id = "molecules.locationcontextbar.default",
            component = "LSLocationContextBar",
            name = "Default (Auto)",
            summary = "Auto-derived location context with trailing AUTO pill.",
        ) {
            LSLocationContextBar(
                location = "Near Santa Cruz, CA",
                mode = LocationMode.Auto,
                onModeChange = {},
            )
        },
        moleculeStory(
            id = "molecules.locationcontextbar.manual",
            component = "LSLocationContextBar",
            name = "Manual Mode",
            summary = "Manual override highlights the trailing mode pill.",
        ) {
            LSLocationContextBar(
                location = "Near Santa Cruz, CA",
                mode = LocationMode.Manual,
                onModeChange = {},
            )
        },
        moleculeStory(
            id = "molecules.locationcontextbar.longLabel",
            component = "LSLocationContextBar",
            name = "Long Location Label",
            summary = "Long location copy stays in the two-pill row.",
        ) {
            LSLocationContextBar(
                location = "Near Big Sur Overlook and Bixby Creek Bridge, California",
                mode = LocationMode.Manual,
                onModeChange = {},
            )
        },
    )
}

private fun moleculeStory(
    id: String,
    component: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = component,
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )
