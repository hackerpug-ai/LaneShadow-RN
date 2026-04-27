package com.laneshadow.sandbox.stories

import com.laneshadow.sandbox.stories.infrastructure.InfrastructureStories
import com.laneshadow.sandbox.stories.molecules.MoleculesStories
import com.laneshadow.sandbox.stories.modifiers.ModifierStories
import com.laneshadow.sandbox.stories.organisms.OrganismStories
import com.laneshadow.sandbox.stories.templates.TemplateStories
import com.nativesandbox.model.Story

object AppStories {
    val all: List<Story> =
        (
            AtomsStories.all +
                MoleculesStories.all +
                OrganismStories.all +
                TemplateStories.all +
                ModifierStories.all +
                InfrastructureStories.all +
                TokenSwatchStories.all
            )
            .sortedBy(Story::id)
}
