import LaneShadowTheme
import SwiftUI

struct LSTagPillResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let iconColor: IconContentColor
    let backgroundColor: Color
    let borderColor: Color
}

public struct LSTagPill: View {
    @Environment(\.theme) private var theme

    let icon: IconName?
    let labelText: String
    let size: PillSize

    var resolvedStyle: LSTagPillResolvedStyle {
        LSTagPillResolvedStyle(
            backgroundToken: "color.surface.glass",
            borderToken: "color.border.default",
            iconColor: .signal,
            backgroundColor: LaneShadowTheme.color.surface.glass,
            borderColor: LaneShadowTheme.color.border.default
        )
    }

    public init(
        icon: IconName? = nil,
        label: String,
        size: PillSize = .sm
    ) {
        self.icon = icon
        labelText = label
        self.size = size
    }

    public var body: some View {
        let style = resolvedStyle

        LSPill(size: size) {
            HStack(spacing: theme.space.xs) {
                if let icon {
                    LSIcon(name: icon, size: .xs, color: style.iconColor)
                }

                LSText(labelText, variant: .label.sm, color: .secondary)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .fill(style.backgroundColor)
        )
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .stroke(style.borderColor, lineWidth: theme.borderWidth.hairline)
        )
    }
}
