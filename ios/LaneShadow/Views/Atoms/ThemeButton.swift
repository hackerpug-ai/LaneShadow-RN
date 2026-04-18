import LaneShadowTheme
import SwiftUI

struct ThemeButton: View {
    @Environment(\.theme) private var theme

    let title: String
    let action: () -> Void
    let variant: ThemeButtonVariant
    let size: ThemeButtonSize
    let iconName: String?
    let iconPosition: ThemeButtonIconPosition
    let isEnabled: Bool
    let isLoading: Bool
    let accessibilityLabel: String?

    init(
        _ title: String,
        variant: ThemeButtonVariant = .default,
        size: ThemeButtonSize = .md,
        iconName: String? = nil,
        iconPosition: ThemeButtonIconPosition = .leading,
        isEnabled: Bool = true,
        isLoading: Bool = false,
        accessibilityLabel: String? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.action = action
        self.variant = variant
        self.size = size
        self.iconName = iconName
        self.iconPosition = iconPosition
        self.isEnabled = isEnabled
        self.isLoading = isLoading
        self.accessibilityLabel = accessibilityLabel
    }

    var body: some View {
        let colors = resolvedColors

        Button(action: action) {
            HStack(spacing: theme.space.sm) {
                if isLoading {
                    ProgressView()
                        .tint(colors.foreground)
                } else {
                    if let iconName, iconPosition == .leading {
                        ThemeIcon(name: iconName, size: size.iconSize(in: theme), color: colors.foreground)
                    }

                    ThemeText(title, variant: size.labelVariant, color: colors.foreground)
                        .lineLimit(1)

                    if let iconName, iconPosition == .trailing {
                        ThemeIcon(name: iconName, size: size.iconSize(in: theme), color: colors.foreground)
                    }
                }
            }
            .frame(maxWidth: size == .icon ? size.height(in: theme) : .infinity)
            .frame(minHeight: size.height(in: theme))
            .padding(.horizontal, size.horizontalPadding(in: theme))
        }
        .buttonStyle(
            ThemeButtonStyle(
                variant: variant,
                size: size,
                isEnabled: isEnabled,
                isLoading: isLoading
            )
        )
        .disabled(!isEnabled || isLoading)
        .accessibilityLabel(accessibilityLabel ?? title)
    }

    private var resolvedColors: ThemeButtonResolvedColors {
        ThemeButtonResolvedColors.resolve(
            theme: theme,
            variant: variant,
            isEnabled: isEnabled
        )
    }
}

enum ThemeButtonVariant: String, CaseIterable {
    case `default`
    case secondary
    case outline
    case ghost
    case destructive
    case link
    case glass
}

enum ThemeButtonSize: String, CaseIterable {
    case sm
    case md
    case lg
    case xl
    case xxl
    case icon

    fileprivate func height(in theme: Theme) -> CGFloat {
        switch self {
        case .sm: theme.space.xl + theme.space.md
        case .md, .icon: theme.space.xxl + theme.space.sm
        case .lg: theme.space.xxl + theme.space.md
        case .xl: theme.space.xxxl
        case .xxl: theme.space.xxxxl - theme.space.sm
        }
    }

    fileprivate func horizontalPadding(in theme: Theme) -> CGFloat {
        switch self {
        case .sm: theme.space.md
        case .md: theme.space.lg
        case .lg: theme.space.xxl
        case .xl, .xxl: theme.space.lg
        case .icon: 0
        }
    }

    fileprivate func cornerRadius(in theme: Theme) -> CGFloat {
        switch self {
        case .icon: theme.radius.full
        case .xl: theme.radius.lg
        case .xxl: theme.radius.xl
        default: theme.radius.md
        }
    }

    fileprivate func iconSize(in theme: Theme) -> CGFloat {
        self == .icon ? theme.space.md : theme.space.lg
    }

    fileprivate var labelVariant: ThemeTextVariant {
        switch self {
        case .sm: .labelSm
        case .md, .icon: .labelMd
        case .lg, .xl, .xxl: .labelLg
        }
    }
}

enum ThemeButtonIconPosition: String, CaseIterable {
    case leading
    case trailing
}

private struct ThemeButtonResolvedColors {
    let background: Color
    let foreground: Color
    let border: Color?

    static func resolve(theme: Theme, variant: ThemeButtonVariant, isEnabled: Bool) -> Self {
        if !isEnabled {
            switch variant {
            case .secondary:
                return .init(
                    background: theme.colors.secondary.disabled ?? theme.colors.secondary.default,
                    foreground: theme.colors.onSecondary.default,
                    border: nil
                )
            case .outline:
                return .init(
                    background: theme.colors.background.default,
                    foreground: theme.colors.onSurface.disabled ?? theme.colors.onSurface.default,
                    border: theme.colors.border.default
                )
            case .ghost, .link:
                return .init(
                    background: .clear,
                    foreground: theme.colors.onSurface.disabled ?? theme.colors.onSurface.default,
                    border: nil
                )
            case .destructive:
                return .init(
                    background: theme.colors.danger.disabled ?? theme.colors.danger.default,
                    foreground: theme.colors.onPrimary.default,
                    border: nil
                )
            case .glass:
                return .init(
                    background: theme.colors.surfaceVariant.disabled ?? theme.colors.surfaceVariant.default,
                    foreground: theme.colors.onSurface.disabled ?? theme.colors.onSurface.default,
                    border: theme.colors.border.default
                )
            case .default:
                return .init(
                    background: theme.colors.primary.disabled ?? theme.colors.primary.default,
                    foreground: theme.colors.onPrimary.default,
                    border: nil
                )
            }
        }

        switch variant {
        case .default:
            return .init(
                background: theme.colors.primary.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .secondary:
            return .init(
                background: theme.colors.secondary.default,
                foreground: theme.colors.onSecondary.default,
                border: nil
            )
        case .outline:
            return .init(
                background: theme.colors.background.default,
                foreground: theme.colors.onSurface.default,
                border: theme.colors.border.default
            )
        case .ghost:
            return .init(background: .clear, foreground: theme.colors.onSurface.default, border: nil)
        case .destructive:
            return .init(
                background: theme.colors.danger.default,
                foreground: theme.colors.onPrimary.default,
                border: nil
            )
        case .link:
            return .init(background: .clear, foreground: theme.colors.primary.default, border: nil)
        case .glass:
            return .init(
                background: theme.colors.surfaceVariant.default.opacity(0.88),
                foreground: theme.colors.onSurface.default,
                border: theme.colors.border.default
            )
        }
    }
}

private struct ThemeButtonStyle: ButtonStyle {
    @Environment(\.theme) private var theme

    let variant: ThemeButtonVariant
    let size: ThemeButtonSize
    let isEnabled: Bool
    let isLoading: Bool

    func makeBody(configuration: Configuration) -> some View {
        let colors = ThemeButtonResolvedColors.resolve(theme: theme, variant: variant, isEnabled: isEnabled)

        return configuration.label
            .background(colors.background)
            .overlay {
                RoundedRectangle(cornerRadius: size.cornerRadius(in: theme), style: .continuous)
                    .stroke(colors.border ?? .clear, lineWidth: colors.border == nil ? 0 : 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: size.cornerRadius(in: theme), style: .continuous))
            .opacity(configuration.isPressed ? 0.9 : (isEnabled ? 1 : 0.72))
            .scaleEffect(configuration.isPressed && !isLoading ? 0.98 : 1)
            .animation(.easeInOut(duration: 0.16), value: configuration.isPressed)
    }
}
