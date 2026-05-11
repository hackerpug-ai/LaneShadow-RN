import Clerk
import LaneShadowTheme
import SwiftUI

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
        let _ =
            NSLog(
                "🟢 SignInScreen.body eval: hasViewModel=\(authScreenViewModel != nil) hasVerifEmail=\(verificationEmail != nil) signInStep=\(viewModel.step)"
            )
        return Group {
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
                    },
                    onE2ESignIn: e2eSignInHandler
                )
                .onAppear { NSLog("🟢 SignInScreen.branch: AuthScreen appeared") }
            } else {
                AuthBackgroundContainer {
                    ProgressView()
                        .accessibilityIdentifier("auth.signIn.loading")
                        .onAppear {
                            NSLog("🟢 SignInScreen.branch: loading-ProgressView appeared (authScreenViewModel=nil)")
                        }
                }
            }
        }
        .onAppear {
            NSLog("🟢 SignInScreen.onAppear: hasViewModel=\(authScreenViewModel != nil)")
            initializeAuthScreenViewModelIfNeeded()
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("auth.signIn.root")
        // .navigationTitle/.toolbar removed with NavigationStack — they were generating
        // expensive preference traffic that contributed to AttributeGraph stack overflow
        // on iOS 18 real devices. (See AuthFlowView for full context.)
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
            NSLog("🟢 SignInScreen.init: already had viewModel; skip")
            return
        }
        NSLog("🟢 SignInScreen.init: creating AuthScreenViewModel")
        authScreenViewModel = makeAuthScreenViewModel(auth: appEnvironment.clerkAuth)
        NSLog("🟢 SignInScreen.init: AuthScreenViewModel assigned (now non-nil)")
    }

    private var e2eSignInHandler: (() -> Void)? {
        #if DEBUG
            guard RootView.shouldEnableE2ESignInForUITesting() else { return nil }
            let environment = appEnvironment
            return {
                NSLog("🔵 E2E_HANDLER: tapped, starting Task")
                Task {
                    // Read credentials from environment variables
                    let env = ProcessInfo.processInfo.environment
                    let emailVal = env["CLERK_TEST_EMAIL"] ?? "<nil>"
                    let passwordPresent = env["CLERK_TEST_PASSWORD"] != nil
                    NSLog("🔵 E2E_HANDLER: email='\(emailVal)' passwordPresent=\(passwordPresent)")
                    guard let email = env["CLERK_TEST_EMAIL"],
                          let password = env["CLERK_TEST_PASSWORD"]
                    else {
                        NSLog("❌ E2E Sign In failed: CLERK_TEST_EMAIL or CLERK_TEST_PASSWORD not set")
                        return
                    }
                    NSLog("🔵 E2E_HANDLER: calling Clerk signIn for \(email)")

                    do {
                        // Ensure Clerk SDK has loaded its frontend config before signing in
                        try? await Clerk.shared.load()
                        NSLog("🔵 E2E_HANDLER: Clerk.shared.load() done, calling signIn")
                        // Call real Clerk sign-in API
                        let result = try await environment.clerkAuth.signIn(email: email, password: password)
                        NSLog("🔵 E2E_HANDLER: signIn result received")
                        switch result {
                        case .signedIn:
                            NSLog("🟢 E2E_HANDLER: .signedIn — calling completeAuthentication")
                            await appState.completeAuthentication(
                                clerkAuth: environment.clerkAuth,
                                convexClient: environment.convexClient
                            )
                            NSLog(
                                "🟢 E2E_HANDLER: completeAuthentication done, isAuthenticated=\(appState.isAuthenticated)"
                            )
                            if appState.isAuthenticated {
                                viewModel.step = .signedIn
                            }
                        case .verificationRequired:
                            NSLog("❌ E2E Sign In failed: verification required (check test account)")
                        }
                    } catch {
                        NSLog("❌ E2E Sign In threw: \(error.localizedDescription)")
                    }
                }
            }
        #else
            return nil
        #endif
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
            AuthMapBackdrop()

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
