import LaneShadowTheme
import SwiftUI

// MARK: - Floating Search Input Component

/**
 * Floating search input molecule component
 *
 * Search input bar with clear button, loading state, and press-only mode.
 * Following React Native component from react-native/components/ui/floating-search-input.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surfaceVariant.default`
 *   - Border: `theme.colors.border.default`
 *   - Search icon: `theme.colors.onSurface.subtle`
 *   - Clear icon: `theme.colors.onSurface.default`
 *   - Loading indicator: `theme.colors.onSurface.subtle`
 *   - Text: `theme.colors.onSurface.default`
 *   - Placeholder: `theme.colors.onSurface.subtle`
 * - Layout:
 *   - Corner radius: `theme.radius.xl`
 *   - Padding horizontal: `theme.space.md`
 *   - Padding vertical: `theme.space.xs`
 *   - Search icon size: `theme.space.xl`
 *   - Icon margin: `theme.space.sm`
 *   - Right padding (normal): `theme.space['2xl']`
 *   - Right padding (loading): `theme.space['4xl']`
 *   - Clear button size: 18pt
 *   - ProgressView size: `theme.space.md`
 * - Typography:
 *   - Input text: `theme.type.body.md`
 * - States:
 *   - Press opacity: 0.8
 *   - Loading: shows ProgressView + optional cancel button
 *   - Clear button: shown when value.isNotEmpty && !isLoading
 *   - Press-only mode: onPress makes entire component tappable, input non-editable
 *
 * ## Parameters
 * - value: Current input value binding
 * - onChangeText: Text change callback
 * - placeholder: Placeholder text to display
 * - onClear: Clear button callback (optional)
 * - onPress: Press handler for press-only mode (optional, makes input non-editable)
 * - isLoading: Show loading state with ProgressView (default: false)
 * - onCancelLoading: Cancel loading button callback (optional)
 * - testID: Optional testing identifier for accessibility
 */
public struct LSFloatingSearchInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let onChangeText: (String) -> Void
    private let placeholder: String
    private let onClear: (() -> Void)?
    private let onPress: (() -> Void)?
    private let isLoading: Bool
    private let onCancelLoading: (() -> Void)?
    private let testID: String?

    public init(
        value: Binding<String>,
        onChangeText: @escaping (String) -> Void,
        placeholder: String,
        onClear: (() -> Void)? = nil,
        onPress: (() -> Void)? = nil,
        isLoading: Bool = false,
        onCancelLoading: (() -> Void)? = nil,
        testID: String? = nil
    ) {
        _value = value
        self.onChangeText = onChangeText
        self.placeholder = placeholder
        self.onClear = onClear
        self.onPress = onPress
        self.isLoading = isLoading
        self.onCancelLoading = onCancelLoading
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let onPress {
                // Press-only mode: entire component is a button
                Button(action: onPress) {
                    contentView(disabled: true)
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel(placeholder)
                .accessibilityIdentifier(testID ?? "floating-search-input")
            } else {
                // Editable mode: TextField with input
                contentView(disabled: false)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel("Search input")
            }
        }
    }

    // MARK: - Private Views

    private func contentView(disabled: Bool) -> some View {
        HStack(spacing: 0) {
            // Search icon
            Image(systemName: "magnifyingglass")
                .font(.system(size: theme.space.xl, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.subtle)
                .frame(width: theme.space.xl, height: theme.space.xl)
                .padding(.trailing, theme.space.sm)

            // Text input
            ZStack(alignment: .leading) {
                if value.isEmpty, !isFocused {
                    Text(placeholder)
                        .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.subtle)
                        .accessibilityHidden(true)
                }

                TextField("", text: $value)
                    .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .focused($isFocused)
                    .disabled(disabled)
                    .onChange(of: value) { oldValue, newValue in
                        onChangeText(newValue)
                    }
                    .padding(.trailing, rightPadding)
                    .accessibilityLabel(placeholder)
                    .accessibilityIdentifier(testID.map { "\($0)-input" } ?? "floating-search-input-field")
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.xs)
        .background(theme.colors.surfaceVariant.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.xl)
                .stroke(theme.colors.border.default, lineWidth: 1)
        }
        .overlay(alignment: .trailing) {
            rightActionsView
        }
        .padding(.trailing, theme.space.sm)
    }

    @ViewBuilder
    private var rightActionsView: some View {
        if isLoading {
            // Loading state: ProgressView + optional cancel button
            HStack(spacing: theme.space.sm) {
                ProgressView()
                    .scaleEffect(theme.space.md / 20) // Scale to match theme.space.md
                    .accessibilityIdentifier(testID.map { "\($0)-loading" } ?? "floating-search-loading")

                if let onCancelLoading {
                    Button(action: onCancelLoading) {
                        Image(systemName: "xmark")
                            .font(.system(size: 18, weight: .regular))
                            .foregroundStyle(theme.colors.onSurface.default)
                            .frame(width: 32, height: 32)
                            .background(
                                Circle()
                                    .fill(theme.colors.surfaceVariant.default.opacity(0.8))
                            )
                    }
                    .buttonStyle(PressOpacityButtonStyle())
                    .accessibilityLabel("Cancel planning")
                    .accessibilityIdentifier(testID.map { "\($0)-cancel-loading" } ?? "floating-search-cancel-loading")
                }
            }
            .padding(.trailing, theme.space.sm)
        } else if let onClear, !value.isEmpty {
            // Clear button
            Button(action: onClear) {
                Image(systemName: "xmark")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(PressOpacityButtonStyle())
            .accessibilityLabel("Clear search")
            .accessibilityIdentifier(testID.map { "\($0)-clear" } ?? "floating-search-clear")
            .padding(.trailing, theme.space.sm)
        }
    }

    // MARK: - Private Computed Properties

    private var rightPadding: CGFloat {
        isLoading ? theme.space.xxxxl : theme.space.xxl
    }
}

// MARK: - Press Opacity Button Style

private struct PressOpacityButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

// MARK: - Preview

#Preview("Default") {
    VStack(spacing: 16) {
        LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search locations...",
            onClear: { print("Clear tapped") }
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Loading State") {
    VStack(spacing: 16) {
        LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Searching...",
            isLoading: true
        )

        LSFloatingSearchInput(
            value: .constant("Mission District"),
            onChangeText: { _ in },
            placeholder: "Searching...",
            isLoading: true,
            onCancelLoading: { print("Cancel tapped") }
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Press-Only Mode") {
    VStack(spacing: 16) {
        LSFloatingSearchInput(
            value: .constant("Search query"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onPress: { print("Search tapped") }
        )

        LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Tap to search...",
            onPress: { print("Search tapped") }
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("All States") {
    VStack(spacing: 16) {
        LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Empty search..."
        )

        LSFloatingSearchInput(
            value: .constant("With text"),
            onChangeText: { _ in },
            placeholder: "Search with text...",
            onClear: { print("Clear") }
        )

        LSFloatingSearchInput(
            value: .constant("Loading"),
            onChangeText: { _ in },
            placeholder: "Loading state...",
            isLoading: true,
            onCancelLoading: { print("Cancel") }
        )

        LSFloatingSearchInput(
            value: .constant("Press only"),
            onChangeText: { _ in },
            placeholder: "Press to search...",
            onPress: { print("Press") }
        )
    }
    .padding()
    .laneShadowTheme()
}
