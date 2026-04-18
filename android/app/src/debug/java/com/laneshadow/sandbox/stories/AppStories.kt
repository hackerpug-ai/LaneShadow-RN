package com.laneshadow.sandbox.stories

import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.stories.AppStories as InfrastructureStories
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object AppStories {
    val all: List<Story> =
        (InfrastructureStories.all.map { it.asNativeStory() } + AtomsStories.all)
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
    }
