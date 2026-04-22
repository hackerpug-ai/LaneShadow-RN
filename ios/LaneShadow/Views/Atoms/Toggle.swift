import LaneShadowTheme
import SwiftUI

// MARK: - Toggle Component

/*
 * Toggle atom component
 *
 * Following RN wrapper API from react-native/components/ui/toggle.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Toggle.md
 *
 * ## Design Tokens Used
 * - Padding horizontal: theme.space.md (12)
 * - Corner radius: theme.radius.md (8)
 * - Icon spacing: theme.space.xs (8)
 * - Typography: 14pt medium
 * - Colors: theme.colors.accent, theme.colors.onSurface, theme.colors.border
 * - Opacity: 0.7 (idle off), 0.38 (disabled), 0.5 (disabled state)
 * - Border: theme.borderWidth.thin (1) for outline variant
 *
 * ## Parameters
 * - Parameters:
 *   - pressed: Binding to current pressed/on state
 *   - text: Label text to display
 *   - icon: Optional icon view to display
 *   - variant: Visual style (default or outline)
 *   - size: Size variant (small, default, large)
 *   - disabled: Whether toggle is disabled (default: false)
 *   - testID: Test identifier for UI testing
 */

public enum LSToggleVariant {
    case `default`
    case outline
}

public enum LSToggleSize {
    case small // 36pt
    case `default` // 40pt
    case large // 44pt
}

public struct LSToggle: View {
    @Environment(\.theme) private var theme
    @Binding private var pressed: Bool
    private let text: String
    private let icon: (() -> AnyView)?
    private let variant: LSToggleVariant
    private let size: LSToggleSize
    private let disabled: Bool
    private let testID: String?

    // Layout constants
    private let horizontalPadding: CGFloat = 12
    private let iconSpacing: CGFloat = 8
    private let cornerRadius: CGFloat = 8
    private let fontSize: CGFloat = 14

    /// Creates a Toggle
    /// - Parameters:
    ///   - pressed: Binding to current pressed/on state
    ///   - text: Label text to display
    ///   - icon: Optional icon view to display
    ///   - variant: Visual style (default or outline)
    ///   - size: Size variant (small, default, large)
    ///   - disabled: Whether toggle is disabled (default: false)
    ///   - testID: Test identifier for UI testing
    public init(
        pressed: Binding<Bool>,
        text: String,
        icon: (() -> AnyView)? = nil,
        variant: LSToggleVariant = .default,
        size: LSToggleSize = .default,
        disabled: Bool = false,
        testID: String? = nil
    ) {
        _pressed = pressed
        self.text = text
        self.icon = icon
        self.variant = variant
        self.size = size
        self.disabled = disabled
        self.testID = testID
    }

    // MARK: - Computed Properties

    private var height: CGFloat {
        switch size {
        case .small:
            36
        case .default:
            40
        case .large:
            44
        }
    }

    private var backgroundColor: Color {
        if disabled {
            return .clear
        }

        if pressed {
            return theme.colors.accent.default
        }

        return .clear
    }

    private var borderColor: Color? {
        switch variant {
        case .default:
            nil
        case .outline:
            theme.colors.border.default
        }
    }

    private var textColor: Color {
        if disabled {
            return theme.colors.onSurface.default.opacity(0.38)
        }

        if pressed {
            return theme.colors.onSurface.default
        }

        return theme.colors.onSurface.default.opacity(0.7)
    }

    private var iconColor: Color {
        textColor
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            guard !disabled else { return }
            pressed.toggle()
        }) {
            toggleContent
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .accessibilityAddTraits(.isButton)
        .accessibilityValue(pressed ? "1" : "0")
        .accessibilityIdentifier(testID ?? "toggle")
    }

    // MARK: - Toggle Content

    private var toggleContent: some View {
        HStack(spacing: iconSpacing) {
            if let icon {
                icon()
                    .foregroundStyle(iconColor)
            }

            Text(text)
                .font(.system(size: fontSize, weight: .medium))
                .foregroundStyle(textColor)
        }
        .padding(.horizontal, horizontalPadding)
        .frame(height: height)
        .background(backgroundColor)
        .cornerRadius(cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(borderColor ?? .clear, lineWidth: theme.borderWidth.thin)
        )
        .opacity(disabled ? 0.5 : 1.0)
    }
}

// MARK: - Preview

#Preview("Default variant, unchecked") {
    LSToggle(pressed: .constant(false), text: "Toggle")
        .laneShadowTheme()
}

#Preview("Default variant, checked") {
    LSToggle(pressed: .constant(true), text: "Toggle")
        .laneShadowTheme()
}

#Preview("Outline variant, unchecked") {
    LSToggle(pressed: .constant(false), text: "Toggle", variant: .outline)
        .laneShadowTheme()
}

#Preview("Outline variant, checked") {
    LSToggle(pressed: .constant(true), text: "Toggle", variant: .outline)
        .laneShadowTheme()
}

#Preview("Small size") {
    LSToggle(pressed: .constant(false), text: "Small", size: .small)
        .laneShadowTheme()
}

#Preview("Large size") {
    LSToggle(pressed: .constant(false), text: "Large", size: .large)
        .laneShadowTheme()
}

#Preview("With icon") {
    LSToggle(
        pressed: .constant(false),
        text: "With Icon",
        icon: { AnyView(Image(systemName: "star.fill")) }
    )
    .laneShadowTheme()
}

#Preview("Disabled") {
    LSToggle(pressed: .constant(false), text: "Disabled", disabled: true)
        .laneShadowTheme()
}

#Preview("Disabled, pressed") {
    LSToggle(pressed: .constant(true), text: "Disabled", disabled: true)
        .laneShadowTheme()
}

#Preview("Interactive") {
    struct InteractiveToggleDemo: View {
        @State private var isPressed = false

        var body: some View {
            VStack(spacing: 24) {
                LSToggle(pressed: $isPressed, text: "Toggle Me")

                Text("State: \(isPressed ? "Pressed" : "Idle")")
                    .font(.caption)
            }
            .laneShadowTheme()
        }
    }

    return InteractiveToggleDemo()
}

#Preview("All variants") {
    struct AllVariantsDemo: View {
        @State private var toggle1 = false
        @State private var toggle2 = true
        @State private var toggle3 = false
        @State private var toggle4 = false

        var body: some View {
            VStack(spacing: 16) {
                Text("Default Variant")
                    .font(.headline)

                LSToggle(pressed: $toggle1, text: "Idle")
                LSToggle(pressed: $toggle2, text: "Pressed")

                Text("Outline Variant")
                    .font(.headline)
                    .padding(.top)

                LSToggle(pressed: $toggle3, text: "Idle", variant: .outline)
                LSToggle(pressed: .constant(true), text: "Pressed", variant: .outline)

                Text("With Icons")
                    .font(.headline)
                    .padding(.top)

                LSToggle(
                    pressed: $toggle4,
                    text: "Starred",
                    icon: { AnyView(Image(systemName: "star.fill")) }
                )

                Text("Sizes")
                    .font(.headline)
                    .padding(.top)

                HStack(spacing: 12) {
                    LSToggle(pressed: .constant(false), text: "S", size: .small)
                    LSToggle(pressed: .constant(false), text: "M", size: .default)
                    LSToggle(pressed: .constant(false), text: "L", size: .large)
                }

                Text("Disabled")
                    .font(.headline)
                    .padding(.top)

                LSToggle(pressed: .constant(false), text: "Disabled", disabled: true)
                LSToggle(pressed: .constant(true), text: "Disabled", variant: .outline, disabled: true)
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return AllVariantsDemo()
}
