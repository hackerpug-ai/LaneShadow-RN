import LaneShadowTheme
import NativeTheme
import SwiftUI

private struct LSButtonForegroundColorKey: EnvironmentKey {
    static let defaultValue: Color = Theme.shared.colors.onSurface.default
}

public extension EnvironmentValues {
    var lsButtonForegroundColor: Color {
        get { self[LSButtonForegroundColorKey.self] }
        set { self[LSButtonForegroundColorKey.self] = newValue }
    }
}

private struct LSButtonInteractionStateOverrideKey: EnvironmentKey {
    static let defaultValue: LSButtonInteractionState?
        = nil
}

extension EnvironmentValues {
    var lsButtonInteractionStateOverride: LSButtonInteractionState? {
        get { self[LSButtonInteractionStateOverrideKey.self] }
        set { self[LSButtonInteractionStateOverrideKey.self] = newValue }
    }
}

extension View {
    func lsButtonInteractionStateOverride(_ state: LSButtonInteractionState?) -> some View {
        environment(\.lsButtonInteractionStateOverride, state)
    }
}

public enum LSButtonInteractionState: Hashable, Sendable {
    case `default`
    case hover
    case pressed
    case disabled
    case focus
}

public struct LSButtonResolvedTokens: Equatable, Sendable {
    public let background: Color
    public let foreground: Color
    public let border: Color
    public let borderWidth: CGFloat
    public let opacity: CGFloat
    public let focusRing: Color
    public let focusRingWidth: CGFloat
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
    @Environment(\.lsButtonInteractionStateOverride) private var interactionStateOverride

    private let variant: LSButtonVariant
    private let size: LSButtonSize
    private let isHovered: Bool

    public init(variant: LSButtonVariant, size: LSButtonSize = .md, isHovered: Bool = false) {
        self.variant = variant
        self.size = size
        self.isHovered = isHovered
    }

