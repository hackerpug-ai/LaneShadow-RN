import SwiftUI

struct AppFlowView: View {
    enum SessionDestination {
        case planning
        case errorScreen
    }

    @Environment(\.appEnvironment) private var appEnvironment

    let route: AppState.AppRoute?
    let appState: AppState

    init(route: AppState.AppRoute? = nil, appState: AppState = AppState()) {
        self.route = route
        self.appState = appState
    }

    var body: some View {
        NavigationStack {
            switch route {
            case let .session(id):
                let errorMessage = appEnvironment.chatStore.flowState.errorMessage ?? "Unknown error"

                switch Self.sessionDestination(for: appEnvironment.chatStore.flowState.phase) {
                case .errorScreen:
                    ErrorScreenContainer(
                        viewModel: ErrorScreenViewModel(
                            error: LaneShadowError.map(rawMessage: errorMessage),
                            chatStore: appEnvironment.chatStore,
                            appState: appState
                        )
                    )
                case .planning:
                    SessionDestinationView(
                        sessionID: id,
                        environment: appEnvironment,
                        appState: appState
                    )
                }
            case .home, .none:
                AppHomeView()
            }
        }
    }

    static func sessionDestination(for flowPhase: RideFlowPhaseKind) -> SessionDestination {
        switch flowPhase {
        case .error:
            .errorScreen
        default:
            .planning
        }
    }
}

private struct SessionDestinationView: View {
    @State private var viewModel: PlanningViewModel
    @Bindable private var chatStore: ChatStore
    let appState: AppState

    init(sessionID: String, environment: AppEnvironment, appState: AppState) {
        _chatStore = Bindable(environment.chatStore)
        self.appState = appState

        _viewModel = State(
            initialValue: PlanningViewModel(
                chatStore: environment.chatStore,
                sessionStore: environment.sessionStore,
                convexClient: environment.convexClient,
                fallbackSessionId: sessionID,
                appState: appState
            )
        )
    }

    var body: some View {
        switch AppFlowView.sessionDestination(for: chatStore.flowState.phase) {
        case .errorScreen:
            let errorMessage = chatStore.flowState.errorMessage ?? "Unknown error"
            ErrorScreenContainer(
                viewModel: ErrorScreenViewModel(
                    error: LaneShadowError.map(rawMessage: errorMessage),
                    chatStore: chatStore,
                    appState: appState
                )
            )
        case .planning:
            PlanningScreenContainer(viewModel: viewModel)
                .navigationTitle("Session")
        }
    }
}
