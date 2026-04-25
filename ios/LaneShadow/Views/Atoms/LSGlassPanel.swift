import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum GlassVariant: Hashable, Sendable {
    case chrome
    case callout(accent: AccentColor)
}

/// Corner-radius preset for glass surfaces.
///
/// - `.default`: legacy radius (`theme.radius.xl`) — used by larger glass surfaces.
/// - `.md`: smaller chip radius (`theme.radius.md`) — keeps tall/wide chips reading
///   as rounded-rectangles instead of capsules. Use for TopBar chips and similar
///   compact containers.
public enum GlassCornerRadius: Hashable, Sendable {
    case `default`
    case md
}

public struct LSGlassPanel<Content: View>: View {
    @Environment(\.theme) private var theme

    private let variant: GlassVariant
    private let padding: Spacing
    private let cornerRadius: GlassCornerRadius
    private let content: Content

    public init(
        variant: GlassVariant = .chrome,
        padding: Spacing = .spacing4,
        cornerRadius: GlassCornerRadius = .default,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.content = content()
    }

    public var body: some View {
        let shape = RoundedRectangle(
            cornerRadius: Self.cornerRadius(cornerRadius, in: theme),
            style: .continuous
        )
        let elevation = Self.elevation(in: theme)

        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Self.resolvedPadding(padding, in: theme))
            .background(Self.surfaceFill(in: theme))
            .background(.ultraThinMaterial)
            .overlay {
                if case let .callout(accent) = variant {
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(accent.resolved(in: theme))
                            .frame(width: Self.stripeWidth(in: theme))
                            .frame(maxHeight: .infinity)

                        Spacer(minLength: 0)
                    }
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

    /// Default radius (legacy callers without an explicit override).
    static func cornerRadius(in theme: Theme) -> CGFloat {
        cornerRadius(.default, in: theme)
    }

    static func cornerRadius(_ radius: GlassCornerRadius, in theme: Theme) -> CGFloat {
        switch radius {
        case .default:
            return theme.radius.xl
        case .md:
            return theme.radius.md
        }
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
