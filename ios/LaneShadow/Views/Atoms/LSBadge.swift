import LaneShadowTheme
import SwiftUI

public struct LSBadgeResolvedStyle: Equatable, Sendable {
    let backgroundToken: String
    let foregroundToken: String
    let borderToken: String?
    let backgroundColor: Color
    let foregroundColor: Color
    let borderColor: Color?
    let borderOpacity: CGFloat
    let leadingIcon: IconName?
    let iconSize: IconSize

    func pillHeight(in theme: Theme) -> CGFloat {
        PillSize.sm.height(in: theme)
    }
}

public struct LSBadge: View {
    @Environment(\.theme) private var theme

    private let count: Int?
    private let label: String?
    private let variant: BadgeVariant

    public init(
        count: Int? = nil,
        label: String? = nil,
        variant: BadgeVariant
    ) {
        self.count = count
        self.label = label
        self.variant = variant
    }

    public var body: some View {
        let style = variant.resolvedStyle(in: theme)

        LSPill(size: .sm) {
            HStack(spacing: theme.space.xs) {
                if let icon = style.leadingIcon {
                    LSIcon(
                        name: icon,
                        size: style.iconSize,
                        resolvedColorOverride: style.foregroundColor
                    )
                }

                if let contentText {
                    Text(contentText)
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(style.foregroundColor)
                        .textCase(.uppercase)
                }
            }
            .frame(minWidth: countOnly ? 20 : nil)
            .padding(.horizontal, countOnly ? 0 : theme.space.xs)
            .background(style.backgroundColor, in: Capsule(style: .continuous))
            .overlay {
                if let borderColor = style.borderColor {
                    Capsule(style: .continuous)
                        .stroke(
                            borderColor.opacity(style.borderOpacity),
                            lineWidth: theme.borderWidth.hairline
                        )
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(contentText ?? "")
    }
}

extension LSBadge {
    nonisolated static func weatherBorderOpacity(in theme: Theme) -> CGFloat {
        let fifty = theme.opacity.values["50"] ?? 0.5
        let sixty = theme.opacity.values["60"] ?? 0.6
        return (fifty + sixty) / 2
    }

    private var contentText: String? {
        if let label, !label.isEmpty {
            return label
        }
        if let count {
            return String(count)
        }
        return nil
    }

    private var countOnly: Bool {
        count != nil && (label == nil || label?.isEmpty == true)
    }
}
