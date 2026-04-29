import SwiftUI

struct RootView: View {
    @Bindable var convexStore: ConvexStore
    @State private var appState = AppState()
    @Environment(\.appEnvironment) private var appEnvironment

    var body: some View {
        Group {
            if appState.isAuthenticated {
                AppFlowView()
            } else {
                AuthFlowView()
            }
        }
        .onAppear {
            appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        }
        .onOpenURL { url in
            appState.handleDeepLink(url, clerkAuth: appEnvironment.clerkAuth)
        }
    }
}
