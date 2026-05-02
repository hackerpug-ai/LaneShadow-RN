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
                    convexClient: appEnvironment.convexClient
                )
            case .home, .none:
                AppHomeView()
            }
        }
    }
}

private struct SessionDestinationView: View {
    @State private var viewModel: PlanningViewModel
    let sessionID: String

    init(sessionID: String, convexClient: any LaneShadowPlanningDataProviding) {
        self.sessionID = sessionID

        let sessionStore = SessionStore(activeSessionId: sessionID)
        let chatStore = ChatStore(
            flowState: .planning(PlanningState(sessionId: sessionID)),
            sessionStore: sessionStore
        )
        _viewModel = State(
            initialValue: PlanningViewModel(
                chatStore: chatStore,
                sessionStore: sessionStore,
                convexClient: convexClient
            )
        )
    }

    var body: some View {
        PlanningScreenContainer(viewModel: viewModel)
            .navigationTitle("Session")
    }
}
