import LaneShadowTheme
import SwiftUI

// MARK: - Caption Input Component

/**
 * Caption input molecule component
 *
 * Multi-line input with action buttons (mentions, AI assist, send)
 * Following React Native component from react-native/components/ui/caption-input.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Text: `theme.colors.onSurface.default`
 *   - Placeholder: `theme.colors.onSurface.subtle`
 *   - Border (default): `theme.colors.border.default` (1pt)
 *   - Border (focused): `theme.colors.primary.default` (2pt)
 *   - Send button: `theme.colors.primary.default`
 * - Layout:
 *   - Corner radius: 16pt
 *   - Padding: 12pt
 *   - TextEditor min height: 80pt (3 lines)
 * - Typography:
 *   - Input text: `theme.type.body.md.fontSize` (16), regular weight
 * - Spacing:
 *   - Action buttons gap: `theme.space.xs` (4)
 *   - Action button size: 36pt x 36pt
 *   - Action button padding: `theme.space.sm` (8)
 * - Focus state: `@FocusState` with border thickness change
 *
 * ## Parameters
 * - value: Current text value (binding)
 * - onSend: Send button callback
 * - placeholder: Placeholder text (default: "Add a caption...")
 * - showMentionButton: Show mention action button (default: true, disabled)
 * - showAIAssist: Show AI assist action button (default: true, disabled)
 * - testID: Optional testing identifier for accessibility
 */
public struct LSCaptionInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let onSend: () -> Void
    private let placeholder: String
    private let showMentionButton: Bool
    private let showAIAssist: Bool
    private let testID: String?

    public init(
        value: Binding<String>,
        onSend: @escaping () -> Void,
        placeholder: String = "Add a caption...",
        showMentionButton: Bool = true,
        showAIAssist: Bool = true,
        testID: String? = nil
    ) {
        _value = value
        self.onSend = onSend
        self.placeholder = placeholder
        self.showMentionButton = showMentionButton
        self.showAIAssist = showAIAssist
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        ZStack(alignment: .bottomTrailing) {
            // Main container
            VStack(alignment: .leading, spacing: 0) {
                // TextEditor with placeholder overlay
                ZStack(alignment: .topLeading) {
                    // Placeholder text (shown when empty)
                    if value.isEmpty, !isFocused {
                        Text(placeholder)
                            .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                            .foregroundStyle(theme.colors.onSurface.subtle)
                            .padding(.horizontal, theme.space.md)
                            .padding(.vertical, theme.space.md)
                            .accessibilityHidden(true)
                    }

                    // TextEditor
                    TextEditor(text: $value)
                        .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.default)
                        .focused($isFocused)
                        .padding(.horizontal, theme.space.md - 4) // Adjust for TextEditor default padding
                        .padding(.vertical, theme.space.md - 4)
                        .padding(.trailing, 120) // Space for action buttons
                        .scrollContentBackground(.hidden)
                        .background(theme.colors.surface.default)
                        .frame(minHeight: 80)
                        .accessibilityLabel(placeholder)
                        .accessibilityIdentifier(testID.map { "\($0)-input" } ?? "caption-input")
                }
                .background(theme.colors.surface.default)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay {
                    // Border overlay for focus/default states
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(borderColor, lineWidth: borderWidth)
                }
            }
            .padding(12)

            // Action buttons overlay (bottom right)
            HStack(spacing: theme.space.xs) {
                // Mention button (disabled for now)
                if showMentionButton {
                    Button(action: {}) {
                        Image(systemName: "at")
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(theme.colors.onSurface.muted ?? theme.colors.onSurface.subtle)
                            .frame(width: 36, height: 36)
                            .background(
                                Circle()
                                    .fill(theme.colors.surface.default)
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(true)
                    .opacity(0.4)
                    .accessibilityLabel("Mentions")
                    .accessibilityIdentifier(testID.map { "\($0)-mention-button" } ?? "caption-input-mention-button")
                }

                // AI assist button (disabled for now)
                if showAIAssist {
                    Button(action: {}) {
                        Image(systemName: "auto.fix")
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(theme.colors.onSurface.muted ?? theme.colors.onSurface.subtle)
                            .frame(width: 36, height: 36)
                            .background(
                                Circle()
                                    .fill(theme.colors.surface.default)
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(true)
                    .opacity(0.4)
                    .accessibilityLabel("AI assist")
                    .accessibilityIdentifier(testID.map { "\($0)-ai-button" } ?? "caption-input-ai-button")
                }

                // Send button
                Button(action: onSend) {
                    Image(systemName: "send")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundStyle(theme.colors.onPrimary.default)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle()
                                .fill(theme.colors.primary.default)
                        )
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel("Send")
                .accessibilityIdentifier(testID.map { "\($0)-send-button" } ?? "caption-input-send-button")
            }
            .padding(.trailing, 20)
            .padding(.bottom, 20)
        }
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Caption input")
    }

    // MARK: - Private Computed Properties

    private var borderColor: Color {
        if isFocused {
            theme.colors.primary.default
        } else {
            theme.colors.border.default
        }
    }

    private var borderWidth: CGFloat {
        if isFocused {
            2
        } else {
            1
        }
    }
}

// MARK: - Preview

#Preview("Default") {
    LSCaptionInput(
        value: .constant(""),
        onSend: { print("Send tapped") }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Text") {
    LSCaptionInput(
        value: .constant("This is a sample caption"),
        onSend: { print("Send tapped") }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Long Text") {
    LSCaptionInput(
        value: .constant("""
            This is a longer caption that demonstrates the multiline capabilities of the caption input component. It should wrap properly and allow scrolling when the content exceeds the minimum height.
            """),
        onSend: { print("Send tapped") }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Custom Placeholder") {
    LSCaptionInput(
        value: .constant(""),
        onSend: { print("Send tapped") },
        placeholder: "Write a comment..."
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Without Action Buttons") {
    LSCaptionInput(
        value: .constant(""),
        onSend: { print("Send tapped") },
        showMentionButton: false,
        showAIAssist: false
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Multiple States") {
    VStack(spacing: 16) {
        LSCaptionInput(
            value: .constant(""),
            onSend: { print("Send 1") }
        )

        LSCaptionInput(
            value: .constant("Some caption text"),
            onSend: { print("Send 2") }
        )

        LSCaptionInput(
            value: .constant("""
                Long caption with multiple lines
                that demonstrates scrolling
                and proper text wrapping.
                """),
            onSend: { print("Send 3") }
        )
    }
    .laneShadowTheme()
    .padding()
}
