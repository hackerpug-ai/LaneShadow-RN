import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSScrimStories {
    static let all: [Story] = [
        Story(
            id: "atoms.scrim.default",
            tier: .atom,
            component: "LSScrim",
            name: "Default",
            summary: "Token-backed scrim overlaid on content without intercepting touches."
        ) { _ in
            ScrimStoryCard()
        },

        Story(
            id: "atoms.scrim.opacityHeavy",
            tier: .atom,
            component: "LSScrim",
            name: "Opacity 0.6",
            summary: "Scrim with a heavier token-backed overlay intensity."
        ) { _ in
            ScrimStoryCard(opacity: 0.6)
        },

        Story(
            id: "atoms.scrim.blocking",
            tier: .atom,
            component: "LSScrim",
            name: "Blocking",
            summary: "Blocking scrim that captures taps on behalf of an overlay surface."
        ) { _ in
            ScrimBlockingStory()
        },
    ]
}

private struct ScrimStoryCard: View {
    @Environment(\.theme) private var theme

    var opacity: Double = LSScrim.defaultOpacity
    var blocking: Bool = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .fill(theme.colors.surfaceVariant.default)
                .overlay {
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        Capsule()
                            .fill(theme.colors.primary.default.opacity(0.25))
                            .frame(width: 96, height: 10)
                        Capsule()
                            .fill(theme.colors.onSurface.default.opacity(0.14))
                            .frame(width: 140, height: 8)
                        Capsule()
                            .fill(theme.colors.onSurface.default.opacity(0.14))
                            .frame(width: 112, height: 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(theme.space.lg)
                }

            LSScrim(opacity: opacity, blocking: blocking)
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))

            VStack(alignment: .leading, spacing: theme.space.xs) {
                Text(blocking ? "Blocking overlay" : "Map dimmer")
                    .font(theme.type.title.md.font)
                    .foregroundStyle(theme.colors.onPrimary.default)
                Text("opacity \(opacity.formatted(.number.precision(.fractionLength(2))))")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(theme.colors.onPrimary.default.opacity(0.84))
            }
            .padding(theme.space.lg)
        }
        .frame(height: 220)
        .padding(theme.space.lg)
        .background(theme.colors.background.default)
    }
}

private struct ScrimBlockingStory: View {
    @Environment(\.theme) private var theme
    @State private var dismissCount = 0

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrimStoryCard(opacity: 0.6, blocking: true)

            LSScrim(opacity: 0.6, blocking: true) {
                dismissCount += 1
            }
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
            .padding(theme.space.lg)
            .frame(height: 220)

            VStack(alignment: .leading, spacing: theme.space.sm) {
                Text("Tap scrim to dismiss")
                    .font(theme.type.title.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                Text("Tap count: \(dismissCount)")
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))
            }
            .padding(theme.space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.colors.card.default)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: theme.radius.lg,
                    style: .continuous
                )
            )
            .padding(.horizontal, theme.space.xxxl)
            .padding(.bottom, theme.space.xxxl)
        }
        .background(theme.colors.background.default)
    }
}
