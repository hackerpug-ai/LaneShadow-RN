import LaneShadowTheme
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {
    /// Best badge entrance animation: 200ms spring
    ///
    /// Reads from theme.motion.bestBadgeEnter (uses "standard" duration = 240ms and "emphasized" easing)
    static func bestBadgeEnter(theme: Theme) -> Animation {
        let duration = Double(theme.motion.duration["standard"] ?? 240) / 1000
        let easing = theme.motion.easing["emphasized"] ?? [0.2, 0.0, 0.0, 1.0]
        return Animation.timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: duration
        )
    }
}

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

    @State private var isAppeared = false

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
        .scaleEffect(isAppeared ? 1.0 : 0.8)
        .opacity(isAppeared ? 1.0 : 0.0)
        .animation(Animation.bestBadgeEnter(theme: theme), value: isAppeared)
        .onAppear {
            isAppeared = true
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
