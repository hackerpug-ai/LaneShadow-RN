import LaneShadowTheme
import SwiftUI

// MARK: - Input Component

/**
 * Input atom component
 *
 * Text input field with focus/error states and optional icons
 * Following RN wrapper API from react-native/components/ui/input.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Input.md
 *
 * ## Design Tokens Used
 * - Container height: 48pt
 * - Border radius: `theme.radius.xl` (16)
 * - Border width: 1pt overlay when focused/error
 * - Background: `theme.colors.surface.default`
 * - Focus border: `theme.colors.primary.default`
 * - Error border: `theme.colors.danger.default`
 * - Text color: `theme.colors.onSurface.default`
 * - Placeholder color: `theme.colors.onSurface.default` with reduced opacity
 * - Input text: `theme.type.body.md.fontSize` (16), regular weight
 * - Label: `theme.type.label.sm.fontSize` (12), medium weight, uppercase, `theme.colors.onSurface.default` with reduced opacity
 * - Left icon padding: leading=`theme.space.lg` (16), trailing=`theme.space.sm` (8)
 * - Right icon padding: leading=`theme.space.sm` (8), trailing=`theme.space.lg` (16)
 * - Icon size: 20pt
 * - Input padding: horizontal=`theme.space.lg` (16)
 * - Label gap: `theme.space.xs` (4)
 * - Disabled opacity: 0.5
 *
 * ## Parameters
 * - Parameters:
 *   - value: Current text value (binding)
 *   - label: Optional label text displayed above input
 *   - placeholder: Optional placeholder text
 *   - error: Optional error message (triggers error state)
 *   - disabled: Whether the input is disabled (default: false)
 *   - leftIcon: Optional SF Symbol name for left icon
 *   - rightIcon: Optional SF Symbol name for right icon
 *   - testID: Optional testing identifier for accessibility
 */
public struct LSInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let label: String?
    private let placeholder: String?
    private let error: String?
    private let disabled: Bool
    private let leftIcon: String?
    private let rightIcon: String?
    private let testID: String?

    public init(
        value: Binding<String>,
        label: String? = nil,
        placeholder: String? = nil,
        error: String? = nil,
        disabled: Bool = false,
        leftIcon: String? = nil,
        rightIcon: String? = nil,
        testID: String? = nil
    ) {
        _value = value
        self.label = label
        self.placeholder = placeholder
        self.error = error
        self.disabled = disabled
        self.leftIcon = leftIcon
        self.rightIcon = rightIcon
        self.testID = testID
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Optional label above input
            if let label {
                Text(label.uppercased())
                    .font(.system(size: theme.type.label.sm.fontSize, weight: .medium))
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                    .padding(.leading, theme.space.xs)
            }

            // Input container
            HStack(spacing: 0) {
                // Left icon (optional)
                if let leftIcon {
                    Image(systemName: leftIcon)
                        .font(.system(size: 20))
                        .foregroundStyle(iconColor)
                        .frame(width: 28)
                        .padding(.leading, theme.space.lg)
                        .padding(.trailing, theme.space.sm)
                }

                // Text field
                TextField(text: $value) {
                    if let placeholder {
                        Text(placeholder)
                    }
                }
                .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.default)
                .focused($isFocused)
                .disabled(disabled)
                .padding(.horizontal, theme.space.sm)
                .frame(height: 48)

                // Right icon (optional)
                if let rightIcon {
                    Image(systemName: rightIcon)
                        .font(.system(size: 20))
                        .foregroundStyle(iconColor)
                        .frame(width: 28)
                        .padding(.leading, theme.space.sm)
                        .padding(.trailing, theme.space.lg)
                }

                // Right padding when no icon
                if rightIcon == nil {
                    Spacer()
                        .frame(width: theme.space.lg)
                }
            }
            .background(theme.colors.surface.default)
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl))
            .overlay {
                // Border overlay for focus/error states
                if shouldShowBorder {
                    RoundedRectangle(cornerRadius: theme.radius.xl)
                        .stroke(borderColor, lineWidth: 1)
                }
            }
            .opacity(disabled ? 0.5 : 1.0)

            // Error message (optional)
            if let error {
                Text(error)
                    .font(.system(size: theme.type.label.sm.fontSize, weight: .regular))
                    .foregroundStyle(theme.colors.danger.default)
                    .padding(.leading, theme.space.xs)
            }
        }
        .accessibilityLabel(label ?? placeholder ?? "Text input")
        .accessibilityAddTraits([.isKeyboardKey])
        .accessibilityIdentifier(testID ?? "input")
    }

    // MARK: - Private Computed Properties

    private var shouldShowBorder: Bool {
        isFocused || hasError
    }

    private var hasError: Bool {
        error != nil
    }

    private var borderColor: Color {
        if hasError {
            theme.colors.danger.default
        } else if isFocused {
            theme.colors.primary.default
        } else {
            .clear
        }
    }

    private var iconColor: Color {
        if hasError {
            theme.colors.danger.default
        } else if isFocused {
            theme.colors.primary.default
        } else {
            theme.colors.onSurface.default.opacity(0.6)
        }
    }
}

// MARK: - View Conditional Extension

private extension View {
    @ViewBuilder
    func `if`(
        _ condition: Bool,
        transform: (Self) -> some View
    ) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - Preview

#Preview("Default") {
    LSInput(
        value: .constant(""),
        placeholder: "Enter text"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Label") {
    LSInput(
        value: .constant(""),
        label: "Label",
        placeholder: "Enter text"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Value") {
    LSInput(
        value: .constant("Sample text"),
        label: "Label",
        placeholder: "Enter text"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Error State") {
    LSInput(
        value: .constant(""),
        label: "Email",
        placeholder: "Enter text",
        error: "Invalid email address"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Disabled") {
    LSInput(
        value: .constant("Disabled text"),
        label: "Label",
        placeholder: "Enter text",
        disabled: true
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Left Icon") {
    LSInput(
        value: .constant(""),
        placeholder: "Search",
        leftIcon: "magnifyingglass"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Right Icon") {
    LSInput(
        value: .constant(""),
        placeholder: "Password",
        rightIcon: "eye.slash"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Both Icons") {
    LSInput(
        value: .constant(""),
        label: "Search",
        placeholder: "Search",
        leftIcon: "magnifyingglass",
        rightIcon: "xmark.circle"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Multiple States") {
    VStack(spacing: 16) {
        LSInput(
            value: .constant(""),
            label: "Default",
            placeholder: "Default input"
        )

        LSInput(
            value: .constant("Focused text"),
            label: "Focused",
            placeholder: "Enter text"
        )

        LSInput(
            value: .constant(""),
            label: "Error",
            placeholder: "Enter email",
            error: "Invalid email address"
        )

        LSInput(
            value: .constant("Can't edit"),
            label: "Disabled",
            placeholder: "Disabled",
            disabled: true
        )
    }
    .laneShadowTheme()
    .padding()
}
