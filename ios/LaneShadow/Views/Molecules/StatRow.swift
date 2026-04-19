import LaneShadowTheme
import SwiftUI

// MARK: - Stat Row Component

/**
 * Stat row molecule component
 *
 * Displays a stat with icon and value text (e.g., duration, distance, wind level).
 * Following React Native component from react-native/components/ui/molecules/stat-row.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.onSurface.subtle` (icon color)
 *   - `theme.colors.onSurface.default` (value text color)
 * - Layout:
 *   - Gap: 6pt (space.sm) between icon and text
 *   - Alignment: center
 * - Typography:
 *   - Font size: 14pt (body.md)
 * - Iconography:
 *   - Default icon size: 18pt
 *
 * ## Parameters
 * - icon: SF Symbol name or icon identifier
 * - value: Value text to display
 * - iconSize: Size of the icon (default: 18pt)
 */
public struct LSStatRow: View {
    @Environment(\.theme) private var theme

    private let icon: String
    private let value: String
    private let iconSize: CGFloat

    public init(
        icon: String,
        value: String,
        iconSize: CGFloat = 18
    ) {
        self.icon = icon
        self.value = value
        self.iconSize = iconSize
    }

    // MARK: - Body

    public var body: some View {
        HStack(spacing: theme.space.sm) {
            // Icon
            Image(systemName: icon)
                .font(.system(size: iconSize))
                .foregroundStyle(theme.colors.onSurface.subtle)

            // Value text
            Text(value)
                .font(.system(size: theme.type.body.md.fontSize))
                .foregroundStyle(theme.colors.onSurface.default)
        }
        .accessibilityLabel(value)
    }
}

// MARK: - Preview

#Preview("StatRow - Duration") {
    LSStatRow(
        icon: "clock",
        value: "2h 30m"
    )
    .laneShadowTheme()
}

#Preview("StatRow - Distance") {
    LSStatRow(
        icon: "location",
        value: "12.5 mi"
    )
    .laneShadowTheme()
}

#Preview("StatRow - Wind Level") {
    LSStatRow(
        icon: "wind",
        value: "Level 3"
    )
    .laneShadowTheme()
}

#Preview("StatRow - Custom Icon Size") {
    LSStatRow(
        icon: "heart",
        value: "145 bpm",
        iconSize: 24
    )
    .laneShadowTheme()
}

#Preview("StatRow - Multiple Stats") {
    VStack(alignment: .leading, spacing: 12) {
        LSStatRow(icon: "clock", value: "2h 30m")
        LSStatRow(icon: "location", value: "12.5 mi")
        LSStatRow(icon: "wind", value: "Level 3")
        LSStatRow(icon: "heart", value: "145 bpm")
    }
    .padding()
    .laneShadowTheme()
}
