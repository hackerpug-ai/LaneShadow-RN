import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSPhaseDotStories {
    static let all: [Story] = [
        Story(
            id: "atoms.phase-dot.pending",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Pending",
            summary: "Hollow phase dot with the pending border treatment."
        ) { _ in
            LSPhaseDotStory(state: .pending)
        },

        Story(
            id: "atoms.phase-dot.active",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Active",
            summary: "Signal-filled phase dot with the recipe-driven pulse ring."
        ) { _ in
            LSPhaseDotStory(state: .active)
        },

        Story(
            id: "atoms.phase-dot.done",
            tier: .atom,
            component: "LSPhaseDot",
            name: "Done",
            summary: "Success-filled phase dot without pulse animation."
        ) { _ in
            LSPhaseDotStory(state: .done)
        },
    ]
}

private struct LSPhaseDotStory: View {
    @Environment(\.theme) private var theme

    let state: PhaseState

    var body: some View {
        VStack(spacing: theme.space.sm) {
            LSPhaseDot(state: state)
            LSText(state.storyLabel, variant: .label.sm, color: .subtle)
        }
        .padding(theme.space.lg)
    }
}

private extension PhaseState {
    var storyLabel: String {
        switch self {
        case .pending:
            "Pending"
        case .active:
            "Active"
        case .done:
            "Done"
        }
    }
}
