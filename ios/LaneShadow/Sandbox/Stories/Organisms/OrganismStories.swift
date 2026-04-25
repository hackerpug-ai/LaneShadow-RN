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
        return stories
    }()
}
