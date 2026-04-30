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
            viewModel: AuthScreenViewModel(
                auth: appEnvironment.clerkAuth,
                mode: viewModel.isSubmitting ? .submitting : .newUser,
                email: viewModel.email.isEmpty ? "new@ridelaneshadow.com" : viewModel.email,
                password: viewModel.password,
                displayName: viewModel.name,
                errorMessage: viewModel.errorMessage,
                isSubmitting: viewModel.isSubmitting
            )
        ) {
            updateRoutingFromSharedAuth()
        }
        .navigationTitle("Sign Up")
    }

    private func updateRoutingFromSharedAuth() {
        appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        if appState.isAuthenticated {
            appState.authRoute = nil
            appState.appRoute = .home
        }
    }
}
