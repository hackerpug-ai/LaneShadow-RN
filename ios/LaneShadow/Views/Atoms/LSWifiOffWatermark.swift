import LaneShadowTheme
import SwiftUI

/// A wifi-off watermark glyph for offline state.
///
/// Renders a large, semi-transparent wifi-off icon over the map
/// to indicate offline/disconnected state.
public struct LSWifiOffWatermark: View {
    @Environment(\.theme) private var theme

    private let opacity: Double

    public init(opacity: Double = 0.25) {
        self.opacity = opacity
    }

    public var body: some View {
        ZStack {
            Image(systemName: "wifi.slash")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 120, height: 120)
                .foregroundStyle(LaneShadowTheme.color.status.warning.default)
                .opacity(opacity)
                .accessibilityIdentifier("wifioffwatermark-glyph")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement()
        .accessibilityLabel("Offline - no internet connection")
    }
}

#Preview {
    ZStack {
        Color.gray.opacity(0.3)
            .ignoresSafeArea()

        LSWifiOffWatermark(opacity: 0.25)
    }
}
