import LaneShadowTheme
import SwiftUI

struct ThemeCard<Content: View>: View {
    @Environment(\.theme) private var theme

    let variant: ThemeCardVariant
    let onPress: (() -> Void)?
    let showBorder: Bool
    @ViewBuilder let content: () -> Content

    init(
        variant: ThemeCardVariant = .default,
        onPress: (() -> Void)? = nil,
        showBorder: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.variant = variant
        self.onPress = onPress
        self.showBorder = showBorder
        self.content = content
    }

    var body: some View {
        Group {
            if let onPress {
                Button(action: onPress) {
                    cardBody
                }
                .buttonStyle(.plain)
            } else {
                cardBody
            }
        }
    }

    private var cardBody: some View {
        let colors = resolvedColors

        return VStack(alignment: .leading, spacing: theme.space.md) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(theme.space.lg)
        .background(colors.background)
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .stroke(colors.border, lineWidth: showBorder ? 1 : 0)
        }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous))
        .shadow(
            color: theme.colors.scrim.default.opacity(variant == .default ? 0.14 : 0.18),
            radius: variant == .default ? 6 : 8,
            x: 0,
            y: 2
        )
        .accessibilityElement(children: .contain)
    }

    private var resolvedColors: ThemeCardResolvedColors {
        ThemeCardResolvedColors.resolve(theme: theme, variant: variant)
    }
}

struct ThemeCardHeader<Content: View>: View {
    @Environment(\.theme) private var theme
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ThemeCardContent<Content: View>: View {
    @Environment(\.theme) private var theme
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ThemeCardTitle: View {
    @Environment(\.theme) private var theme

    let text: String
    let variant: ThemeCardVariant

    init(_ text: String, variant: ThemeCardVariant = .default) {
        self.text = text
        self.variant = variant
    }

    var body: some View {
        ThemeText(text, variant: .titleMd, color: resolvedColors.foreground)
    }

    private var resolvedColors: ThemeCardResolvedColors {
        ThemeCardResolvedColors.resolve(theme: theme, variant: variant)
    }
}

struct ThemeCardDescription: View {
    @Environment(\.theme) private var theme

    let text: String
    let variant: ThemeCardVariant

    init(_ text: String, variant: ThemeCardVariant = .default) {
        self.text = text
        self.variant = variant
    }

    var body: some View {
        ThemeText(text, variant: .bodySm, color: resolvedColors.mutedForeground)
    }

    private var resolvedColors: ThemeCardResolvedColors {
        ThemeCardResolvedColors.resolve(theme: theme, variant: variant)
    }
}

enum ThemeCardVariant: String, CaseIterable {
    case `default`
    case primary
    case success
    case warning
    case danger
}

private struct ThemeCardResolvedColors {
    let background: Color
    let foreground: Color
    let mutedForeground: Color
    let border: Color

    static func resolve(theme: Theme, variant: ThemeCardVariant) -> Self {
        switch variant {
        case .default:
            .init(
                background: theme.colors.card.default,
                foreground: theme.colors.onSurface.default,
                mutedForeground: theme.colors.onSurface.default.opacity(0.72),
                border: theme.colors.border.default
            )
        case .primary:
            .init(
                background: theme.colors.primary.default,
                foreground: theme.colors.onPrimary.default,
                mutedForeground: theme.colors.onPrimary.default.opacity(0.8),
                border: theme.colors.primary.default.opacity(0.4)
            )
        case .success:
            .init(
                background: theme.colors.success.default,
                foreground: theme.colors.onPrimary.default,
                mutedForeground: theme.colors.onPrimary.default.opacity(0.8),
                border: theme.colors.success.default.opacity(0.4)
            )
        case .warning:
            .init(
                background: theme.colors.warningContainer.default,
                foreground: theme.colors.onWarningContainer.default,
                mutedForeground: theme.colors.onWarningContainer.default.opacity(0.8),
                border: theme.colors.warning.default.opacity(0.4)
            )
        case .danger:
            .init(
                background: theme.colors.danger.default,
                foreground: theme.colors.onPrimary.default,
                mutedForeground: theme.colors.onPrimary.default.opacity(0.8),
                border: theme.colors.danger.default.opacity(0.4)
            )
        }
    }
}
