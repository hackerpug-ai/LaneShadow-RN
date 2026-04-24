package com.laneshadow.sandbox.stories.molecules

import com.nativesandbox.model.Story

object MoleculesStories {
    val all: List<Story> =
        LSPillSemanticsStory.all +
            LSContentCardStory.all +
            LSListRowStory.all +
            LSLocationContextBarStory.all +
            LSRouteAttachmentCardStory.all
}
