import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSBottomSheetStory {
    static let all: [Story] = [
        story(
            id: "molecules.bottomsheet.small",
            name: "Small",
            summary: "Bottom sheet presented at the 25% detent with overlay surface tokens.",
            detent: .small
        ),
        story(
            id: "molecules.bottomsheet.medium",
            name: "Medium",
            summary: "Bottom sheet presented at the 50% detent for the primary working state.",
            detent: .medium
        ),
        story(
            id: "molecules.bottomsheet.large",
            name: "Large",
            summary: "Bottom sheet presented at the 90% detent for full-detail editing flows.",
            detent: .large
        ),
    ]

    private static func story(
        id: String,
        name: String,
        summary: String,
        detent: LSBottomSheetDetent
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "LSBottomSheet",
            name: name,
            summary: summary
        ) { _ in
            LSBottomSheetStoryDemo(detent: detent)
        }
    }
}

private struct LSBottomSheetStoryDemo: View {
    @Environment(\.theme) private var theme
    @State private var isPresented = false

    let detent: LSBottomSheetDetent

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(LaneShadowTheme.color.surface.primary)
                .overlay {
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        LSText("Map content behind scrim", variant: .label.sm, color: .tertiary)
                        LSText(
                            "Open the sheet to inspect the detent and handle styling.",
                            variant: .body.md,
                            color: .secondary
                        )
                    }
                    .padding(theme.space.lg)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }

            VStack {
                Spacer()

                LSButton("Show Sheet", variant: .primary) {
                    isPresented = true
                }
            }
            .padding(theme.space.lg)

            LSBottomSheet(isPresented: $isPresented, detent: detent) {
                VStack(alignment: .leading, spacing: theme.space.md) {
                    LSText("Route Filters", variant: .title.md)
                    LSText("Choose a preset to refine the ride plan.", variant: .body.md, color: .secondary)
                    LSText("Scenic", variant: .label.md, color: .secondary)
                    LSText("Coffee stop", variant: .label.md, color: .secondary)
                    LSText("Twisty roads", variant: .label.md, color: .secondary)
                }
            }
        }
        .frame(height: 320)
        .padding(theme.space.lg)
    }
}
