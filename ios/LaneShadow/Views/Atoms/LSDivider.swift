import LaneShadowTheme
import SwiftUI

public struct LSDivider: View {
    @Environment(\.theme) private var theme

    public init() {}

    public var body: some View {
        Rectangle()
            .fill(Self.ruleFill(in: theme))
            .frame(height: Self.thickness(in: theme))
            .frame(maxWidth: .infinity)
            .accessibilityHidden(true)
    }
}

extension LSDivider {
    static func thickness(in _: Theme) -> CGFloat {
        1
    }

    static func ruleFill(in theme: Theme) -> Color {
        theme.colors.divider.default
    }
}
