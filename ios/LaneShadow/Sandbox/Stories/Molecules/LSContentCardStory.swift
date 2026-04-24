import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSContentCardStory {
    static let all: [Story] = [
        Story(
            id: "molecules.contentCard.withImageHeader",
            tier: .molecule,
            component: "LSContentCard",
            name: "With Image Header",
            summary: "Card with an optional media header above title and metadata."
        ) { _ in
            LSContentCard(
                title: "Wasatch Crest Trail",
                subtitle: "42 mi · 1h 12m",
                metadata: ["3,400 ft gain", "Last ridden Apr 18"],
                chips: ["Best Route", "Alpine"],
                header: AnyView(imageHeader),
                actions: AnyView(
                    HStack(spacing: Theme.shared.space.sm) {
                        LSButton("Ride This", variant: .primary, action: {})
                        LSButton("Save", variant: .ghost, action: {})
                    }
                )
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.contentCard.titleOnly",
            tier: .molecule,
            component: "LSContentCard",
            name: "Title Only",
            summary: "Minimal title-only card surface."
        ) { _ in
            LSContentCard(title: "Emigration Canyon Climb")
                .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.contentCard.titleSubtitleChips",
            tier: .molecule,
            component: "LSContentCard",
            name: "Title+Subtitle+Chips",
            summary: "Content card body with subtitle, metadata, and chips."
        ) { _ in
            LSContentCard(
                title: "Emigration Canyon Climb",
                subtitle: "28 mi · 1h 04m · Mountain",
                metadata: ["3,400 ft gain", "Last ridden Apr 18"],
                chips: ["Best Route", "Alpine"]
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.contentCard.withActions",
            tier: .molecule,
            component: "LSContentCard",
            name: "With Actions",
            summary: "Card with footer actions rendered beneath metadata."
        ) { _ in
            LSContentCard(
                title: "Route X",
                subtitle: "42 mi · 1h 12m",
                metadata: ["3,400 ft gain"]
            ) {
                HStack(spacing: Theme.shared.space.sm) {
                    LSButton("Ride This", variant: .primary, action: {})
                    LSButton("Save", variant: .outline, action: {})
                }
            }
            .padding(Theme.shared.space.lg)
        },
    ]

    private static var imageHeader: some View {
        ZStack(alignment: .bottomLeading) {
            RoundedRectangle(cornerRadius: Theme.shared.radius.md, style: .continuous)
                .fill(LaneShadowTheme.color.surface.glass)
                .frame(height: Theme.shared.space.xxxxl + Theme.shared.space.md)

            HStack(spacing: Theme.shared.space.xs) {
                LSIcon(name: .route, size: .sm, color: .secondary)
                LSText("Scenic preview", variant: .label.sm, color: .secondary)
            }
            .padding(.horizontal, Theme.shared.space.sm)
            .padding(.vertical, Theme.shared.space.xs)
        }
    }
}
