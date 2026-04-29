import LaneShadowTheme
import SwiftUI

struct AppHomeView: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(spacing: theme.space.md) {
            Text("App Home")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
        }
        .padding(theme.space.lg)
        .navigationTitle("LaneShadow")
    }
}
