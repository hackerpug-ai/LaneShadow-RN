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
    private let size: CGFloat?
    private let color: IconContentColor
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
        "mail": "envelope",
        "lock": "lock",
        "eye": "eye",
        "pencil": "pencil",
        "delete": "trash",
        "bell": "bell.fill",
        "bell-outline": "bell",
    ]

    public init(
        name: String,
        size: CGFloat? = nil,
        color: IconContentColor = .primary,
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
        let resolvedSize = size ?? theme.iconSize.large

        var baseImage = Image(systemName: mappedName)

        // Apply rendering mode first (before resizable)
        if let renderingMode {
            baseImage = baseImage.renderingMode(renderingMode)
        }

        return baseImage
            .resizable()
            .scaledToFit()
            .frame(width: resolvedSize, height: resolvedSize)
            .foregroundStyle(color.resolved(in: theme))
            .font(.system(size: resolvedSize).weight(weight))
            .symbolVariant(variant)
            .accessibilityLabel(accessibilityLabel ?? name)
            .accessibilityHidden(false)
            .accessibilityIdentifier(testID ?? "icon-symbol-ios")
    }
}

// MARK: - Preview

#Preview("Default Settings") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(name: "house")
        LSIconSymbolIOS(name: "heart.fill", size: Theme.shared.iconSize.large, color: .signal, weight: .bold)
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.xlarge, color: .secondary)
        LSIconSymbolIOS(name: "chevron.right", size: Theme.shared.iconSize.small, color: .tertiary)
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}

#Preview("Rendering Modes") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(
            name: "heart.fill",
            size: Theme.shared.iconSize.large,
            color: .signal,
            renderingMode: .template
        )
        LSIconSymbolIOS(
            name: "heart.fill",
            size: Theme.shared.iconSize.large,
            color: .signal
        )
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}

#Preview("Variants") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(
            name: "heart",
            size: Theme.shared.iconSize.large,
            color: .signal,
            variant: .none
        )
        LSIconSymbolIOS(
            name: "heart",
            size: Theme.shared.iconSize.large,
            color: .signal,
            variant: .fill
        )
        LSIconSymbolIOS(
            name: "square",
            size: Theme.shared.iconSize.large,
            color: .primary,
            variant: .circle
        )
        LSIconSymbolIOS(
            name: "checkmark",
            size: Theme.shared.iconSize.large,
            color: .secondary,
            variant: .square
        )
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}

#Preview("MaterialCommunityIcons Mapping") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(name: "home")
        LSIconSymbolIOS(name: "heart-outline", color: .signal)
        LSIconSymbolIOS(name: "star-outline", color: .secondary)
        LSIconSymbolIOS(name: "account-outline", color: .subtle)
        LSIconSymbolIOS(name: "chevron-right", color: .tertiary)
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}

#Preview("With Accessibility") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(
            name: "house",
            size: Theme.shared.iconSize.large,
            color: .primary,
            accessibilityLabel: "Home",
            testID: "home-icon"
        )
        LSIconSymbolIOS(
            name: "heart.fill",
            size: Theme.shared.iconSize.large,
            color: .signal,
            weight: .bold,
            accessibilityLabel: "Favorite",
            testID: "favorite-icon"
        )
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}

#Preview("Weights") {
    VStack(spacing: Theme.shared.space.md) {
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.large, color: .secondary, weight: .light)
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.large, color: .secondary, weight: .regular)
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.large, color: .secondary, weight: .medium)
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.large, color: .secondary, weight: .semibold)
        LSIconSymbolIOS(name: "star.fill", size: Theme.shared.iconSize.large, color: .secondary, weight: .bold)
    }
    .padding(Theme.shared.space.lg)
    .laneShadowTheme()
}
