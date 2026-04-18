import LaneShadowTheme
import SwiftUI

struct ThemeBadge<Label: View>: View {
    @Environment(\.theme) private var theme

    let variant: ThemeBadgeVariant
    let iconName: String?
    let opacity: Double
    let accessibilityLabel: String?
    @ViewBuilder let label: () -> Label

    init(
        variant: ThemeBadgeVariant = .default,
        iconName: String? = nil,
        opacity: Double = 1,
        accessibilityLabel: String? = nil,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.variant = variant
        self.iconName = iconName
        self.opacity = opacity
        self.accessibilityLabel = accessibilityLabel
        self.label = label
    }

    var body: some View {
        HStack(spacing: theme.space.xs) {
            if let iconName {
                ThemeIcon(name: iconName, size: theme.space.sm + 2, color: resolvedColors.foreground)
            }

            label()
                .foregroundStyle(resolvedColors.foreground)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 2)
        .background(resolvedColors.background)
        .overlay {
            Capsule(style: .continuous)
                .stroke(resolvedColors.border ?? .clear, lineWidth: resolvedColors.border == nil ? 0 : 1)
        }
        .clipShape(Capsule(style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel ?? variant.rawValue.capitalized)
    }

    private var resolvedColors: ThemeBadgeResolvedColors {
        ThemeBadgeResolvedColors.resolve(theme: theme, variant: variant, opacity: opacity)
    }
}

enum ThemeBadgeVariant: String, CaseIterable {
    case `default`
    case secondary
    case destructive
    case outline
    case success
    case warning
    case info
}

private struct ThemeBadgeResolvedColors {
    let background: Color
    let foreground: Color
    let border: Color?

    static func resolve(theme: Theme, variant: ThemeBadgeVariant, opacity: Double) -> Self {
        let resolvedOpacity = max(0, min(1, opacity))

        switch variant {
        case .default:
            return .init(
                background: theme.colors.primary.default.opacity(resolvedOpacity),
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .secondary:
            return .init(
                background: theme.colors.secondary.default.opacity(resolvedOpacity),
                foreground: theme.colors.onSecondary.default,
                border: nil
            )
        case .destructive:
            return .init(
                background: theme.colors.danger.default.opacity(resolvedOpacity),
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .outline:
            return .init(
                background: .clear,
                foreground: theme.colors.onSurface.default,
                border: theme.colors.border.default
            )
        case .success:
            return .init(
                background: theme.colors.success.default.opacity(resolvedOpacity),
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .warning:
            return .init(
                background: theme.colors.warning.default.opacity(resolvedOpacity),
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .info:
            return .init(
                background: theme.colors.info.default.opacity(resolvedOpacity),
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        }
    }
}
