import SwiftUI

struct AppFlowView: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let route: AppState.AppRoute?

    init(route: AppState.AppRoute? = nil) {
        self.route = route
    }

    var body: some View {
        NavigationStack {
            switch route {
            case let .session(id):
                SessionDestinationView(
                    sessionID: id,
                    environment: appEnvironment
                )
            case .home, .none:
                AppHomeView()
            }
        }
    }
}

private struct SessionDestinationView: View {
    @State private var viewModel: PlanningViewModel
    let environment: AppEnvironment
    let sessionID: String

    init(sessionID: String, environment: AppEnvironment) {
        self.environment = environment
        self.sessionID = sessionID

        _viewModel = State(
            initialValue: PlanningViewModel(
                chatStore: environment.chatStore,
                sessionStore: environment.sessionStore,
                convexClient: environment.convexClient,
                fallbackSessionId: sessionID
            )
        )
    }

    var body: some View {
        PlanningScreenContainer(viewModel: viewModel)
            .navigationTitle("Session")
    }
}
