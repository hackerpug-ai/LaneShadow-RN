import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Template stories — Navigator screen templates.
@MainActor
enum TemplateStories {
    static let all: [Story] = {
        var stories: [Story] = []

        // Sprint 6: Navigator screen templates
        stories.append(contentsOf: IdleScreenStory.all)
        stories.append(contentsOf: ErrorScreenStory.all)
        stories.append(contentsOf: RouteResultsScreenStory.all)
        stories.append(contentsOf: SessionsScreenStory.all)

        return stories
    }()
}
