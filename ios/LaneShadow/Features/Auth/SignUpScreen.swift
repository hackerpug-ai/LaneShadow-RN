import SwiftUI

struct SignUpScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignUpViewModel

    init(appState: AppState, viewModel: SignUpViewModel) {
        self.appState = appState
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        AuthScreen(
            viewModel: makeAuthScreenViewModel(auth: appEnvironment.clerkAuth)
        ) {
            updateRoutingFromSharedAuth()
        }
        .navigationTitle("Sign Up")
    }

    func makeAuthScreenViewModel(auth: ClerkAuth) -> AuthScreenViewModel {
        AuthScreenViewModel(
            auth: auth,
            mode: viewModel.isSubmitting ? .submitting : authScreenMode,
            email: viewModel.email,
            password: viewModel.password,
            displayName: viewModel.name,
            errorMessage: viewModel.errorMessage,
            isSubmitting: viewModel.isSubmitting,
            emailResolver: Self.productionEmailResolver
        )
    }

    static func productionEmailResolver(_: String) async -> AuthEmailResolution {
        .newUser
    }

    private var authScreenMode: AuthScreenMode {
        viewModel.email.isEmpty ? .emailEntry : .newUser
    }

    private func updateRoutingFromSharedAuth() {
        appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        if appState.isAuthenticated {
            appState.authRoute = nil
            appState.appRoute = .home
        }
    }
}
