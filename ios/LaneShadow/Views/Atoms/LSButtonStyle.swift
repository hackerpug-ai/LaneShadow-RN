import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum LSButtonInteractionState: Hashable, Sendable {
    case `default`
    case pressed
    case disabled
    case focused
}

public struct LSButtonResolvedTokens: Equatable, Sendable {
    public let background: Color
    public let foreground: Color
    public let border: Color
    public let borderWidth: CGFloat
    public let opacity: CGFloat
}

public struct LSButtonMetrics: Equatable, Sendable {
    public let minWidth: CGFloat
    public let minHeight: CGFloat
    public let horizontalPadding: CGFloat
}

public struct LSButtonStyle: ButtonStyle {
    @Environment(\.theme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused

    private let variant: LSButtonVariant
    private let size: LSButtonSize

    public init(variant: LSButtonVariant, size: LSButtonSize = .md) {
        self.variant = variant
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        let state = resolvedState(isPressed: configuration.isPressed)
        let tokens = Self.tokens(for: variant, state: state, in: theme)
        let radius = Self.cornerRadius(for: size, in: theme)

        configuration.label
            .font(Self.typography(for: size, in: theme).font)
            .foregroundStyle(tokens.foreground)
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(tokens.background)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(tokens.border, lineWidth: tokens.borderWidth)
            )
            .opacity(tokens.opacity)
            .animation(.easeInOut(duration: Self.animationDuration(in: theme)), value: configuration.isPressed)
    }

    public static func tokens(
        for variant: LSButtonVariant,
        state: LSButtonInteractionState = .default,
        in theme: Theme
    ) -> LSButtonResolvedTokens {
        let base = baseTokens(for: variant, in: theme)

        switch state {
        case .default:
            return base
        case .pressed:
            return pressedTokens(for: variant, in: theme, fallback: base)
        case .disabled:
            return disabledTokens(for: variant, in: theme, fallback: base)
        case .focused:
            return LSButtonResolvedTokens(
                background: base.background,
                foreground: base.foreground,
                border: theme.colors.ring.default,
                borderWidth: max(base.borderWidth, theme.borderWidth.thin),
                opacity: base.opacity
            )
        }
    }

    public static func metrics(for size: LSButtonSize, in theme: Theme) -> LSButtonMetrics {
        let horizontalPadding: CGFloat = switch size {
        case .sm:
            theme.space.md
        case .md:
            theme.space.lg
        case .lg:
            theme.space.xl
        }

        return LSButtonMetrics(
            minWidth: theme.touchTarget.minTouchTarget,
            minHeight: theme.control.minHeight,
            horizontalPadding: horizontalPadding
        )
    }

    public static func cornerRadius(for _: LSButtonSize, in theme: Theme) -> CGFloat {
        theme.radius.md
    }

    public static func typography(for _: LSButtonSize, in theme: Theme) -> TypographyStyle {
        theme.type.label.md
    }

    public static func iconSize(for _: LSButtonSize, in theme: Theme) -> CGFloat {
        theme.iconSize.small
    }

    public static func labelSpacing(in theme: Theme) -> CGFloat {
        theme.space.sm
    }

    private func resolvedState(isPressed: Bool) -> LSButtonInteractionState {
        if !isEnabled { return .disabled }
        if isPressed { return .pressed }
        if isFocused { return .focused }
        return .default
    }

    private static func baseTokens(for variant: LSButtonVariant, in theme: Theme) -> LSButtonResolvedTokens {
        switch variant {
        case .primary:
            filled(background: theme.colors.primary.default, foreground: theme.colors.onPrimary.default, in: theme)
        case .secondary:
            bordered(background: theme.colors.secondary.default, foreground: theme.colors.onSurface.default, in: theme)
        case .ghost:
            unbordered(background: transparent(in: theme), foreground: theme.colors.onSurface.default, in: theme)
        case .accept:
            filled(background: theme.colors.success.default, foreground: theme.colors.onPrimary.default, in: theme)
        case .destructive:
            filled(background: theme.colors.danger.default, foreground: theme.colors.onPrimary.default, in: theme)
        case .outline:
            bordered(background: transparent(in: theme), foreground: theme.colors.onSurface.default, in: theme)
        }
    }

    private static func pressedTokens(
        for variant: LSButtonVariant,
        in theme: Theme,
        fallback: LSButtonResolvedTokens
    ) -> LSButtonResolvedTokens {
        switch variant {
        case .primary:
            filled(
                background: theme.colors.accent.pressed ?? theme.colors.primary.default,
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .secondary:
            bordered(
                background: theme.colors.secondary.pressed ?? theme.colors.secondary.default,
                foreground: theme.colors.onSurface.default,
                in: theme
            )
        case .ghost:
            unbordered(
                background: theme.colors.secondary.default,
                foreground: theme.colors.onSurface.default,
                in: theme
            )
        case .accept:
            filled(
                background: theme.colors.success.default.opacity(theme.opacity.pressedStrong),
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .destructive:
            filled(
                background: theme.colors.danger.default.opacity(theme.opacity.pressedStrong),
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .outline:
            bordered(background: theme.colors.secondary.default, foreground: theme.colors.onSurface.default, in: theme)
        }
    }

    private static func disabledTokens(
        for variant: LSButtonVariant,
        in theme: Theme,
        fallback: LSButtonResolvedTokens
    ) -> LSButtonResolvedTokens {
        switch variant {
        case .ghost, .outline:
            LSButtonResolvedTokens(
                background: fallback.background,
                foreground: fallback.foreground.opacity(theme.opacity.disabled),
                border: fallback.border.opacity(theme.opacity.disabled),
                borderWidth: fallback.borderWidth,
                opacity: theme.opacity.disabled
            )
        case .primary, .secondary, .accept, .destructive:
            LSButtonResolvedTokens(
                background: fallback.background.opacity(theme.opacity.disabled),
                foreground: fallback.foreground.opacity(theme.opacity.disabled),
                border: fallback.border.opacity(theme.opacity.disabled),
                borderWidth: fallback.borderWidth,
                opacity: theme.opacity.disabled
            )
        }
    }

    private static func filled(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default.opacity(0),
            borderWidth: 0,
            opacity: 1
        )
    }

    private static func bordered(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default,
            borderWidth: theme.borderWidth.thin,
            opacity: 1
        )
    }

    private static func unbordered(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default.opacity(0),
            borderWidth: 0,
            opacity: 1
        )
    }

    private static func transparent(in theme: Theme) -> Color {
        theme.colors.surface.default.opacity(0)
    }

    private static func animationDuration(in theme: Theme) -> Double {
        Double(theme.motion.duration["fast"] ?? theme.motion.duration["short"] ?? 100) / 1000
    }
}
