import LaneShadowTheme
import SwiftUI

// MARK: - SearchBar Component

/**
 * SearchBar molecule component
 *
 * Simple search input with icon. Following React Native component from
 * react-native/components/ui/search-bar.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Icon: `theme.colors.onSurface.default` with 0.6 opacity
 *   - Text (typed): `theme.colors.onSurface.default`
 *   - Text (placeholder): `theme.colors.onSurface.default` with 0.6 opacity
 * - Layout:
 *   - Corner radius: `theme.radius.md` (8pt)
 *   - Padding: horizontal 16pt, vertical 12pt
 *   - Gap: 12pt between icon and text
 * - Typography:
 *   - Font size: 14pt
 *   - Font weight: regular
 * - Icon:
 *   - Size: 20pt
 *   - SF Symbol: "magnifyingglass"
 *
 * ## Parameters
 * - placeholder: Placeholder text to display
 * - value: Current input value binding (nil for clickable mode, non-nil for editable)
 * - onTap: Tap handler for expanding search (clickable mode, default: nil)
 * - testID: Optional testing identifier for accessibility
 *
 * ## Modes
 * - **Clickable mode** (value = nil): Displays placeholder as non-editable text with onTap handler
 * - **Editable mode** (value != nil): Full TextField with text input binding
 */
public struct LSSearchBar: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    private let placeholder: String
    private let value: Binding<String>?
    private let onTap: (() -> Void)?
    private let testID: String?

    public init(
        placeholder: String,
        value: Binding<String>? = nil,
        onTap: (() -> Void)? = nil,
        testID: String? = nil
    ) {
        self.placeholder = placeholder
        self.value = value
        self.onTap = onTap
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let value {
                // Editable mode: TextField with input
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundStyle(iconColor)

                    TextField(text: value) {
                        Text(placeholder)
                            .font(.system(size: 14, weight: .regular))
                            .foregroundStyle(iconColor)
                    }
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .focused($isFocused)
                    .accessibilityLabel(placeholder)
                    .accessibilityIdentifier(testID.map { "\($0)-input" } ?? "search-bar-input")
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(theme.colors.surface.default)
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Search input")
            } else {
                // Clickable mode: Non-editable with onTap handler
                Button(action: {
                    onTap?()
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(iconColor)

                        Text(placeholder)
                            .font(.system(size: 14, weight: .regular))
                            .foregroundStyle(iconColor)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(theme.colors.surface.default)
                    .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel(placeholder)
                .accessibilityIdentifier(testID ?? "search-bar")
            }
        }
    }

    // MARK: - Private Computed Properties

    private var iconColor: Color {
        theme.colors.onSurface.default.opacity(0.6)
    }
}

// MARK: - Preview

#Preview("Clickable Mode") {
    VStack(spacing: 16) {
        LSSearchBar(
            placeholder: "Search rides...",
            onTap: { print("Search tapped") }
        )

        LSSearchBar(
            placeholder: "Search locations..."
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Editable Mode") {
    VStack(spacing: 16) {
        LSSearchBar(
            placeholder: "Search rides...",
            value: .constant("")
        )

        LSSearchBar(
            placeholder: "With text",
            value: .constant("San Francisco")
        )

        LSSearchBar(
            placeholder: "Long text",
            value: .constant("This is a longer search query to demonstrate text wrapping")
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("States") {
    VStack(spacing: 16) {
        LSSearchBar(
            placeholder: "Empty",
            value: .constant("")
        )

        LSSearchBar(
            placeholder: "With text",
            value: .constant("Mission District")
        )

        LSSearchBar(
            placeholder: "Clickable",
            onTap: { print("Tapped") }
        )
    }
    .padding()
    .laneShadowTheme()
}
