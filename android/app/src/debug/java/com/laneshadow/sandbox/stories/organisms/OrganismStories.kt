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
        // LSNavigatorMessageStory and LSInlineErrorCalloutStory disabled due to API issues
        // addAll(LSNavigatorMessageStory.all)
        // addAll(LSInlineErrorCalloutStory.all)
    }
}
