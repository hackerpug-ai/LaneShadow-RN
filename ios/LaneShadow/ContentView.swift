import LaneShadowTheme
import SwiftUI

struct ContentView: View {
    @Bindable var convexStore: ConvexStore
    @Environment(\.theme) private var theme

    var body: some View {
        NavigationStack {
            VStack(spacing: theme.space.xl) {
                Text("LaneShadow")
                    .font(theme.type.title.lg.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text("hello:get")
                    .font(theme.type.label.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text(convexStore.helloValue)
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                    .multilineTextAlignment(.center)
            }
            .padding(theme.space.xl)
            .background(theme.colors.background.default)
            .navigationTitle("LaneShadow")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                convexStore.start()
            }
        }
    }
}

#Preview {
    ContentView(convexStore: ConvexStore.preview)
        .laneShadowTheme()
}
