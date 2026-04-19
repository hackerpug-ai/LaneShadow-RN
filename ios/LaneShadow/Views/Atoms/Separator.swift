import LaneShadowTheme
import SwiftUI

// MARK: - Separator Component

/**
 * Separator atom component
 *
 * Simple 1pt divider line for visual content separation
 * Following RN wrapper API from react-native/components/ui/separator.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Separator.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.divider.default`
 * - Spacing: `theme.space.xs / 4` (minimum 1pt thickness)
 *
 * ## Parameters
 * - Parameters:
 *   - orientation: Layout direction (horizontal or vertical, default: horizontal)
 *   - color: Optional color override (default: nil, uses theme divider color)
 */
public struct LSSeparator: View {
    @Environment(\.theme) private var theme

    private let orientation: LSSeparatorOrientation
    private let color: Color?

    /// Creates a Separator
    /// - Parameters:
    ///   - orientation: Layout direction (default: horizontal)
    ///   - color: Optional color override (default: nil, uses theme divider color)
    public init(
        orientation: LSSeparatorOrientation = .horizontal,
        color: Color? = nil
    ) {
        self.orientation = orientation
        self.color = color
    }

    public var body: some View {
        Rectangle()
            .fill(color ?? theme.colors.divider.default)
            .frame(
                width: orientation == .vertical ? max(theme.space.xs / 4, 1) : nil,
                height: orientation == .horizontal ? max(theme.space.xs / 4, 1) : nil
            )
            .frame(
                maxWidth: orientation == .horizontal ? .infinity : nil,
                maxHeight: orientation == .vertical ? .infinity : nil
            )
            .accessibilityHidden(true)
    }
}

// MARK: - Orientation Enum

/// Layout orientation for the separator
public enum LSSeparatorOrientation {
    case horizontal
    case vertical
}

// MARK: - Preview

#Preview("Horizontal") {
    VStack(spacing: 16) {
        Text("Content above")
        LSSeparator(orientation: .horizontal)
        Text("Content below")
    }
    .laneShadowTheme()
    .padding()
}

#Preview("Vertical") {
    HStack(spacing: 16) {
        Text("Left")
        LSSeparator(orientation: .vertical)
        Text("Right")
    }
    .laneShadowTheme()
    .padding()
    .frame(height: 100)
}

#Preview("Custom color") {
    VStack(spacing: 16) {
        LSSeparator(orientation: .horizontal, color: .blue)
        LSSeparator(orientation: .horizontal, color: .red)
        LSSeparator(orientation: .horizontal, color: .green)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("All variants") {
    VStack(spacing: 24) {
        VStack(spacing: 16) {
            Text("Horizontal separators")
            LSSeparator(orientation: .horizontal)
            Text("More content")
            LSSeparator(orientation: .horizontal)
        }

        HStack(spacing: 16) {
            Text("Vertical")
            LSSeparator(orientation: .vertical)
            Text("separators")
            LSSeparator(orientation: .vertical)
            Text("example")
        }
        .frame(height: 60)
    }
    .laneShadowTheme()
    .padding()
}
