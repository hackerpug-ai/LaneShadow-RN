import LaneShadowTheme
import SwiftUI

struct SignUpScreen: View {
    @Environment(\.theme) private var theme

    @State private var viewModel: SignUpViewModel
    @State private var passwordVisibility = AuthPasswordVisibilityState()
    @State private var confirmPasswordVisibility = AuthPasswordVisibilityState()

    init(viewModel: SignUpViewModel? = nil) {
        if let viewModel {
            _viewModel = State(initialValue: viewModel)
        } else {
            _viewModel = State(initialValue: SignUpViewModel(auth: ClerkAuth()))
        }
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
}
