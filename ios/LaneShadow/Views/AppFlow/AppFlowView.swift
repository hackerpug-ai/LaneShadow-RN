import SwiftUI

struct AppFlowView: View {
    let route: AppState.AppRoute?

    init(route: AppState.AppRoute? = nil) {
        self.route = route
    }

    var body: some View {
        NavigationStack {
            switch route {
            case let .session(id):
                SessionDestinationView(sessionID: id)
            case .home, .none:
                AppHomeView()
            }
        }
    }
}

private struct SessionDestinationView: View {
    let sessionID: String

    var body: some View {
        Text("Session \(sessionID)")
            .navigationTitle("Session")
    }
}
