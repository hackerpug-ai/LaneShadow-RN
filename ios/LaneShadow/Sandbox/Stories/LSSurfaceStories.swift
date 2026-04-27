import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSSurfaceStories {
    static let all: [Story] = [
        Story(
            id: "atoms.card.default",
            tier: .atom,
            component: "LSCard",
            name: "Card Default",
            summary: "Elevated card with the default surface tokens."
        ) { _ in
            SurfaceCardDefaultStory()
        },
        Story(
            id: "atoms.card.with-content",
            tier: .atom,
            component: "LSCard",
            name: "Card With Content",
            summary: "Elevated card with richer content composition."
        ) { _ in
            SurfaceCardContentStory()
        },
        Story(
            id: "atoms.panel.default",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Default",
            summary: "Flat panel surface with compact padding."
        ) { _ in
            SurfacePanelDefaultStory()
        },
        Story(
            id: "atoms.panel.nested",
            tier: .atom,
            component: "LSPanel",
            name: "Panel Nested",
            summary: "Nested panel composition inside a card."
        ) { _ in
            SurfacePanelNestedStory()
        },
        Story(
            id: "atoms.glasspanel.chrome",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Chrome",
            summary: "Backdrop-blurred chrome surface."
        ) { _ in
            SurfaceGlassChromeStory()
        },
        Story(
            id: "atoms.glasspanel.callout-signal",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Signal",
            summary: "Glass callout with the signal accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .signal)
        },
        Story(
            id: "atoms.glasspanel.callout-warning",
            tier: .atom,
            component: "LSGlassPanel",
            name: "GlassPanel Callout Warning",
            summary: "Glass callout with the warning accent stripe."
        ) { _ in
            SurfaceGlassCalloutStory(accent: .warning)
        },
    ]
}

private struct SurfaceCardDefaultStory: View {
    var body: some View {
        LSCard {
            LSText("Ride Summary", variant: .title.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfaceCardContentStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                LSText("Favorite Route", variant: .title.md)
                LSText("64 mi  1h 42m  Scenic river loop", variant: .body.md, color: .secondary)
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfacePanelDefaultStory: View {
    var body: some View {
        LSPanel {
            LSText("Panel Default", variant: .body.md)
        }
        .padding(Theme.shared.space.lg)
    }
}

private struct SurfacePanelNestedStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        LSCard {
            VStack(alignment: .leading, spacing: theme.space.md) {
                LSText("Nested Surface", variant: .title.md)
                LSPanel {
                    LSText("Panels stack cleanly inside cards.", variant: .body.md, color: .secondary)
                }
            }
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassChromeStory: View {
    @Environment(\.theme) private var theme

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText("Chrome Surface", variant: .title.md)
                    LSText("Used for HUD and overlay chrome.", variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }
}

private struct SurfaceGlassCalloutStory: View {
    @Environment(\.theme) private var theme

    let accent: AccentColor

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .fill(theme.colors.surfaceVariant.default)
                .frame(height: 180)

            LSGlassPanel(variant: .callout(accent: accent)) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText(title, variant: .title.md)
                    LSText(message, variant: .body.md, color: .secondary)
                }
            }
            .padding(theme.space.lg)
        }
        .padding(theme.space.lg)
    }

    private var title: String {
        switch accent {
        case .signal:
            "Signal Callout"
        case .warning:
            "Warning Callout"
        }
    }

    private var message: String {
        switch accent {
        case .signal:
            "Clear skies. Best conditions for a long ride."
        case .warning:
            "Watch the canyon gusts after 4 PM."
        }
    }
}
