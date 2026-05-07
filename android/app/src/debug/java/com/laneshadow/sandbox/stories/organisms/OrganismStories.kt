package com.laneshadow.sandbox.stories.organisms

import com.nativesandbox.model.Story

object OrganismStories {
    val all: List<Story> = buildList {
        addAll(LSTopBarStory.all)
        addAll(LSNavBarStory.all)
        addAll(LSSectionHeaderStory.all)
        addAll(LSMapLayerStory.all)
        addAll(LSRouteSheetStory.all)
        addAll(LSSessionsDrawerStory.all)
        addAll(LSRouteCardStory.all)
        addAll(LSNavigatorMessageStory.all)
        addAll(LSInlineErrorCalloutStory.all)
        addAll(LSMapControlsStory.all)
    }
}
