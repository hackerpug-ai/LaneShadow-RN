import LaneShadowTheme
import SwiftUI
import UIKit

struct SignInScreen: View {
    @Environment(\.theme) private var theme
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignInViewModel
    @State private var passwordVisibility = AuthPasswordVisibilityState()

    init(appState: AppState, viewModel: SignInViewModel) {
        self.appState = appState
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
                    AuthSecureTextEntry(
                        value: $viewModel.password,
                        placeholder: "Password",
                        visibility: $passwordVisibility
                    )
                    LSButton("Sign in", isDisabled: viewModel.isSubmitting) {
                        Task {
                            await viewModel.submit()
                            updateRoutingFromSharedAuth()
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
                            updateRoutingFromSharedAuth()
                        } catch {
                            viewModel.errorMessage = error.localizedDescription
                        }
                    }
                }

                LSAuthProviderButton(provider: .google) {
                    Task {
                        do {
                            try await appEnvironment.clerkAuth.signInWithGoogle()
                            updateRoutingFromSharedAuth()
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

    private func updateRoutingFromSharedAuth() {
        appState.updateAuthenticationState(from: appEnvironment.clerkAuth)
        if appState.isAuthenticated {
            appState.authRoute = nil
            appState.appRoute = .home
            viewModel.step = .signedIn
        }
    }
}

struct AuthBackgroundContainer<Content: View>: View {
    enum ImageSource: Equatable {
        case authBackground
        case fallback
    }

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
        if Self.resolveImageSource(imageLoader: { UIImage(named: $0) }) == .authBackground,
           let image = UIImage(named: "AuthBackground") {
            Image(uiImage: image)
        } else {
            Image(systemName: "mountain.2.fill")
        }
    }

    static func resolveImageSource(imageLoader: (String) -> UIImage?) -> ImageSource {
        imageLoader("AuthBackground") == nil ? .fallback : .authBackground
    }
}
