import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSPanel<Content: View>: View {
    @Environment(\.theme) private var theme

    private let padding: Spacing
    private let content: Content

    public init(
        padding: Spacing = .spacing3,
        @ViewBuilder content: () -> Content
    ) {
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        let elevation = Self.elevation(in: theme)

        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Self.resolvedPadding(padding, in: theme))
            .background(Self.surfaceFill(in: theme))
            .clipShape(
                RoundedRectangle(
                    cornerRadius: Self.cornerRadius(in: theme),
                    style: .continuous
                )
            )
            .shadow(
                color: elevation.shadowColor.opacity(elevation.opacity),
                radius: elevation.radius,
                x: elevation.offsetX,
                y: elevation.offsetY
            )
    }
}

extension LSPanel {
    static func surfaceFill(in theme: Theme) -> Color {
        LSSurfaceColorToken.primary.resolved(in: theme)
    }

    static func cornerRadius(in theme: Theme) -> CGFloat {
        theme.radius.md
    }

    static func elevation(in theme: Theme) -> ElevationStyle {
        theme.elevation.level0
    }

    static func resolvedPadding(_ padding: Spacing, in theme: Theme) -> CGFloat {
        padding.value(in: theme)
    }
}
