import LaneShadowTheme
import SwiftUI
import UIKit

struct SignInScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignInViewModel

    init(appState: AppState, viewModel: SignInViewModel) {
        self.appState = appState
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        AuthScreen(
            viewModel: makeAuthScreenViewModel(auth: appEnvironment.clerkAuth)
        ) {
            updateRoutingFromSharedAuth()
        }
        .accessibilityIdentifier("auth.signIn.root")
        .navigationTitle("Sign In")
    }

    func makeAuthScreenViewModel(auth: ClerkAuth) -> AuthScreenViewModel {
        AuthScreenViewModel(
            auth: auth,
            mode: authScreenMode,
            email: viewModel.email,
            password: viewModel.password,
            errorMessage: viewModel.errorMessage,
            isSubmitting: viewModel.isSubmitting,
            emailResolver: Self.productionEmailResolver
        )
    }

    static func productionEmailResolver(_: String) async -> AuthEmailResolution {
        .existingUser
    }

    private var authScreenMode: AuthScreenMode {
        switch viewModel.step {
        case .email:
            .emailEntry
        case .password:
            .existingUser
        case .submitting:
            .submitting
        case .signedIn:
            .signedIn
        }
    }

    private func updateRoutingFromSharedAuth() {
        let environment = appEnvironment
        Task {
            await appState.completeAuthentication(
                clerkAuth: environment.clerkAuth,
                convexClient: environment.convexClient
            )
            if appState.isAuthenticated {
                viewModel.step = .signedIn
            }
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
        let imageSource = Self.resolveImageSource(imageLoader: { UIImage(named: $0) })
        let authBackground = UIImage(named: "AuthBackground")
        if imageSource == .authBackground, let image = authBackground {
            return Image(uiImage: image)
        } else {
            return Image(systemName: "mountain.2.fill")
        }
    }

    static func resolveImageSource(imageLoader: (String) -> UIImage?) -> ImageSource {
        imageLoader("AuthBackground") == nil ? .fallback : .authBackground
    }
}
