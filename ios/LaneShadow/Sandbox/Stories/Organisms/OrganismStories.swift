import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Organism stories — Sprint 05 organism components.
@MainActor
enum OrganismStories {
    static let all: [Story] = {
        var stories: [Story] = []
        stories += LSTopBarStory.all
        stories += LSNavBarStory.all
        stories += LSSectionHeaderStory.all
        stories += LSNavigatorMessageStory.all
        stories += LSInlineErrorCalloutStory.all
        stories += LSMapLayerStory.all
        stories += LSRouteSheetStory.all
        stories += LSSessionsDrawerStory.all
        return stories
    }()
}
