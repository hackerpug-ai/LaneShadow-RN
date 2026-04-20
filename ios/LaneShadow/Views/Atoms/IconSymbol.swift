import LaneShadowTheme
import SwiftUI

// MARK: - Icon Symbol Component

/**
 * Icon symbol component
 *
 * Cross-platform icon component using SF Symbols with MaterialCommunityIcons name mapping
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/IconSymbol.md
 *
 * ## Design Tokens Used
 * - Sizing: Custom size parameter (default: 24)
 * - Colors: Custom color parameter (required)
 * - Typography: `.font(.system(size: size).weight(weight))`
 *
 * ## Icon Name Mapping
 * Maps MaterialCommunityIcons names to SF Symbol equivalents with fallback support
 *
 * ## Parameters
 * - Parameters:
 *   - name: Icon name (MaterialCommunityIcons name, mapped to SF Symbol)
 *   - size: Icon size (default: 24)
 *   - color: Icon tint color (required)
 *   - weight: Icon weight (default: .regular)
 *   - testID: Testing identifier (optional)
 */
public struct LSIconSymbol: View {
    @Environment(\.theme) private var theme

    private let name: String
    private let size: CGFloat
    private let color: Color
    private let weight: Font.Weight
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
        "plus-circle-outline": "plus.circle",
        "minus": "minus",
        "check": "checkmark",
        "pencil": "pencil",
        "delete": "trash",
        "trash-can-outline": "trash",
        "bell": "bell.fill",
        "bell-outline": "bell",
        "information": "info.circle",
        "wifi-off": "wifi.slash",
        // Map controls icons
        "crosshairs-gps": "crosshair.circle",
        "layers": "square.stack.3d.up",
        "bookmark": "bookmark",
        "bookmark-outline": "bookmark",
        "message-text-outline": "bubble.left.and.bubble.right",
        "map-outline": "map",
        // Weather icons
        "weather-sunny": "sun.max.fill",
        "weather-rainy": "cloud.rain.fill",
        "weather-windy": "wind",
        "weather-cloudy": "cloud.fill",
        "weather-partly-cloudy": "cloud.sun.fill",
        // Map and navigation icons
        "map-marker-distance": "signpost.right",
        "clock-outline": "clock",
        "leaf": "leaf.fill",
    ]

    public init(
        name: String,
        size: CGFloat = 24,
        color: Color,
        weight: Font.Weight = .regular,
        testID: String? = nil
    ) {
        self.name = name
        self.size = size
        self.color = color
        self.weight = weight
        self.testID = testID
    }

    public var body: some View {
        let mappedName = Self.iconMap[name] ?? name

        Image(systemName: mappedName)
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(color)
            .font(.system(size: size).weight(weight))
            .renderingMode(.template)
            .accessibilityLabel(name)
            .accessibilityHidden(false)
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 16) {
        LSIconSymbol(name: "home", size: 24, color: .blue)
        LSIconSymbol(name: "heart", size: 32, color: .red, weight: .bold)
        LSIconSymbol(name: "account-outline", size: 48, color: .gray)
        LSIconSymbol(name: "chevron-right", size: 20, color: .green)
        LSIconSymbol(name: "bell", size: 36, color: .orange, weight: .light)
    }
    .padding()
}
