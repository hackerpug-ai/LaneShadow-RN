import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Infrastructure stories — Debug/infrastructure stories including self-documentation of the registry itself.
@MainActor
enum InfrastructureStories {
    static let all: [Story] = [
        // Infrastructure stories for registry self-documentation
        Story(
            id: "infrastructure.registry.parity-manifest",
            tier: .infrastructure,
            component: "ParityManifest",
            name: "Parity Manifest",
            summary: "Cross-platform story parity manifest listing shared, iOS-only, and Android-only story IDs."
        ) { _ in
            ParityManifestStory()
        },
    ]
}

/// View that displays the parity manifest for documentation purposes.
private struct ParityManifestStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.md) {
                LSText("Parity Manifest", variant: .heading.lg)
                LSText(
                    "Cross-platform story ID registry for iOS and Android sandbox parity.",
                    variant: .body.md,
                    color: .secondary
                )

                LSText("Shared Stories", variant: .title.md)
                LSText("Stories available on both iOS and Android platforms.", variant: .body.sm, color: .subtle)

                LSText("iOS-Only Stories", variant: .title.md)
                LSText("Stories exclusive to the iOS platform.", variant: .body.sm, color: .subtle)

                LSText("Android-Only Stories", variant: .title.md)
                LSText("Stories exclusive to the Android platform.", variant: .body.sm, color: .subtle)
            }
            .padding(theme.space.lg)
        }
        .background(theme.colors.surface.default)
    }
}
