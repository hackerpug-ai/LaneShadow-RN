import LaneShadowTheme
import SwiftUI

// MARK: - BottomSheetInput Component

/**
 * BottomSheetInput component
 *
 * Text input designed for bottom sheets with proper keyboard handling
 * Following RN wrapper API from react-native/components/ui/input.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Input.md
 *
 * ## Design Tokens Used
 * - Container height: `theme.control.minHeight` (48)
 * - Border radius: `theme.radius.xl` (16)
 * - Border width: `theme.borderWidth.thin` (1) when focused/error
 * - Background: `theme.colors.surface.default`
 * - Focus border: `theme.colors.primary.default`
 * - Error border: `theme.colors.danger.default`
 * - Text color: `theme.colors.onSurface.default`
 * - Placeholder color: `theme.colors.onSurface.subtle`
 * - Input text: `theme.type.body.md.fontSize` (16), regular weight
 * - Label: `theme.type.label.sm.fontSize` (12), medium weight, uppercase, `theme.colors.onSurface.subtle`
 * - Left icon padding: leading=`theme.space.lg` (16), trailing=`theme.space.sm` (8)
 * - Right icon padding: leading=`theme.space.sm` (8), trailing=`theme.space.lg` (16)
 * - Icon size: `theme.iconSize.small` (16) or medium (20)
 * - Input padding: horizontal=`theme.space.sm` (8), vertical=`theme.space.md` (12)
 * - Label gap: `theme.space.xs` (4)
 * - Disabled opacity: 0.5
 *
 * ## Parameters
 * - Parameters:
 *   - value: Current text value (binding)
 *   - placeholder: Optional placeholder text
 *   - label: Optional label text displayed above input
 *   - error: Whether to show error state (default: false)
 *   - editable: Whether the input is editable (default: true)
 *   - leftIcon: Optional SF Symbol name for left icon
 *   - rightIcon: Optional SF Symbol name for right icon
 *   - testID: Optional testing identifier for accessibility
 */
public struct BottomSheetInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let placeholder: String?
    private let label: String?
    private let error: Bool
    private let editable: Bool
    private let leftIcon: String?
    private let rightIcon: String?
    private let testID: String?

    public init(
        value: Binding<String>,
        placeholder: String? = nil,
        label: String? = nil,
        error: Bool = false,
        editable: Bool = true,
        leftIcon: String? = nil,
        rightIcon: String? = nil,
        testID: String? = nil
    ) {
        self._value = value
        self.placeholder = placeholder
        self.label = label
        self.error = error
        self.editable = editable
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
                    .foregroundStyle(theme.colors.onSurface.subtle)
            }

            // Input container
            HStack(spacing: 0) {
                // Left icon (optional)
                if let leftIcon {
                    Image(systemName: leftIcon)
                        .font(.system(size: theme.iconSize.medium))
                        .foregroundStyle(iconColor)
                        .frame(width: theme.iconSize.medium + theme.space.sm)
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
                .foregroundStyle(textColor)
                .focused($isFocused)
                .disabled(!editable)
                .padding(.horizontal, theme.space.sm)
                .padding(.vertical, theme.space.md)
                .frame(minHeight: theme.control.minHeight)

                // Right icon (optional)
                if let rightIcon {
                    Image(systemName: rightIcon)
                        .font(.system(size: theme.iconSize.medium))
                        .foregroundStyle(iconColor)
                        .frame(width: theme.iconSize.medium + theme.space.sm)
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
                        .stroke(borderColor, lineWidth: theme.borderWidth.thin)
                }
            }
            .opacity(editable ? 1.0 : theme.opacity.step05) // 0.5 when disabled
        }
        .accessibilityLabel(label ?? placeholder ?? "Text input")
        .accessibilityAddTraits([.isKeyboardKey])
        .if(!editable) {
            $0.accessibilityAddTraits(.notEnabled)
        }
        .accessibilityIdentifier(testID ?? "bottom-sheet-input")
    }

    // MARK: - Private Computed Properties

    private var shouldShowBorder: Bool {
        isFocused || error
    }

    private var borderColor: Color {
        if error {
            return theme.colors.danger.default
        } else if isFocused {
            return theme.colors.primary.default
        } else {
            return .clear
        }
    }

    private var textColor: Color {
        if editable {
            return theme.colors.onSurface.default
        } else {
            return theme.colors.onSurface.subtle
        }
    }

    private var iconColor: Color {
        if error {
            return theme.colors.danger.default
        } else if isFocused {
            return theme.colors.primary.default
        } else {
            return theme.colors.onSurface.subtle
        }
    }
}

// MARK: - View Conditional Extension

private extension View {
    @ViewBuilder
    func `if`<Content: View>(
        _ condition: Bool,
        transform: (Self) -> Content
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
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Enter text"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Label") {
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Enter text",
        label: "Label"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Value") {
    BottomSheetInput(
        value: .constant("Sample text"),
        placeholder: "Enter text",
        label: "Label"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Error State") {
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Enter text",
        label: "Email",
        error: true
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Disabled") {
    BottomSheetInput(
        value: .constant("Disabled text"),
        placeholder: "Enter text",
        label: "Label",
        editable: false
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Left Icon") {
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Search",
        leftIcon: "magnifyingglass"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Right Icon") {
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Password",
        rightIcon: "eye.slash"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Both Icons") {
    BottomSheetInput(
        value: .constant(""),
        placeholder: "Search",
        label: "Search",
        leftIcon: "magnifyingglass",
        rightIcon: "xmark.circle"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Multiple States") {
    VStack(spacing: theme.space.lg) {
        BottomSheetInput(
            value: .constant(""),
            placeholder: "Default input",
            label: "Default"
        )

        BottomSheetInput(
            value: .constant("Focused text"),
            placeholder: "Enter text",
            label: "Focused"
        )

        BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter email",
            label: "Error",
            error: true
        )

        BottomSheetInput(
            value: .constant("Can't edit"),
            placeholder: "Disabled",
            label: "Disabled",
            editable: false
        )
    }
    .laneShadowTheme()
    .padding()
}
