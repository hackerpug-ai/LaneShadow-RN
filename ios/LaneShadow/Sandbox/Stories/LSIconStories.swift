import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSIconStories {
    static let all: [Story] = [
        Story(
            id: "atoms.icon.catalog",
            tier: .atom,
            component: "LSIcon",
            name: "Catalog",
            summary: "Design-owned icon catalog rendered across all tokenized sizes."
        ) { _ in
            LSIconCatalogStory()
        },

        Story(
            id: "atoms.icon.colorOverrides",
            tier: .atom,
            component: "LSIcon",
            name: "Color Overrides",
            summary: "Icon foreground colors resolved through typed content and signal tokens."
        ) { _ in
            LSIconColorOverridesStory()
        },
    ]
}

private struct LSIconCatalogStory: View {
    @Environment(\.theme) private var theme

    private let columns = [
        GridItem(.adaptive(minimum: 84), spacing: 0),
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: theme.space.md) {
                ForEach(IconName.canonicalCases, id: \.rawValue) { name in
                    VStack(spacing: theme.space.sm) {
                        HStack(spacing: theme.space.xs) {
                            ForEach(IconSize.allCases, id: \.self) { size in
                                LSIcon(name: name, size: size)
                            }
                        }
                        LSText(name.rawValue, variant: .label.sm, color: .subtle)
                    }
                    .padding(theme.space.sm)
                }
            }
            .padding(theme.space.lg)
        }
    }
}

private struct LSIconColorOverridesStory: View {
    @Environment(\.theme) private var theme

    private let samples: [(IconName, IconContentColor)] = [
        (.compass, .primary),
        (.route, .secondary),
        (.layers, .tertiary),
        (.bookmark, .subtle),
        (.starFill, .signal),
        (.send, .onSignal),
    ]

    var body: some View {
        HStack(spacing: theme.space.lg) {
            ForEach(samples, id: \.0.rawValue) { name, color in
                LSIcon(name: name, size: .lg, color: color)
                    .padding(theme.space.sm)
                    .background(
                        RoundedRectangle(cornerRadius: theme.radius.sm)
                            .fill(color == .onSignal ? theme.colors.primary.default : theme.colors.card.default)
                    )
            }
        }
        .padding(theme.space.lg)
    }
}
