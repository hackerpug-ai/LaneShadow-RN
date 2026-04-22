import LaneShadowTheme
import SwiftUI

/// Pill-shaped container primitive
///
/// A non-interactive, pill-shaped container that composes with any content.
/// Uses theme tokens for corner radius and sizing. No default background or border.
///
/// ## Usage
///
/// ```swift
/// LSPill(size: .md) {
///     LSText("Label", variant: .ui.label.sm)
/// }
///
/// LSPill(size: .sm, padding: .sm) {
///     LSText("Small", variant: .ui.label.sm)
/// }
/// ```
public struct LSPill: View {
    @Environment(\.theme) private var theme

    private let size: PillSize
    private let padding: CGFloat?
    private let content: Content

    /// Creates a pill with the specified size and content
    ///
    /// - Parameters:
    ///   - size: The size variant (sm/md/lg)
    ///   - padding: Optional custom padding. If nil, uses size-appropriate default padding
    ///   - content: The pill's content
    public init(
        size: PillSize,
        padding: CGFloat? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.size = size
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        content
            .padding(.horizontal, horizontalPadding)
            .frame(height: size.height(in: theme))
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.full))
    }

    private var horizontalPadding: CGFloat {
        if let padding {
            return padding
        }

        // Default padding based on size
        switch size {
        case .sm:
            return theme.space.xs // 4pt
        case .md:
            return theme.space.sm // 8pt
        case .lg:
            return theme.space.md // 12pt
        }
    }
}

// MARK: - Preview

#Preview("Pill Sizes") {
    VStack(spacing: 16) {
        LSPill(size: .sm) {
            LSText("Small", variant: .ui.label.sm)
        }

        LSPill(size: .md) {
            LSText("Medium", variant: .ui.label.sm)
        }

        LSPill(size: .lg) {
            LSText("Large", variant: .ui.label.md)
        }
    }
    .laneShadowTheme()
}
