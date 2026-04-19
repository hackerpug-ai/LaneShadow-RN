import LaneShadowTheme
import SwiftUI

// MARK: - Themed View Component

/**
 * Themed view component
 *
 * Simple container with surface background and theme integration
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.surface.default` (background)
 * - Layout: maxWidth .infinity, VStack direction
 *
 * ## Parameters
 * - content: Child content via ViewBuilder
 */
public struct LSThemedView<Content: View>: View {
    @Environment(\.theme) private var theme

    private let content: () -> Content

    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content()
        }
        .frame(maxWidth: .infinity)
        .background(theme.colors.surface.default)
    }
}

// MARK: - Preview

#Preview("ThemedView") {
    LSThemedView {
        VStack(spacing: 16) {
            Text("Themed View Content")
                .font(.headline)
            Text("This view has a surface background")
                .font(.body)
        }
        .padding()
    }
    .laneShadowTheme()
}
