import LaneShadowTheme
import SwiftUI

// MARK: - DragHandle Component

/**
 * DragHandle component
 *
 * Visual affordance for draggable bottom sheets
 * Following RN wrapper API from react-native/components/ui/drag-handle.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/DragHandle.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.onSurface.default.opacity(0.4)` (onSurface.subtle)
 * - Spacing: `theme.space.sm` (8, for vertical padding)
 *
 * ## Parameters
 * - Parameters:
 *   - width: Handle width (default: 36)
 *   - height: Handle height (default: 4)
 *   - borderRadius: Corner radius (default: 2)
 */
public struct DragHandle: View {
    @Environment(\.theme) private var theme

    private let width: CGFloat
    private let height: CGFloat
    private let borderRadius: CGFloat

    public init(
        width: CGFloat = 36,
        height: CGFloat = 4,
        borderRadius: CGFloat = 2
    ) {
        self.width = width
        self.height = height
        self.borderRadius = borderRadius
    }

    public var body: some View {
        RoundedRectangle(cornerRadius: borderRadius)
            .fill(theme.colors.onSurface.default.opacity(0.4))
            .frame(width: width, height: height)
            .frame(maxWidth: .infinity)
            .padding(.vertical, theme.space.sm)
    }
}
