package com.laneshadow.sandbox.stories.molecules

import com.nativesandbox.model.Story

object MoleculesStories {
    val all: List<Story> =
        LSContentCardStory.all +
            LSListRowStory.all +
            LSToolbarStory.all +
            LSNavHeaderStory.all +
            LSBottomSheetStory.all +
            LSToastStory.all +
            LSModalStory.all +
            LSFormFieldStory.all +
            LSAuthProviderButtonStory.all +
            LSTabItemStory.all +
            LSEmptyStateStory.all +
            LSPillSemanticsStory.all +
            LSLocationContextBarStory.all +
            LSRouteAttachmentCardStory.all +
            LSChatInputStory.all +
            LSContextCapsuleStory.all +
            LSIdleHeaderStory.all +
            LSNavigatorMoleculesStory.all
}
