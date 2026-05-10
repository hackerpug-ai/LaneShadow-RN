import LaneShadowTheme
import SwiftUI

struct LSSuggestionChipResolvedStyle {
    let backgroundToken: String
    let borderToken: String
    let backgroundColor: Color
    let borderColor: Color
}

public struct LSSuggestionChip: View {
    public static let tapAccessibilityIdentifier = "lssuggestionchip-tap"

    @Environment(\.theme) private var theme

    let label: String
    private let onTap: () -> Void

    var resolvedStyle: LSSuggestionChipResolvedStyle {
        LSSuggestionChipResolvedStyle(
            backgroundToken: "color.surface.card",
            borderToken: "color.border.default",
            backgroundColor: LaneShadowTheme.color.surface.card,
            borderColor: LaneShadowTheme.color.border.default
        )
    }

    var size: PillSize {
        .lg
    }

    public init(
        label: String,
        onTap: @escaping () -> Void
    ) {
        self.label = label
        self.onTap = onTap
    }

    public var body: some View {
        let style = resolvedStyle

        Button(action: { Self.dispatch(onTap) }) {
            LSPill(size: size) {
                LSText(label, variant: .label.md, color: .secondary)
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
        .buttonStyle(.plain)
        .frame(minHeight: theme.touchTarget.minTouchTarget)
        .contentShape(Rectangle())
        .accessibilityIdentifier(Self.tapAccessibilityIdentifier)
        .accessibilityAddTraits(.isButton)
    }

    static func dispatch(_ action: () -> Void) {
        action()
    }
}
