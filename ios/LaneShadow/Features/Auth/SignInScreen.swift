import LaneShadowTheme
import SwiftUI
import UIKit

struct SignInScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignInViewModel
    @State private var authScreenViewModel: AuthScreenViewModel?
    @State private var verificationEmail: String?

    init(appState: AppState, viewModel: SignInViewModel) {
        self.appState = appState
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            if let verificationEmail {
                SignInVerificationScreen(
                    email: verificationEmail,
                    appState: appState
                )
            } else if let authScreenViewModel {
                AuthScreen(
                    viewModel: authScreenViewModel,
                    showsSignUpEntry: true,
                    onSignUpRequested: {
                        appState.authRoute = .signUp
                    },
                    onAuthenticated: {
                        updateRoutingFromSharedAuth()
                    },
                    onVerificationRequired: { email in
                        verificationEmail = email
                    }
                )
            } else {
                ProgressView()
                    .accessibilityIdentifier("auth.signIn.loading")
            }
        }
        .onAppear {
            initializeAuthScreenViewModelIfNeeded()
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("auth.signIn.root")
        .navigationTitle("Sign In")
        .toolbar(.hidden, for: .navigationBar)
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
            viewModel.email.isEmpty ? .entry : .emailEntry
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

    private func initializeAuthScreenViewModelIfNeeded() {
        guard authScreenViewModel == nil else {
            return
        }
        authScreenViewModel = makeAuthScreenViewModel(auth: appEnvironment.clerkAuth)
    }
}

private struct SignInVerificationScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment
    @Environment(\.theme) private var theme

    let email: String
    let appState: AppState

    @State private var code = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ZStack {
            LSPaperMap(overlayStyle: .contours)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: theme.space.lg) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText("Verify your account", variant: .opinion.lg, color: .primary)
                        .accessibilityAddTraits(.isHeader)

                    LSText("Enter the verification code sent to \(email).", variant: .body.md, color: .secondary)
                }

                LSFormField(
                    label: "Verification code",
                    value: $code,
                    placeholder: "123456",
                    error: errorMessage,
                    state: isSubmitting ? .disabled : .default,
                    inputAccessibilityIdentifier: "auth.signIn.verification.code"
                )

                ZStack {
                    LSButton(
                        "Verify",
                        isDisabled: isSubmitting || code.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    ) {
                        Task { await submitVerification() }
                    }
                    .accessibilityIdentifier("auth.signIn.verification.submit")
                    .opacity(isSubmitting ? 0 : 1)

                    if isSubmitting {
                        LSSpinner()
                            .scaleEffect(0.72)
                            .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(theme.space.lg)
            .frame(maxWidth: 350, alignment: .leading)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("auth.signIn.verification.root")
    }

    private func submitVerification() async {
        let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedCode.isEmpty else {
            errorMessage = "Enter your verification code."
            return
        }

        isSubmitting = true
        errorMessage = nil

        do {
            try await appEnvironment.clerkAuth.completeSignInVerification(code: trimmedCode)
            await appState.completeAuthentication(
                clerkAuth: appEnvironment.clerkAuth,
                convexClient: appEnvironment.convexClient
            )
        } catch {
            errorMessage = error.localizedDescription
        }

        isSubmitting = false
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
