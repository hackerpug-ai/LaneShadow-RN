package com.laneshadow.sandbox.stories.organisms

import com.nativesandbox.model.Story

object OrganismStories {
    val all: List<Story> = listOf(
        *LSTopBarStory.all.toTypedArray(),
        *LSNavBarStory.all.toTypedArray(),
        *LSSectionHeaderStory.all.toTypedArray(),
    )
}
