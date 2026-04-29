import LaneShadowTheme
import SwiftUI

struct SignUpScreen: View {
    @Environment(\.theme) private var theme
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignUpViewModel
    @State private var passwordVisibility = AuthPasswordVisibilityState()
    @State private var confirmPasswordVisibility = AuthPasswordVisibilityState()

    init(appState: AppState, viewModel: SignUpViewModel) {
        self.appState = appState
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        AuthBackgroundContainer {
            VStack(spacing: theme.space.md) {
                LSText("Create account", variant: .title.md)
                LSTextField(value: $viewModel.name, placeholder: "Name")
                LSTextField(value: $viewModel.email, placeholder: "Email")
                AuthSecureTextEntry(
                    value: $viewModel.password,
                    placeholder: "Password",
                    visibility: $passwordVisibility
                )
                AuthSecureTextEntry(
                    value: $viewModel.confirmPassword,
                    placeholder: "Confirm password",
                    visibility: $confirmPasswordVisibility
                )
                LSButton("Create account", isDisabled: viewModel.isSubmitting) {
                    Task {
                        await viewModel.submit()
                        updateRoutingFromSharedAuth()
                    }
                }
                if viewModel.isSubmitting {
                    LSSpinner()
                }
                if let errorMessage = viewModel.errorMessage {
                    LSText(errorMessage, variant: .body.sm, color: .danger)
                }
            }
            .padding(theme.space.lg)
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
