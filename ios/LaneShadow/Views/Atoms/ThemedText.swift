import LaneShadowTheme
import SwiftUI

// MARK: - Themed Text Variant Enum

/**
 * Themed text typography variants
 *
 * Following RN wrapper API from react-native/components/ui/themed-text.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/ThemedText.md
 */
public enum LSThemedTextVariant {
    case defaultSize // bodyMedium: size 16, regular weight
    case defaultSemiBold // size 14, semibold weight
}

// MARK: - Themed Text Component

/**
 * Themed text component
 *
 * Following RN wrapper API from react-native/components/ui/themed-text.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/ThemedText.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.onSurface.default` (default text color)
 * - Typography:
 *   - Default: 16pt regular (bodyMedium)
 *   - SemiBold: 14pt semibold
 *
 * ## Parameters
 * - Parameters:
 *   - text: Text content to display
 *   - variant: Typography variant (default, defaultSemiBold)
 *   - color: Optional color override (defaults to onSurface)
 *   - testID: Test identifier for UI testing
 */
public struct LSThemedText: View {
    @Environment(\.theme) private var theme

    private let text: String
    private let variant: LSThemedTextVariant
    private let color: Color?
    private let testID: String?

    public init(
        _ text: String,
        variant: LSThemedTextVariant = .defaultSize,
        color: Color? = nil,
        testID: String? = nil
    ) {
        self.text = text
        self.variant = variant
        self.color = color
        self.testID = testID
    }

    // MARK: - Typography Computed Properties

    private var font: Font {
        switch variant {
        case .defaultSize:
            .system(size: 16, weight: .regular)
        case .defaultSemiBold:
            .system(size: 14, weight: .semibold)
        }
    }

    private var textColor: Color {
        color ?? theme.colors.onSurface.default
    }

    // MARK: - Body

    public var body: some View {
        Text(text)
            .font(font)
            .foregroundStyle(textColor)
            .accessibilityIdentifier(testID ?? "themed-text")
    }
}
