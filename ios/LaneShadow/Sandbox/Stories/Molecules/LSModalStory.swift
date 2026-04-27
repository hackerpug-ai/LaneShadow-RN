import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSModalStory {
    static let all: [Story] = [
        Story(
            id: "molecules.modal.destructive",
            tier: .molecule,
            component: "LSModal",
            name: "Destructive",
            summary: "Destructive confirmation modal composed from LSText and LSButton atoms."
        ) { _ in
            LSModalStoryDemo(
                title: "Delete ride?",
                modalBody: "This action cannot be undone. The route and recorded data will be removed.",
                primary: .destructive("Delete", action: {}),
                secondary: .ghost("Cancel", action: {})
            )
        },
        Story(
            id: "molecules.modal.primary-ghost",
            tier: .molecule,
            component: "LSModal",
            name: "Primary + Ghost",
            summary: "Save-flow modal with a primary confirm button and ghost secondary action."
        ) { _ in
            LSModalStoryDemo(
                title: "Save route before leaving?",
                modalBody: "You have unsaved changes to this route. Save them now to continue where you left off.",
                primary: .primary("Save", action: {}),
                secondary: .ghost("Discard", action: {})
            )
        },
        Story(
            id: "molecules.modal.informational",
            tier: .molecule,
            component: "LSModal",
            name: "Informational",
            summary: "Informational modal with a single primary acknowledgement action."
        ) { _ in
            LSModalStoryDemo(
                title: "Offline map downloaded",
                modalBody: "The Central Coast region is ready for offline use.",
                primary: .primary("Got it", action: {}),
                secondary: nil
            )
        },
    ]
}

private struct LSModalStoryDemo: View {
    @Environment(\.theme) private var theme
    @State private var isPresented = true

    let title: String
    let modalBody: String
    let primary: LSModalAction
    let secondary: LSModalAction?

    var bodyView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(LaneShadowTheme.color.surface.primary)
                .overlay {
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        LSText("Blocking flow", variant: .title.md)
                        LSText("Tap the call-to-action to reopen the modal.", variant: .body.md, color: .secondary)
                    }
                    .padding(theme.space.lg)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }

            VStack {
                Spacer()

                LSButton("Show Modal", variant: .primary) {
                    isPresented = true
                }
            }
            .padding(theme.space.lg)

            LSModal(
                title: title,
                body: modalBody,
                primary: primary,
                secondary: secondary,
                isPresented: $isPresented
            )
        }
        .frame(height: 320)
        .padding(theme.space.lg)
    }

    var body: some View {
        bodyView
    }
}
