import SwiftUI

struct SignUpScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment

    let appState: AppState
    @State private var viewModel: SignUpViewModel
    @State private var authScreenViewModel: AuthScreenViewModel?
    @State private var verificationEmail: String?

    init(appState: AppState, viewModel: SignUpViewModel) {
        self.appState = appState
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            if let verificationEmail {
                SignUpVerificationScreen(
                    email: verificationEmail,
                    appState: appState
                )
            } else if let authScreenViewModel {
                AuthScreen(
                    viewModel: authScreenViewModel,
                    onBack: {
                        appState.authRoute = .signIn
                    },
                    authIdentifierPrefix: "auth.signUp",
                    onAuthenticated: {
                        updateRoutingFromSharedAuth()
                    },
                    onVerificationRequired: { email in
                        verificationEmail = email
                    }
                )
            } else {
                AuthBackgroundContainer {
                    ProgressView()
                        .accessibilityIdentifier("auth.signUp.loading")
                }
            }
        }
        .onAppear {
            initializeAuthScreenViewModelIfNeeded()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
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
        let environment = appEnvironment
        Task {
            await appState.completeAuthentication(
                clerkAuth: environment.clerkAuth,
                convexClient: environment.convexClient
            )
        }
    }

    private func initializeAuthScreenViewModelIfNeeded() {
        guard authScreenViewModel == nil else {
            return
        }
        authScreenViewModel = makeAuthScreenViewModel(auth: appEnvironment.clerkAuth)
    }
}

struct SignUpVerificationScreen: View {
    @Environment(\.appEnvironment) private var appEnvironment
    @Environment(\.theme) private var theme

    let email: String
    let appState: AppState

    @State private var code = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ZStack {
            AuthMapBackdrop()

            VStack(alignment: .leading, spacing: theme.space.lg) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    LSText("Check your email", variant: .opinion.lg, color: .primary)
                        .accessibilityAddTraits(.isHeader)

                    LSText("Enter the verification code sent to \(email).", variant: .body.md, color: .secondary)
                }

                LSFormField(
                    label: "Verification code",
                    value: $code,
                    placeholder: "123456",
                    error: errorMessage,
                    state: isSubmitting ? .disabled : .default,
                    inputAccessibilityIdentifier: "auth.signUp.verification.code"
                )

                ZStack {
                    LSButton(
                        "Verify",
                        isDisabled: isSubmitting || code.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    ) {
                        Task { await submitVerification() }
                    }
                    .accessibilityIdentifier("auth.signUp.verification.submit")
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
        .accessibilityIdentifier("auth.signUp.verification.root")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
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
            try await appEnvironment.clerkAuth.completeSignUpVerification(code: trimmedCode)
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
