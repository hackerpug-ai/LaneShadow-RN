import LaneShadowTheme
import SwiftUI

// MARK: - Textarea Component

/**
 * Textarea atom component
 *
 * Multiline text input with focus/error states
 * Following RN wrapper API from react-native/components/ui/textarea.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Textarea.md
 *
 * ## Design Tokens Used
 * - Container min height: 80pt
 * - Border radius: `theme.radius.md` (8)
 * - Border width: 1pt default, 2pt focused/error
 * - Background: `theme.colors.surface.default`
 * - Default border: `theme.colors.border.default`
 * - Focus border: `theme.colors.primary.default`
 * - Error border: `theme.colors.danger.default`
 * - Text color: `theme.colors.onSurface.default`
 * - Placeholder color: `theme.colors.onSurface.subtle` with 0.6 opacity
 * - Text font: `theme.type.body.sm.fontSize` (14), regular weight
 * - Padding: horizontal=`theme.space.md` (12), vertical=`theme.space.sm` (8)
 * - Disabled opacity: 0.5
 *
 * ## Parameters
 * - Parameters:
 *   - value: Current text value (binding)
 *   - placeholder: Optional placeholder text
 *   - error: Optional error message (triggers error state)
 *   - disabled: Whether the textarea is disabled (default: false)
 *   - testID: Optional testing identifier for accessibility
 */
public struct LSTextarea: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let placeholder: String
    private let error: String?
    private let disabled: Bool
    private let testID: String?

    public init(
        value: Binding<String>,
        placeholder: String = "",
        error: String? = nil,
        disabled: Bool = false,
        testID: String? = nil
    ) {
        _value = value
        self.placeholder = placeholder
        self.error = error
        self.disabled = disabled
        self.testID = testID
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Textarea container
            ZStack(alignment: .topLeading) {
                // Placeholder text (shown when empty)
                if value.isEmpty && !isFocused {
                    Text(placeholder)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.subtle.opacity(0.6))
                        .padding(.horizontal, theme.space.md)
                        .padding(.vertical, theme.space.sm)
                        .accessibilityHidden(true)
                }

                // Text editor
                TextEditor(text: $value)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .focused($isFocused)
                    .disabled(disabled)
                    .padding(.horizontal, theme.space.md - 4) // Adjust for TextEditor default padding
                    .padding(.vertical, theme.space.sm - 4)
                    .scrollContentBackground(.hidden)
                    .background(theme.colors.surface.default)
                    .frame(minHeight: 80)
                    .accessibilityLabel(placeholder.isEmpty ? "Text area" : placeholder)
                    .accessibilityIdentifier(testID ?? "textarea")
            }
            .background(theme.colors.surface.default)
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
            .overlay {
                // Border overlay for focus/error/default states
                RoundedRectangle(cornerRadius: theme.radius.md)
                    .stroke(borderColor, lineWidth: borderWidth)
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
        .if(disabled) {
            $0.accessibilityAddTraits(.notEnabled)
        }
    }

    // MARK: - Private Computed Properties

    private var hasError: Bool {
        error != nil
    }

    private var borderColor: Color {
        if hasError {
            theme.colors.danger.default
        } else if isFocused {
            theme.colors.primary.default
        } else {
            theme.colors.border.default
        }
    }

    private var borderWidth: CGFloat {
        if hasError || isFocused {
            2
        } else {
            1
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
    LSTextarea(
        value: .constant(""),
        placeholder: "Enter your message"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Value") {
    LSTextarea(
        value: .constant("This is a sample text in the textarea component."),
        placeholder: "Enter your message"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Error State") {
    LSTextarea(
        value: .constant(""),
        placeholder: "Enter your message",
        error: "This field is required"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Disabled") {
    LSTextarea(
        value: .constant("Cannot edit this text"),
        placeholder: "Enter your message",
        disabled: true
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Long Text") {
    LSTextarea(
        value: .constant("""
        This is a longer text that demonstrates the multiline capabilities of the textarea component. It should wrap properly and allow scrolling when the content exceeds the minimum height.
        """),
        placeholder: "Enter your message"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Multiple States") {
    VStack(spacing: 16) {
        LSTextarea(
            value: .constant(""),
            placeholder: "Default textarea"
        )

        LSTextarea(
            value: .constant("Some text here"),
            placeholder: "With value"
        )

        LSTextarea(
            value: .constant(""),
            placeholder: "Error state",
            error: "Field cannot be empty"
        )

        LSTextarea(
            value: .constant("Disabled content"),
            placeholder: "Disabled textarea",
            disabled: true
        )
    }
    .laneShadowTheme()
    .padding()
}
