import LaneShadowTheme
import SwiftUI

struct LSFilterChipResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let backgroundColor: Color
    let borderColor: Color
    let textColor: ContentColor
}

public struct LSFilterChip: View {
    public static let tapAccessibilityIdentifier = "lsfilterchip-toggle"

    @Environment(\.theme) private var theme

    let label: String
    let selected: Bool
    private let onToggle: () -> Void

    var resolvedStyle: LSFilterChipResolvedStyle {
        if selected {
            LSFilterChipResolvedStyle(
                backgroundToken: "color.signal.default",
                borderToken: "color.signal.default",
                backgroundColor: LaneShadowTheme.color.signal.default,
                borderColor: LaneShadowTheme.color.signal.default,
                textColor: .onSignal
            )
        } else {
            LSFilterChipResolvedStyle(
                backgroundToken: "color.surface.card",
                borderToken: "color.border.default",
                backgroundColor: LaneShadowTheme.color.surface.card,
                borderColor: LaneShadowTheme.color.border.default,
                textColor: .secondary
            )
        }
    }

    public init(
        label: String,
        selected: Bool,
        onToggle: @escaping () -> Void
    ) {
        self.label = label
        self.selected = selected
        self.onToggle = onToggle
    }

    public var body: some View {
        let style = resolvedStyle

        Button(action: { Self.dispatch(onToggle) }) {
            LSPill(size: .md) {
                LSText(label, variant: .label.md, color: style.textColor)
                    .padding(.horizontal, theme.space.xs)
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
        .buttonStyle(.plain)
        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
        .accessibilityAddTraits(.isButton)
    }

    static func dispatch(_ action: () -> Void) {
        action()
    }
}
