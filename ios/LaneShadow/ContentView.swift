import SwiftUI

struct ContentView: View {
    @Bindable var convexStore: ConvexStore

    var body: some View {
        NavigationStack {
            VStack(spacing: ThemeSpacing.large) {
                Text("LaneShadow")
                    .font(ThemeTypography.title)
                    .foregroundStyle(ThemeColor.primaryText)

                Text("hello:get")
                    .font(ThemeTypography.label)
                    .foregroundStyle(ThemeColor.secondaryText)

                Text(convexStore.helloValue)
                    .font(ThemeTypography.body)
                    .foregroundStyle(ThemeColor.secondaryText)
                    .multilineTextAlignment(.center)
            }
            .padding(ThemeSpacing.large)
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
}
