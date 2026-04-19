import LaneShadowTheme
import SwiftUI

/// Badge component - Small label or tag with semantic theme styling
///
/// Following the translation matrix specification:
/// - paddingHorizontal: 10 (custom value between sm and md tokens)
/// - paddingVertical: 2 (half of xs token)
/// - borderRadius: full (9999 for pill shape)
/// - Typography: type.label.sm (12sp / 18lh / 600w)
public struct Badge: View {

    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let text: String
    private let variant: BadgeVariant
    private let icon: String?
    private let opacity: Double

    // MARK: - Initialization

    /// Creates a Badge with the given text and optional styling
    /// - Parameters:
    ///   - text: The text to display
    ///   - variant: The color variant (default is .default)
    ///   - icon: Optional icon name to display
    ///   - opacity: Opacity value (default is 1.0)
    public init(
        _ text: String,
        variant: BadgeVariant = .default,
        icon: String? = nil,
        opacity: Double = 1.0
    ) {
        self.text = text
        self.variant = variant
        self.icon = icon
        self.opacity = opacity
    }

    // MARK: - Body

    public var body: some View {
        HStack(spacing: theme.space.xs) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundStyle(resolvedColors.foreground)
            }

            Text(text)
                .font(.system(size: theme.type.label.sm.fontSize, weight: .semibold))
                .foregroundStyle(resolvedColors.foreground)
        }
        .padding(.horizontal, 10) // Matrix: paddingHorizontal = 10
        .padding(.vertical, 2)   // Matrix: paddingVertical = 2
        .background(resolvedColors.background)
        .clipShape(Capsule(style: .continuous)) // Matrix: borderRadius = full
        .overlay {
            // Border for outline variant
            if resolvedColors.border != nil {
                Capsule(style: .continuous)
                    .stroke(resolvedColors.border!, lineWidth: 1) // Matrix: borderWidth = 1
            }
        }
        .opacity(opacity) // Matrix: opacity prop support
        .accessibilityElement(children: .combine)
        .accessibilityLabel(text)
    }

    // MARK: - Private Helpers

    private var resolvedColors: BadgeResolvedColors {
        BadgeResolvedColors.resolve(theme: theme, variant: variant)
    }
}

// MARK: - BadgeVariant

/// Badge color variants matching the translation matrix
public enum BadgeVariant: String, CaseIterable {
    case `default`
    case secondary
    case destructive
    case outline
    case success
    case warning
    case info
}

// MARK: - BadgeResolvedColors

private struct BadgeResolvedColors {
    let background: Color
    let foreground: Color
    let border: Color?

    static func resolve(theme: Theme, variant: BadgeVariant) -> Self {
        switch variant {
        case .default:
            return Self(
                background: theme.colors.primary.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .secondary:
            return Self(
                background: theme.colors.secondary.default,
                foreground: theme.colors.onSecondary.default,
                border: nil
            )
        case .destructive:
            return Self(
                background: theme.colors.danger.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .outline:
            return Self(
                background: .clear,
                foreground: theme.colors.onSurface.default,
                border: theme.colors.border.default
            )
        case .success:
            return Self(
                background: theme.colors.success.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .warning:
            return Self(
                background: theme.colors.warning.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .info:
            return Self(
                background: theme.colors.info.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        }
    }
}

// MARK: - Preview

#Preview("Default") {
    Badge("Default")
        .laneShadowTheme()
}

#Preview("Secondary") {
    Badge("Secondary", variant: .secondary)
        .laneShadowTheme()
}

#Preview("Destructive") {
    Badge("Destructive", variant: .destructive)
        .laneShadowTheme()
}

#Preview("Outline") {
    Badge("Outline", variant: .outline)
        .laneShadowTheme()
}

#Preview("Success") {
    Badge("Success", variant: .success)
        .laneShadowTheme()
}

#Preview("Warning") {
    Badge("Warning", variant: .warning)
        .laneShadowTheme()
}

#Preview("Info") {
    Badge("Info", variant: .info)
        .laneShadowTheme()
}

#Preview("With Icon") {
    Badge("New", variant: .success, icon: "checkmark.circle.fill")
        .laneShadowTheme()
}

#Preview("With Opacity") {
    VStack(spacing: 8) {
        Badge("100% opacity", variant: .default, opacity: 1.0)
        Badge("75% opacity", variant: .default, opacity: 0.75)
        Badge("50% opacity", variant: .default, opacity: 0.5)
        Badge("25% opacity", variant: .default, opacity: 0.25)
    }
    .laneShadowTheme()
}
