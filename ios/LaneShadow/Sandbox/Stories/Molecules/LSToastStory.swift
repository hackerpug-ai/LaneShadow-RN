import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSToastStory {
    static let all: [Story] = [
        story(
            id: "molecules.toast.default",
            name: "Default",
            summary: "Default toast using the overlay surface token.",
            variant: .default,
            message: "Route saved to your library."
        ),
        story(
            id: "molecules.toast.success",
            name: "Success",
            summary: "Success toast using the semantic success status token.",
            variant: .success,
            message: "Ride recorded and synced."
        ),
        story(
            id: "molecules.toast.warning",
            name: "Warning",
            summary: "Warning toast using the semantic warning status token.",
            variant: .warning,
            message: "Low storage remaining."
        ),
        story(
            id: "molecules.toast.error",
            name: "Error",
            summary: "Error toast using the semantic error status token.",
            variant: .error,
            message: "Failed to sync route data."
        ),
    ]

    private static func story(
        id: String,
        name: String,
        summary: String,
        variant: LSToastVariant,
        message: String
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "LSToast",
            name: name,
            summary: summary
        ) { _ in
            LSToastStoryDemo(variant: variant, message: message)
        }
    }
}

private struct LSToastStoryDemo: View {
    @Environment(\.theme) private var theme
    @State private var isPresented = true

    let variant: LSToastVariant
    let message: String

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(LaneShadowTheme.color.surface.primary)
                .overlay {
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        LSText("Overlay feedback", variant: .ui.title.md)
                        LSText(
                            "This story replays the toast after each manual dismissal.",
                            variant: .body.md,
                            color: .secondary
                        )
                    }
                    .padding(theme.space.lg)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }

            VStack(spacing: theme.space.md) {
                LSButton("Replay Toast", variant: .primary) {
                    isPresented = true
                }

                LSToast(
                    message: message,
                    variant: variant,
                    isPresented: $isPresented
                )
            }
            .padding(theme.space.lg)
        }
        .frame(height: 280)
        .padding(theme.space.lg)
    }
}
