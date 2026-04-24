import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSEmptyStateStories {
    static let all: [Story] = [
        Story(
            id: "molecules.emptystate.with-illustration",
            tier: .molecule,
            component: "LSEmptyState",
            name: "With Illustration",
            summary: "Empty state with icon, title, body, and action button."
        ) { _ in
            EmptyStateWithIllustrationStory()
        },
        Story(
            id: "molecules.emptystate.without-illustration",
            tier: .molecule,
            component: "LSEmptyState",
            name: "Without Illustration",
            summary: "Empty state with title and body only."
        ) { _ in
            EmptyStateWithoutIllustrationStory()
        },
        Story(
            id: "molecules.emptystate.with-action",
            tier: .molecule,
            component: "LSEmptyState",
            name: "With Action",
            summary: "Empty state with primary action button."
        ) { _ in
            EmptyStateWithActionStory()
        },
    ]
}

private struct EmptyStateWithIllustrationStory: View {
    var body: some View {
        MoleculeStoryFrame {
            LSEmptyState(
                icon: .route,
                title: "No routes found",
                body: "Try adjusting your filters or search area to see more routes.",
                action: .primary("Clear Filters") { }
            )
        }
    }
}

private struct EmptyStateWithoutIllustrationStory: View {
    var body: some View {
        MoleculeStoryFrame {
            LSEmptyState(
                title: "All caught up",
                body: "You've viewed all available routes in this area."
            )
        }
    }
}

private struct EmptyStateWithActionStory: View {
    var body: some View {
        MoleculeStoryFrame {
            LSEmptyState(
                icon: .bike,
                title: "No rides yet",
                body: "Record your first ride to see it here.",
                action: .primary("Start a Ride") { }
            )
        }
    }
}
