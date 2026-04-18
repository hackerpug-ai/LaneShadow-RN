import LaneShadowTheme
import SwiftUI

struct ThemeBackground<Content: View>: View {
    @Environment(\.theme) private var theme

    let variant: ThemeBackgroundVariant
    @ViewBuilder let content: () -> Content

    init(
        variant: ThemeBackgroundVariant = .surface,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.variant = variant
        self.content = content
    }

    var body: some View {
        content()
            .padding(theme.space.md)
            .background(variant.color(in: theme))
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
    }
}

enum ThemeBackgroundVariant: String, CaseIterable {
    case surface
    case surfaceVariant
    case background
    case card
    case muted

    func color(in theme: Theme) -> Color {
        switch self {
        case .surface: theme.colors.surface.default
        case .surfaceVariant: theme.colors.surfaceVariant.default
        case .background: theme.colors.background.default
        case .card: theme.colors.card.default
        case .muted: theme.colors.muted.default
        }
    }
}
