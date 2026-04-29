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
            handleSystemOpenURL(url)
        }
    }

    var activeFlow: ActiveFlow {
        appState.isAuthenticated ? .app : .auth
    }

    func handleSystemOpenURL(_ url: URL) {
        handleSystemOpenURL(url, clerkAuth: appEnvironment.clerkAuth)
    }

    func handleSystemOpenURL(_ url: URL, clerkAuth: ClerkAuth) {
        handleIncomingURL(url, clerkAuth: clerkAuth)
    }

    func handleIncomingURL(_ url: URL, clerkAuth: ClerkAuth) {
        appState.handleDeepLink(url, clerkAuth: clerkAuth)
    }
}
