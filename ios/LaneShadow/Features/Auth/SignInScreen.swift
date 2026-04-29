import LaneShadowTheme
import SwiftUI
import UIKit

struct SignInScreen: View {
    @Environment(\.theme) private var theme
    @Environment(\.appEnvironment) private var appEnvironment

    @State private var viewModel: SignInViewModel

    init(viewModel: SignInViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        AuthBackgroundContainer {
            VStack(spacing: theme.space.md) {
                LSText("Sign in", variant: .title.md)

                if viewModel.step == .email {
                    LSTextField(value: $viewModel.email, placeholder: "Email")
                    LSButton("Continue") {
                        viewModel.advanceFromEmail()
                    }
                }

                if viewModel.step == .password || viewModel.step == .submitting {
                    LSTextField(value: $viewModel.password, placeholder: "Password")
                    LSButton("Sign in", isDisabled: viewModel.isSubmitting) {
                        Task {
                            await viewModel.submit()
                        }
                    }
                }

                if viewModel.step == .submitting {
                    LSSpinner()
                }

                if let errorMessage = viewModel.errorMessage {
                    LSText(errorMessage, variant: .body.sm, color: .danger)
                }

                LSAuthProviderButton(provider: .apple) {
                    Task {
                        do {
                            try await appEnvironment.clerkAuth.signInWithApple()
                            viewModel.step = .signedIn
                        } catch {
                            viewModel.errorMessage = error.localizedDescription
                        }
                    }
                }

                LSAuthProviderButton(provider: .google) {
                    Task {
                        do {
                            try await appEnvironment.clerkAuth.signInWithGoogle()
                            viewModel.step = .signedIn
                        } catch {
                            viewModel.errorMessage = error.localizedDescription
                        }
                    }
                }
            }
            .padding(theme.space.lg)
        }
        .navigationTitle("Sign In")
    }
}

struct AuthBackgroundContainer<Content: View>: View {
    @Environment(\.theme) private var theme
    @ViewBuilder let content: Content

    var body: some View {
        ZStack {
            authBackgroundImage
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
                .opacity(theme.opacity.values["40"] ?? theme.opacity.disabled)

            content
        }
    }

    private var authBackgroundImage: Image {
        if let image = UIImage(named: "AuthBackground") {
            Image(uiImage: image)
        } else {
            Image(systemName: "mountain.2.fill")
        }
    }
}