    public func makeBody(configuration: Configuration) -> some View {
        let state = resolvedState(isPressed: configuration.isPressed)
        let tokens = Self.tokens(for: variant, state: state, in: theme)
        let radius = Self.cornerRadius(for: size, in: theme)

        configuration.label
            .font(Self.typography(for: size, in: theme).font)
            .environment(\.lsButtonForegroundColor, tokens.foreground)
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(tokens.background)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(tokens.border, lineWidth: tokens.borderWidth)
            )
            .overlay(alignment: .center) {
                if tokens.focusRingWidth > 0 {
                    RoundedRectangle(
                        cornerRadius: radius + tokens.focusRingWidth,
                        style: .continuous
                    )
                    .stroke(tokens.focusRing, lineWidth: tokens.focusRingWidth)
                    .padding(-tokens.focusRingWidth)
                    .accessibilityIdentifier("lsbutton-focus-ring")
                }
            }
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
        case .hover:
            return hoverTokens(for: variant, in: theme, fallback: base)
        case .pressed:
            return pressedTokens(for: variant, in: theme, fallback: base)
        case .disabled:
            return disabledTokens(for: variant, in: theme, fallback: base)
        case .focus:
            return LSButtonResolvedTokens(
                background: base.background,
                foreground: base.foreground,
                border: base.border,
                borderWidth: base.borderWidth,
                opacity: base.opacity,
                focusRing: focusRingColor(for: variant, in: theme),
                focusRingWidth: focusRingWidth(in: theme)
            )
        }
    }

    public static func metrics(for size: LSButtonSize, in theme: Theme) -> LSButtonMetrics {
        LSButtonMetrics(
            minWidth: theme.touchTarget.minTouchTarget,
            minHeight: theme.control.minHeight,
            horizontalPadding: theme.space.lg
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
        if let interactionStateOverride { return interactionStateOverride }
        if !isEnabled { return .disabled }
        if isPressed { return .pressed }
        if isHovered { return .hover }
        if isFocused { return .focus }
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
        fallback _: LSButtonResolvedTokens
    ) -> LSButtonResolvedTokens {
        switch variant {
        case .primary:
            filled(
                background: theme.colors.primary.pressed
                    ?? theme.colors.accent.pressed
                    ?? theme.colors.primary.default,
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

    private static func hoverTokens(
        for variant: LSButtonVariant,
        in theme: Theme,
        fallback base: LSButtonResolvedTokens
    ) -> LSButtonResolvedTokens {
        switch variant {
        case .primary:
            filled(
                background: theme.colors.primary.hover
                    ?? theme.colors.accent.hover
                    ?? theme.colors.primary.default,
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .secondary:
            bordered(
                background: theme.colors.secondary.hover ?? base.background,
                foreground: theme.colors.onSurface.default,
                in: theme
            )
        case .ghost:
            unbordered(
                background: theme.colors.secondary.hover ?? theme.colors.secondary.default,
                foreground: theme.colors.onSurface.default,
                in: theme
            )
        case .accept:
            filled(
                background: theme.colors.success.hover ?? theme.colors.success.default,
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .destructive:
            filled(
                background: theme.colors.danger.hover ?? theme.colors.danger.default,
                foreground: theme.colors.onPrimary.default,
                in: theme
            )
        case .outline:
            LSButtonResolvedTokens(
                background: theme.colors.secondary.hover ?? theme.colors.secondary.default,
                foreground: theme.colors.onSurface.default,
                border: theme.colors.border.hover ?? theme.colors.border.default,
                borderWidth: theme.borderWidth.thin,
                opacity: 1,
                focusRing: transparent(in: theme),
                focusRingWidth: 0
            )
        }
    }

    private static func disabledTokens(
        for variant: LSButtonVariant,
        in theme: Theme,
        fallback _: LSButtonResolvedTokens
    ) -> LSButtonResolvedTokens {
        switch variant {
        case .primary:
            withOpacity(theme.opacity.disabled, tokens: filled(
                background: theme.colors.primary.disabled ?? theme.colors.secondaryContainer.default,
                foreground: theme.colors.onPrimary.disabled
                    ?? theme.colors.onPrimary.default.opacity(theme.opacity.disabled),
                in: theme
            ))
        case .secondary:
            withOpacity(theme.opacity.disabled, tokens: bordered(
                background: theme.colors.secondary.disabled ?? theme.colors.muted.default,
                foreground: theme.colors.onSurface.disabled
                    ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled),
                in: theme
            ))
        case .ghost:
            withOpacity(theme.opacity.disabled, tokens: unbordered(
                background: transparent(in: theme),
                foreground: theme.colors.onSurface.disabled
                    ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled),
                in: theme
            ))
        case .accept:
            withOpacity(theme.opacity.disabled, tokens: filled(
                background: theme.colors.success.disabled
                    ?? theme.colors.success.default.opacity(theme.opacity.container),
                foreground: theme.colors.onPrimary.disabled
                    ?? theme.colors.onPrimary.default.opacity(theme.opacity.disabled),
                in: theme
            ))
        case .destructive:
            withOpacity(theme.opacity.disabled, tokens: filled(
                background: theme.colors.danger.disabled
                    ?? theme.colors.danger.default.opacity(theme.opacity.container),
                foreground: theme.colors.onPrimary.disabled
                    ?? theme.colors.onPrimary.default.opacity(theme.opacity.disabled),
                in: theme
            ))
        case .outline:
            LSButtonResolvedTokens(
                background: transparent(in: theme),
                foreground: theme.colors.onSurface.disabled
                    ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled),
                border: theme.colors.border.disabled ?? theme.colors.border.default.opacity(theme.opacity.disabled),
                borderWidth: theme.borderWidth.thin,
                opacity: theme.opacity.disabled,
                focusRing: transparent(in: theme),
                focusRingWidth: 0
            )
        }
    }

    private static func filled(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default.opacity(0),
            borderWidth: 0,
            opacity: 1,
            focusRing: transparent(in: theme),
            focusRingWidth: 0
        )
    }

    private static func bordered(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default,
            borderWidth: theme.borderWidth.thin,
            opacity: 1,
            focusRing: transparent(in: theme),
            focusRingWidth: 0
        )
    }

    private static func unbordered(background: Color, foreground: Color, in theme: Theme) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: background,
            foreground: foreground,
            border: theme.colors.border.default.opacity(0),
            borderWidth: 0,
            opacity: 1,
            focusRing: transparent(in: theme),
            focusRingWidth: 0
        )
    }

    private static func focusRingColor(for variant: LSButtonVariant, in theme: Theme) -> Color {
        switch variant {
        case .primary:
            (theme.colors.primary.focus ?? theme.colors.primary.default).opacity(theme.opacity.actionPressed)
        case .secondary, .ghost, .outline:
            (theme.colors.ring.focus ?? theme.colors.ring.default).opacity(theme.opacity.actionIdle)
        case .accept:
            (theme.colors.success.focus ?? theme.colors.success.default).opacity(theme.opacity.actionPressed)
        case .destructive:
            (theme.colors.danger.focus ?? theme.colors.danger.default).opacity(theme.opacity.actionPressed)
        }
    }

    private static func focusRingWidth(in theme: Theme) -> CGFloat {
        max(3, theme.borderWidth.thin * 3)
    }

    private static func withOpacity(_ opacity: CGFloat, tokens: LSButtonResolvedTokens) -> LSButtonResolvedTokens {
        LSButtonResolvedTokens(
            background: tokens.background,
            foreground: tokens.foreground,
            border: tokens.border,
            borderWidth: tokens.borderWidth,
            opacity: opacity,
            focusRing: tokens.focusRing,
            focusRingWidth: tokens.focusRingWidth
        )
    }

    private static func transparent(in theme: Theme) -> Color {
        theme.colors.surface.default.opacity(0)
    }

    private static func animationDuration(in theme: Theme) -> Double {
        Double(theme.motion.duration["fast"] ?? theme.motion.duration["short"] ?? 100) / 1000
    }
}
