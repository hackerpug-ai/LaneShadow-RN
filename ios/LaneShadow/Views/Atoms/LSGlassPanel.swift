import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum GlassVariant: Hashable, Sendable {
    case chrome
    case callout(accent: AccentColor)
}

public struct LSGlassPanel<Content: View>: View {
    @Environment(\.theme) private var theme

    private let variant: GlassVariant
    private let padding: Spacing
    private let content: Content

    public init(
        variant: GlassVariant = .chrome,
        padding: Spacing = .spacing4,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        let shape = RoundedRectangle(
            cornerRadius: Self.cornerRadius(in: theme),
            style: .continuous
        )
        let elevation = Self.elevation(in: theme)

        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Self.resolvedPadding(padding, in: theme))
            .background(Self.surfaceFill(in: theme))
            .background(.ultraThinMaterial)
            .overlay(alignment: .leading) {
                if case let .callout(accent) = variant {
                    Rectangle()
                        .fill(accent.resolved(in: theme))
                        .frame(width: Self.stripeWidth(in: theme))
                        .frame(maxHeight: .infinity)
                        .clipShape(shape)
                }
            }
            .clipShape(shape)
            .shadow(
                color: elevation.shadowColor.opacity(elevation.opacity),
                radius: elevation.radius,
                x: elevation.offsetX,
                y: elevation.offsetY
            )
    }
}

extension LSGlassPanel {
    static var backdropMaterialName: String {
        "ultraThinMaterial"
    }

    static var surfaceTokenPath: String {
        "color.surface.glass"
    }

    static func surfaceFill(in theme: Theme) -> Color {
        LSSurfaceColorToken.glass.resolved(in: theme)
    }

    static func cornerRadius(in theme: Theme) -> CGFloat {
        theme.radius.xl
    }

    static func elevation(in theme: Theme) -> ElevationStyle {
        theme.elevation.level8
    }

    static func resolvedPadding(_ padding: Spacing, in theme: Theme) -> CGFloat {
        padding.value(in: theme)
    }

    static func stripeWidth(in _: Theme) -> CGFloat {
        3
    }
}
