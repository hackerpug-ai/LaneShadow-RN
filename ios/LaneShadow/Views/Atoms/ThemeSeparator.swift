import LaneShadowTheme
import SwiftUI

struct ThemeSeparator: View {
    @Environment(\.theme) private var theme

    let orientation: ThemeSeparatorOrientation

    var body: some View {
        Rectangle()
            .fill(theme.colors.divider.default)
            .frame(
                width: orientation == .vertical ? max(theme.space.xs / 4, 1) : nil,
                height: orientation == .horizontal ? max(theme.space.xs / 4, 1) : nil
            )
            .accessibilityHidden(true)
    }
}

enum ThemeSeparatorOrientation: String {
    case horizontal
    case vertical
}
