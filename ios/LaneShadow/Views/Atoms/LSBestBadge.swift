import LaneShadowTheme
import SwiftUI

public struct LSBestBadgeResolvedStyle: Equatable, Sendable {
    let backgroundToken: String
    let foregroundToken: String
    let backgroundColor: Color
    let foregroundColor: Color
    let leadingIcon: IconName
    let iconSize: IconSize

    func pillHeight(in theme: Theme) -> CGFloat {
        PillSize.sm.height(in: theme)
    }
}

public struct LSBestBadge: View {
    @Environment(\.theme) private var theme

    static let labelText = "BEST FOR TODAY"

    public init() {}

    public var body: some View {
        let style = Self.resolvedStyle(in: theme)

        LSPill(size: .sm) {
            HStack(spacing: theme.space.xs) {
                LSIcon(
                    name: style.leadingIcon,
                    size: style.iconSize,
                    resolvedColorOverride: style.foregroundColor
                )

                Text(Self.labelText)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(style.foregroundColor)
                    .textCase(.uppercase)
            }
            .padding(.horizontal, theme.space.xs)
            .background(style.backgroundColor, in: Capsule(style: .continuous))
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Self.labelText)
    }
}

extension LSBestBadge {
    static func resolvedStyle(in theme: Theme) -> LSBestBadgeResolvedStyle {
        LSBestBadgeResolvedStyle(
            backgroundToken: "color.signal.default",
            foregroundToken: "color.content.onSignal",
            backgroundColor: theme.colors.primary.default,
            foregroundColor: ContentColor.onSignal.resolved(in: theme),
            leadingIcon: .starFill,
            iconSize: .xs
        )
    }
}
