package com.laneshadow.sandbox.stories

import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.stories.AppStories as InfrastructureStories
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object AppStories {
    val all: List<Story> =
        (TokenSwatchStories.all + InfrastructureStories.all.map { it.asNativeStory() } + AtomsStories.all)
            .sortedBy(Story::id)
}

private fun SandboxStory.asNativeStory(): Story =
    Story(
        id = id,
        tier = nativeTier(),
        component = component,
        name = name,
        summary = summary,
        content = content,
    )

private fun SandboxStory.nativeTier(): ComponentTier =
    when (tier) {
        SandboxTier.Infrastructure -> ComponentTier.Template
        SandboxTier.Atom -> ComponentTier.Atom
        SandboxTier.Molecule -> ComponentTier.Molecule
        SandboxTier.Organism -> ComponentTier.Organism
        SandboxTier.Template -> ComponentTier.Template
        SandboxTier.Screen -> ComponentTier.Template // Map Screen to Template (native-sandbox doesn't have Screen tier)
    }
