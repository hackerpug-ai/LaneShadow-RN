import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSTextStories {
    static let all: [Story] = [
        Story(
            id: "atoms.text.swatch",
            tier: .atom,
            component: "LSText",
            name: "Typography Swatch",
            summary: "Cross-family text matrix for opinion, UI, and instrument typography atoms."
        ) { _ in
            LSTextSwatchStory()
        },
    ]
}

private struct LSTextSwatchStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.xl) {
                familySection(
                    title: "Display",
                    variants: TypographyVariant.allDisplay,
                    sample: "Where are we riding today?"
                )

                familySection(
                    title: "Heading",
                    variants: TypographyVariant.allHeading,
                    sample: "Continue toward the overlook"
                )

                familySection(
                    title: "Body",
                    variants: TypographyVariant.allBody,
                    sample: "64 mi  1h 42m  72F"
                )
            }
            .padding(theme.space.lg)
        }
    }

    private func familySection(
        title: String,
        variants: [TypographyVariant],
        sample: String
    ) -> some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            LSText(title, variant: .label.lg, color: .secondary)

            ForEach(variants, id: \.tokenPath) { variant in
                VStack(alignment: .leading, spacing: theme.space.xs) {
                    LSText(sample, variant: variant)
                    LSText(variant.tokenPath, variant: .label.sm, color: .subtle)
                }
                .padding(.vertical, theme.space.xs)
            }
        }
    }
}
