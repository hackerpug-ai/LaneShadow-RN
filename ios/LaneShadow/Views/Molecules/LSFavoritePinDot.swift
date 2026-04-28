import LaneShadowTheme
import SwiftUI

/// LSFavoritePinDot — Favorite location pin overlay for paper map.
///
/// Copper-filled circle pin with card-colored border for marking favorite
/// locations on the paper substrate map.
public struct LSFavoritePinDot: View {
    @Environment(\.theme) private var theme

    private let pinSize: CGFloat = 16

    public init() {}

    public var body: some View {
        ZStack {
            // Outer border (card color)
            Circle()
                .stroke(theme.colors.card.default, lineWidth: theme.borderWidth.thick)
                .frame(width: pinSize, height: pinSize)

            // Inner fill (signal.default - copper color)
            Circle()
                .fill(theme.colors.primary.default)
                .frame(width: pinSize - theme.borderWidth.thick * 2, height: pinSize - theme.borderWidth.thick * 2)
        }
        .accessibilityIdentifier("favorite-pin-dot")
        .accessibilityLabel("Favorite location")
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        LSFavoritePinDot()
        LSFavoritePinDot()
            .preferredColorScheme(.dark)
    }
    .padding()
}
