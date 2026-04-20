import LaneShadowTheme
import SwiftUI

// MARK: - Icon Symbol iOS Component

/**
 * Icon Symbol iOS component
 *
 * iOS-specific icon component using SF Symbols with advanced rendering options
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/IconSymbol.md
 *
 * ## Design Tokens Used
 * - Sizing: Custom size parameter (default: 24, uses theme.size.icon.lg when size is nil)
 * - Colors: Custom color parameter (required)
 * - Typography: `.font(.system(size: size).weight(weight))`
 *
 * ## Icon Name Mapping
 * Maps MaterialCommunityIcons names to SF Symbol equivalents with fallback support
 *
 * ## Parameters
 * - Parameters:
 *   - name: Icon name (SF Symbol name or MaterialCommunityIcons name mapped to SF Symbol)
 *   - size: Icon size in points (default: 24, equivalent to theme.size.icon.lg)
 *   - color: Icon tint color (required)
 *   - weight: SF Symbol weight (default: .regular)
 *   - renderingMode: Symbol rendering mode (default: .template)
 *   - variant: Symbol variant (default: .none)
 *   - accessibilityLabel: Accessibility label for screen readers (optional)
 *   - testID: Testing identifier (optional)
 */
public struct LSIconSymbolIOS: View {
    @Environment(\.theme) private var theme

    private let name: String
    private let size: CGFloat
    private let color: Color
    private let weight: Font.Weight
    private let renderingMode: Image.TemplateRenderingMode?
    private let variant: SymbolVariants
    private let accessibilityLabel: String?
    private let testID: String?

    /// Maps MaterialCommunityIcons names to SF Symbol names
    private static let iconMap: [String: String] = [
        "home": "house",
        "home-outline": "house",
        "cog": "gearshape",
        "cog-outline": "gearshape",
        "magnify": "magnifyingglass",
        "heart": "heart.fill",
        "heart-outline": "heart",
        "star": "star.fill",
        "star-outline": "star",
        "map": "map",
        "account": "person.fill",
        "account-outline": "person",
        "close": "xmark",
        "menu": "line.3.horizontal",
        "arrow-left": "arrow.left",
        "chevron-left": "chevron.left",
        "chevron-right": "chevron.right",
        "chevron-down": "chevron.down",
        "chevron-up": "chevron.up",
        "plus": "plus",
        "minus": "minus",
        "check": "checkmark",
        "pencil": "pencil",
        "delete": "trash",
        "bell": "bell.fill",
        "bell-outline": "bell",
    ]

    public init(
        name: String,
        size: CGFloat = 24,
        color: Color,
        weight: Font.Weight = .regular,
        renderingMode: Image.TemplateRenderingMode? = nil,
        variant: SymbolVariants = .none,
        accessibilityLabel: String? = nil,
        testID: String? = nil
    ) {
        self.name = name
        self.size = size
        self.color = color
        self.weight = weight
        self.renderingMode = renderingMode
        self.variant = variant
        self.accessibilityLabel = accessibilityLabel
        self.testID = testID
    }

    public var body: some View {
        let mappedName = Self.iconMap[name] ?? name

        var baseImage = Image(systemName: mappedName)

        // Apply rendering mode first (before resizable)
        if let renderingMode = renderingMode {
            baseImage = baseImage.renderingMode(renderingMode)
        }

        return baseImage
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(color)
            .font(.system(size: size).weight(weight))
            .symbolVariant(variant)
            .accessibilityLabel(accessibilityLabel ?? name)
            .accessibilityHidden(false)
            .accessibilityIdentifier(testID ?? "icon-symbol-ios")
    }
}

// MARK: - Preview

#Preview("Default Settings") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(name: "house", size: 24, color: .blue)
        LSIconSymbolIOS(name: "heart.fill", size: 32, color: .red, weight: .bold)
        LSIconSymbolIOS(name: "star.fill", size: 48, color: .yellow)
        LSIconSymbolIOS(name: "chevron.right", size: 20, color: .green)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Rendering Modes") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red,
            renderingMode: .template
        )
        LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Variants") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(
            name: "heart",
            size: 32,
            color: .red,
            variant: .none
        )
        LSIconSymbolIOS(
            name: "heart",
            size: 32,
            color: .red,
            variant: .fill
        )
        LSIconSymbolIOS(
            name: "square",
            size: 32,
            color: .blue,
            variant: .circle
        )
        LSIconSymbolIOS(
            name: "checkmark",
            size: 32,
            color: .green,
            variant: .square
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("MaterialCommunityIcons Mapping") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(name: "home", size: 24, color: .blue)
        LSIconSymbolIOS(name: "heart-outline", size: 24, color: .red)
        LSIconSymbolIOS(name: "star-outline", size: 24, color: .yellow)
        LSIconSymbolIOS(name: "account-outline", size: 24, color: .gray)
        LSIconSymbolIOS(name: "chevron-right", size: 24, color: .green)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("With Accessibility") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(
            name: "house",
            size: 32,
            color: .blue,
            accessibilityLabel: "Home",
            testID: "home-icon"
        )
        LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red,
            weight: .bold,
            accessibilityLabel: "Favorite",
            testID: "favorite-icon"
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Weights") {
    VStack(spacing: 16) {
        LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .light)
        LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .regular)
        LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .medium)
        LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .semibold)
        LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .bold)
    }
    .padding()
    .laneShadowTheme()
}
