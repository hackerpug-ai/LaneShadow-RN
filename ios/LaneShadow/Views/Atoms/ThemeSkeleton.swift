import LaneShadowTheme
import SwiftUI

struct ThemeSkeleton: View {
    @Environment(\.theme) private var theme
    @State private var isAnimating = false

    let width: CGFloat
    let height: CGFloat
    let shape: ThemeSkeletonShape
    let accessibilityLabel: String?

    init(
        width: CGFloat,
        height: CGFloat,
        shape: ThemeSkeletonShape = .rounded,
        accessibilityLabel: String? = nil
    ) {
        self.width = width
        self.height = height
        self.shape = shape
        self.accessibilityLabel = accessibilityLabel
    }

    var body: some View {
        shape.shape(theme: theme)
            .fill(theme.colors.muted.default)
            .frame(width: width, height: height)
            .opacity(isAnimating ? 0.3 : 1)
            .animation(
                .easeInOut(duration: 0.75).repeatForever(autoreverses: true),
                value: isAnimating
            )
            .onAppear {
                isAnimating = true
            }
            .accessibilityLabel(accessibilityLabel ?? "ThemeSkeleton")
    }
}

enum ThemeSkeletonShape: String, CaseIterable {
    case rect
    case circle
    case rounded
    case text

    @ViewBuilder
    fileprivate func shape(theme: Theme) -> some InsettableShape {
        switch self {
        case .circle:
            Circle()
        case .rect:
            RoundedRectangle(cornerRadius: 0, style: .continuous)
        case .rounded, .text:
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        }
    }
}
