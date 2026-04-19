import LaneShadowTheme
import SwiftUI

// MARK: - SheetHandle Component

/**
 * SheetHandle component
 *
 * Visual affordance for bottom sheets — a simple drag handle indicator
 * Following RN wrapper API from react-native/components/ui/sheet-handle.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/SheetHandle.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.onSurface.default.opacity(0.6)` (onSurface.subtle)
 * - Size: 48×5pt capsule shape
 *
 * ## Parameters
 * - None required — fixed-shape visual element
 *
 * ## Usage
 * ```swift
 * LSSheetHandle()
 * ```
 */
public struct LSSheetHandle: View {
    @Environment(\.theme) private var theme

    private let width: CGFloat = 48
    private let height: CGFloat = 5

    public init() {}

    public var body: some View {
        Capsule()
            .fill(theme.colors.onSurface.default.opacity(0.6))
            .frame(width: width, height: height)
            .frame(maxWidth: .infinity)
            .accessibilityElement()
            .accessibilityLabel("Sheet handle")
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        LSSheetHandle()
            .padding()
            .background(Color.gray.opacity(0.1))

        LSSheetHandle()
            .padding()
            .background(Color.darkGray.opacity(0.3))
    }
}
