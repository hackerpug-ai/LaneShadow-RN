import LaneShadowTheme
import SwiftUI

// MARK: - Button Size Enum

/**
 * Button size variants
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Button.md
 */
public enum ButtonSize {
    case sm
    case `default`
    case lg
    case xl
    case xxl
    case icon
}

// MARK: - Button Variant Enum

/**
 * Button style variants
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Button.md
 */
public enum ButtonVariant {
    case `default`
    case secondary
    case outline
    case ghost
    case destructive
    case link
    case glass
}

// MARK: - Icon Position Enum

/**
 * Icon position within button
 */
public enum IconPosition {
    case left
    case right
}

// MARK: - Button Component

/**
 * Button component
 *
 * Following RN wrapper API from react-native/components/ui/button.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Button.md
 *
 * ## Design Tokens Used
 * - Heights: composed from `theme.space` (sm: 36, default: 40, lg: 44, xl: 48, xxl: 56, icon: 40)
 * - Padding: `theme.space.md/lg/2xl` (12/16/32) based on size
 * - Radius: `theme.radius.md/lg/xl/full` (8/16/24/9999) based on size
 * - Colors: `theme.colors.primary/secondary/danger/background/surfaceVariant/onSurface/onSecondary`
 * - Typography: `theme.type.label.sm` (12pt, medium weight)
 * - Border: `theme.borderWidth.thin` (1)
 * - Opacity: `theme.opacity.disabled` (0.5)
 * - Spacing: `theme.space.sm` (8, for icon gap)
 *
 * ## Parameters
 * - Parameters:
 *   - variant: Style variant (default, secondary, outline, ghost, destructive, link, glass)
 *   - size: Size variant (sm, default, lg, xl, xxl, icon)
 *   - onPress: Action callback when button is pressed
 *   - disabled: Whether button is disabled (default: false)
 *   - loading: Whether button is in loading state (default: false)
 *   - icon: Optional icon view to display
 *   - iconPosition: Position of icon (left or right, default: left)
 *   - accessibilityLabel: Accessibility label for screen readers
 *   - testID: Test identifier for UI testing
 */
public struct LSButton: View {
    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let variant: ButtonVariant
    private let size: ButtonSize
    private let onPress: (() -> Void)?
    private let disabled: Bool
    private let loading: Bool
    private let icon: (() -> AnyView)?
    private let iconPosition: IconPosition
    private let label: String
    private let accessibilityLabel: String?
    private let testID: String?

    public init(
        _ label: String,
        variant: ButtonVariant = .default,
        size: ButtonSize = .default,
        onPress: (() -> Void)? = nil,
        disabled: Bool = false,
        loading: Bool = false,
        icon: (() -> AnyView)? = nil,
        iconPosition: IconPosition = .left,
        accessibilityLabel: String? = nil,
        testID: String? = nil
    ) {
        self.label = label
        self.variant = variant
        self.size = size
        self.onPress = onPress
        self.disabled = disabled
        self.loading = loading
        self.icon = icon
        self.iconPosition = iconPosition
        self.accessibilityLabel = accessibilityLabel
        self.testID = testID
    }

    // MARK: - Layout Computed Properties

    private var height: CGFloat {
        switch size {
        case .sm:
            theme.space.xl + theme.space.md // 24 + 12 = 36
        case .lg:
            theme.space.xxl + theme.space.md // 32 + 12 = 44
        case .xl:
            theme.space.xxxl // 48
        case .xxl:
            theme.space.xxxxl - theme.space.sm // 64 - 8 = 56
        case .icon:
            theme.space.xxl + theme.space.sm // 32 + 8 = 40
        case .default:
            theme.space.xxl + theme.space.sm // 32 + 8 = 40
        }
    }

    private var horizontalPadding: CGFloat {
        if size == .icon { return 0 }
        switch size {
        case .sm:
            return theme.space.md // 12
        case .lg:
            return theme.space.xxl // 32
        case .xl, .xxl:
            return theme.space.lg // 16
        case .icon, .default:
            return theme.space.lg // 16
        }
    }

    private var cornerRadius: CGFloat {
        switch size {
        case .icon:
            theme.radius.full
        case .xxl:
            theme.radius.xl
        case .xl:
            theme.radius.lg
        case .sm, .lg, .default:
            theme.radius.md
        }
    }

    // MARK: - Color Computed Properties

