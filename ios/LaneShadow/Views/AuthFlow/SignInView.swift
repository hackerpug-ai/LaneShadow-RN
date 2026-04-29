import LaneShadowTheme
import SwiftUI

struct SignInView: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(spacing: theme.space.md) {
            Text("Sign In")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
        }
        .padding(theme.space.lg)
        .navigationTitle("Sign In")
    }
}
