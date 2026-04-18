package com.laneshadow.ui.sandbox.navigation

import com.laneshadow.ui.sandbox.model.SandboxStory

sealed interface SandboxCatalogDestination {
    data object Catalog : SandboxCatalogDestination

    data class StoryDetail(val storyId: String) : SandboxCatalogDestination
}

object SandboxCatalogNavigation {
    fun destinationForOpenById(storyId: String?, stories: List<SandboxStory>): SandboxCatalogDestination {
        val normalized = storyId?.trim().orEmpty()
        if (normalized.isEmpty()) {
            return SandboxCatalogDestination.Catalog
        }
        return if (stories.any { it.id == normalized }) {
            SandboxCatalogDestination.StoryDetail(storyId = normalized)
        } else {
            SandboxCatalogDestination.Catalog
        }
    }
}
