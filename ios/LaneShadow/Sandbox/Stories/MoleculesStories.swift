import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Molecule stories — Sprint 4 molecule components.
@MainActor
enum MoleculesStories {
    static let all: [Story] = {
        var stories: [Story] = []
        // stories += LSContentCardStory.all
        // stories += LSListRowStory.all
        stories += LSToolbarStory.all
        // stories += LSNavHeaderStory.all
        stories += LSBottomSheetStory.all
        stories += LSToastStory.all
        stories += LSModalStory.all
        stories += LSFormFieldStories.all
        stories += LSTabItemStories.all
        stories += LSEmptyStateStories.all
        // stories += LSPillSemanticsStory.all
        // stories += LSLocationContextBarStory.all
        // stories += LSRouteAttachmentCardStory.all
        stories += LSChatInputStories.all
        // stories += LSNavigatorMoleculesStories.all
        return stories
    }()
}
