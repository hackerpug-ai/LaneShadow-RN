import LaneShadowTheme
import SwiftUI

// MARK: - Separator Orientation

/**
 * Separator orientation enum
 *
 * Defines the layout direction for the separator line.
 */
public enum LSSeparatorOrientation: Sendable {
    case horizontal
    case vertical
}

// MARK: - Separator Component

/**
 * Separator molecule component
 *
 * Visual divider line with semantic theme styling.
 * Following React Native component from react-native/components/ui/separator.tsx
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.border.default` for the line color
 * - Layout:
 *   - Horizontal: height 1, width .infinity
 *   - Vertical: width 1, height .infinity
 *
 * ## Parameters
 * - orientation: Layout direction (horizontal or vertical, default: horizontal)
 */
public struct LSSeparator: View {
    @Environment(\.theme) private var theme

    private let orientation: LSSeparatorOrientation

    /// Creates a Separator
    /// - Parameters:
    ///   - orientation: Layout direction (default: horizontal)
    public init(
        orientation: LSSeparatorOrientation = .horizontal
    ) {
        self.orientation = orientation
    }

    public var body: some View {
        Rectangle()
            .fill(theme.colors.border.default)
            .frame(
                width: orientation == .vertical ? 1 : nil,
                height: orientation == .horizontal ? 1 : nil
            )
            .frame(
                maxWidth: orientation == .horizontal ? .infinity : nil,
                maxHeight: orientation == .vertical ? .infinity : nil
            )
            .accessibilityLabel("Separator")
    }
}

// MARK: - Preview

#Preview("Horizontal Separator") {
    VStack(spacing: 16) {
        Text("Content above separator")
            .font(.body)
        LSSeparator(orientation: .horizontal)
        Text("Content below separator")
            .font(.body)
    }
    .laneShadowTheme()
    .padding()
}

#Preview("Vertical Separator") {
    HStack(spacing: 16) {
        Text("Left content")
            .font(.body)
        LSSeparator(orientation: .vertical)
        Text("Right content")
            .font(.body)
    }
    .laneShadowTheme()
    .padding()
    .frame(height: 100)
}

#Preview("Multiple Horizontal Separators") {
    VStack(spacing: 0) {
        Text("Section 1")
            .font(.headline)
            .padding()
        LSSeparator(orientation: .horizontal)
        Text("Section 2")
            .font(.headline)
            .padding()
        LSSeparator(orientation: .horizontal)
        Text("Section 3")
            .font(.headline)
            .padding()
    }
    .laneShadowTheme()
}

#Preview("Multiple Vertical Separators") {
    HStack(spacing: 0) {
        Text("A")
            .font(.headline)
            .frame(maxWidth: .infinity)
        LSSeparator(orientation: .vertical)
        Text("B")
            .font(.headline)
            .frame(maxWidth: .infinity)
        LSSeparator(orientation: .vertical)
        Text("C")
            .font(.headline)
            .frame(maxWidth: .infinity)
    }
    .laneShadowTheme()
    .frame(height: 60)
}

#Preview("Dark Theme - Horizontal") {
    VStack(spacing: 16) {
        Text("Dark theme content")
            .font(.body)
        LSSeparator(orientation: .horizontal)
        Text("More dark theme content")
            .font(.body)
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
}

#Preview("Dark Theme - Vertical") {
    HStack(spacing: 16) {
        Text("Dark")
            .font(.body)
        LSSeparator(orientation: .vertical)
        Text("Theme")
            .font(.body)
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
    .frame(height: 80)
}