    private var backgroundColor: Color {
        if disabled {
            return backgroundColorForDisabledState
        }

        if isPressed {
            return backgroundColorForPressedState
        }

        return backgroundColorForDefaultState
    }

    private var backgroundColorForDefaultState: Color {
        switch variant {
        case .ghost, .link:
            .clear
        case .glass:
            theme.colors.surfaceVariant.default
        case .secondary:
            theme.colors.secondary.default
        case .destructive:
            theme.colors.danger.default
        case .outline:
            theme.colors.background.default
        case .default:
            theme.colors.primary.default
        }
    }

    private var backgroundColorForPressedState: Color {
        switch variant {
        case .ghost, .link:
            .clear
        case .glass:
            theme.colors.surfaceVariant.pressed ?? theme.colors.surfaceVariant.default
        case .secondary:
            theme.colors.secondary.pressed ?? theme.colors.secondary.default
        case .destructive:
            theme.colors.danger.pressed ?? theme.colors.danger.default
        case .outline:
            theme.colors.accent.pressed ?? theme.colors.accent.default
        case .default:
            theme.colors.primary.pressed ?? theme.colors.primary.default
        }
    }

    private var backgroundColorForDisabledState: Color {
        switch variant {
        case .ghost, .link, .outline:
            theme.colors.background.default
        case .glass:
            theme.colors.surfaceVariant.disabled ?? theme.colors.surfaceVariant.default
        case .secondary:
            theme.colors.secondary.disabled ?? theme.colors.secondary.default
        case .destructive:
            theme.colors.danger.disabled ?? theme.colors.danger.default
        case .default:
            theme.colors.primary.disabled ?? theme.colors.primary.default
        }
    }

    private var foregroundColor: Color {
        if disabled {
            return theme.colors.onSurface.disabled ?? theme.colors.onSurface.default
        }

        if isPressed {
            switch variant {
            case .outline, .ghost:
                return theme.colors.accent.default
            case .link:
                return theme.colors.primary.default
            default:
                return defaultForegroundColor
            }
        }

        return defaultForegroundColor
    }

    private var defaultForegroundColor: Color {
        switch variant {
        case .secondary:
            theme.colors.onSecondary.default ?? theme.colors.onSurface.default
        case .link:
            theme.colors.primary.default
        case .default, .destructive, .glass, .outline, .ghost:
            theme.colors.onSurface.default
        }
    }

    private var borderColor: Color? {
        switch variant {
        case .outline, .glass:
            theme.colors.border.default
        case .default, .secondary, .destructive, .ghost, .link:
            nil
        }
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if loading {
                buttonContent(
                    label: AnyView(
                        HStack(spacing: theme.space.sm) {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: foregroundColor))
                            Text("Loading…")
                        }
                    )
                )
            } else if let icon {
                buttonContent(
                    label: AnyView(
                        HStack(spacing: theme.space.sm) {
                            if iconPosition == .left && size != .icon {
                                icon()
                            }
                            if size != .icon {
                                Text(labelText)
                            }
                            if iconPosition == .right || size == .icon {
                                icon()
                            }
                        }
                    )
                )
            } else {
                buttonContent(
                    label: AnyView(
                        Text(labelText)
                    )
                )
            }
        }
        .disabled(disabled || loading)
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel(accessibilityLabel ?? labelText)
        .accessibilityIdentifier(testID ?? "button")
    }

    // MARK: - Button Content

    @ViewBuilder
    private func buttonContent(label: AnyView) -> some View {
        let isIconOnly = size == .icon

        Button(action: {
            onPress?()
        }) {
            label
                .font(.system(size: theme.type.label.sm.fontSize, weight: .medium))
                .foregroundStyle(foregroundColor)
                .if(variant == .link) { view in
                    view.underline(true)
                }
                .frame(height: height)
                .if(!isIconOnly) { view in
                    view.frame(maxWidth: .infinity)
                }
                .if(isIconOnly) { view in
                    view.frame(width: height)
                }
                .padding(.horizontal, horizontalPadding)
                .background(backgroundColor)
                .cornerRadius(cornerRadius)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(borderColor ?? .clear, lineWidth: theme.borderWidth.thin)
                )
                .opacity((disabled || loading) ? theme.opacity.disabled : 1.0)
                .scaleEffect(isPressed ? 0.98 : 1.0)
                .animation(.easeInOut(duration: 0.1), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !disabled, !loading {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }

    // MARK: - Helpers

    private var labelText: String {
        label
    }
}
