import LaneShadowTheme
import SwiftUI

// MARK: - Header Component

/**
 * Header molecule component
 *
 * Generic header with menu button for consistent top navigation
 * Following React Native component from react-native/components/layouts/header.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.background.default` (background)
 *   - `theme.colors.border.default` (bottom border)
 *   - `theme.colors.onSurface.default` (title text, menu icon)
 * - Layout:
 *   - Height: 60pt
 *   - Padding: horizontal lg (16pt), vertical sm (8pt)
 *   - Menu button: 44x44pt
 *   - Right spacer: 44pt
 * - Typography:
 *   - Title: theme.type.title.lg
 * - Border:
 *   - Bottom: 1pt using border.default color
 *
 * ## Parameters
 * - title: Header title text (required)
 * - onMenuPress: Menu button tap handler (required)
 * - testID: Testing identifier (optional)
 */
public struct LSHeader: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let onMenuPress: () -> Void
    private let testID: String?

    public init(
        title: String,
        onMenuPress: @escaping () -> Void,
        testID: String? = nil
    ) {
        self.title = title
        self.onMenuPress = onMenuPress
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        HStack(alignment: .center, spacing: 0) {
            // Menu button (left)
            Button(action: onMenuPress) {
                LSIconSymbol(
                    name: "menu",
                    size: 24,
                    color: theme.colors.onSurface.default
                )
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(PlainButtonStyle())
            .accessibilityLabel("Menu")
            .accessibilityIdentifier(testID.map { "\($0)-menu-button" } ?? "menu-button")

            // Title (centered)
            Spacer()
            Text(title)
                .font(.system(size: 20, weight: .bold)) // title.lg equivalent
                .foregroundStyle(theme.colors.onSurface.default)
            Spacer()

            // Right spacer (44pt for layout balance)
            Spacer()
                .frame(width: 44)
        }
        .frame(height: 60)
        .frame(maxWidth: .infinity)
        .background(theme.colors.background.default)
        .overlay(
            Rectangle()
                .fill(theme.colors.border.default)
                .frame(height: 1),
            alignment: .bottom
        )
        .padding(.horizontal, theme.space.lg)
        .padding(.vertical, theme.space.sm)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Header")
    }
}

// MARK: - Preview

#Preview("Header - Basic") {
    LSHeader(
        title: "LaneShadow",
        onMenuPress: {
            print("Menu pressed")
        }
    )
    .laneShadowTheme()
}

#Preview("Header - Long Title") {
    LSHeader(
        title: "Very Long Header Title That Should Center",
        onMenuPress: {
            print("Menu pressed")
        },
        testID: "preview-header"
    )
    .laneShadowTheme()
}
