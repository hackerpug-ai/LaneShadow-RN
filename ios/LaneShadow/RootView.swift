import SwiftUI

struct RootView: View {
    enum ActiveFlow {
        case auth
        case app
    }

    @Bindable var convexStore: ConvexStore
    @State private var appState: AppState
    @Environment(\.appEnvironment) private var appEnvironment

    init(convexStore: ConvexStore, appState: AppState = AppState()) {
        _convexStore = Bindable(convexStore)
        _appState = State(initialValue: appState)
    }

    var body: some View {
        Group {
            if activeFlow == .app {
                AppFlowView(route: appState.appRoute)
            } else {
                AuthFlowView(route: appState.authRoute)
            }
        }
        .onAppear {
            appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        }
        .onOpenURL { url in
            appState.handleDeepLink(url, clerkAuth: appEnvironment.clerkAuth)
        }
    }

    var activeFlow: ActiveFlow {
        appState.isAuthenticated ? .app : .auth
    }
}
