import Foundation
import LaneShadowTheme
import SwiftUI

enum AuthScreenDesignCopy {
    static let continueWithApple = "Continue with Apple"
    static let continueWithGoogle = "Continue with Google"
    static let continueWithEmail = "Continue with Email"
    static let emailDivider = "OR CONTINUE WITH EMAIL"
}

struct AuthScreen: View {
    @Environment(\.theme) private var theme
    @Environment(\.colorScheme) private var colorScheme

    @Bindable private var viewModel: AuthScreenViewModel
    @State private var passwordVisibility = AuthPasswordVisibilityState()
    @State private var didDispatchTerminalMode = false

    private let onBack: (() -> Void)?
    private let onSignUpRequested: (() -> Void)?
    private let onAuthenticated: () -> Void
    private let onVerificationRequired: (String) -> Void
    private let onE2ESignIn: (() -> Void)?
    private let authIdentifierPrefix: String
    private let showsSignUpEntry: Bool

    init(
        viewModel: AuthScreenViewModel,
        onBack: (() -> Void)? = nil,
        showsSignUpEntry: Bool = false,
        authIdentifierPrefix: String = "auth.signIn",
        onSignUpRequested: (() -> Void)? = nil,
        onAuthenticated: @escaping () -> Void = {},
        onVerificationRequired: @escaping (String) -> Void = { _ in },
        onE2ESignIn: (() -> Void)? = nil
    ) {
        self.viewModel = viewModel
        self.onBack = onBack
        self.showsSignUpEntry = showsSignUpEntry
        self.authIdentifierPrefix = authIdentifierPrefix
        self.onSignUpRequested = onSignUpRequested
        self.onAuthenticated = onAuthenticated
        self.onVerificationRequired = onVerificationRequired
        self.onE2ESignIn = onE2ESignIn
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                backgroundCanvas

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        brandHeader
                            .padding(.bottom, theme.space.xl)

                        Spacer(minLength: theme.space.xxl)

                        VStack(alignment: .leading, spacing: theme.space.xl) {
                            headlineBlock
                            formStack
                        }
                        .padding(.bottom, theme.space.xl)

                        footer
                    }
                    .padding(.horizontal, theme.space.lg)
                    .padding(.top, theme.space.lg)
                    .padding(.bottom, theme.space.lg)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(minHeight: proxy.size.height, alignment: .top)
                }
                .scrollIndicators(.hidden)
            }
        }
        .accessibilityIdentifier("authscreen-\(viewModel.mode.accessibilityValue)")
        .onChange(of: viewModel.mode) { _, mode in
            dispatchTerminalModeIfNeeded(mode)
        }
    }

    private var backgroundCanvas: some View {
        ZStack {
            LSPaperMap(overlayStyle: .contours)
                .ignoresSafeArea()

            LinearGradient(
                colors: [
                    LaneShadowTheme.color.surface.overlay.opacity(colorScheme == .dark ? 0.72 : 0.54),
                    LaneShadowTheme.color.surface.overlay.opacity(colorScheme == .dark ? 0.62 : 0.42),
                    LaneShadowTheme.color.surface.glass.opacity(colorScheme == .dark ? 0.72 : 0.76),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        }
        .accessibilityIdentifier("authscreen-paper-contour-background")
    }

    private var brandHeader: some View {
        HStack(spacing: theme.space.sm) {
            if showsBackToEntry {
                Button {
                    handleBackTap()
                } label: {
                    LSIcon(name: .chevL, size: .sm, color: .primary)
                        .frame(width: theme.space.lg, height: theme.space.lg)
                }
                .frame(width: theme.space.xl, height: theme.space.xl)
                .background(LaneShadowTheme.color.surface.glass)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(LaneShadowTheme.color.border.glass, lineWidth: theme.borderWidth.thin)
                )
                .accessibilityLabel("Back")
                .accessibilityIdentifier("authscreen-back-to-entry")
            }

            ZStack {
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                    .fill(LaneShadowTheme.color.signal.whisper)
                    .overlay(
                        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                            .stroke(LaneShadowTheme.color.signal.tint, lineWidth: theme.borderWidth.thin)
                    )

                LSIcon(name: .compass, size: .md, color: .signal)
            }
            .frame(width: theme.space.xxl, height: theme.space.xxl)
            .accessibilityHidden(true)

            LSText("LaneShadow", variant: .opinion.sm, color: .primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityIdentifier("authscreen-brand")
    }

    private var showsBackToEntry: Bool {
        switch viewModel.mode {
        case .emailEntry, .invalidEmail, .existingUser, .newUser:
            true
        case .entry, .submitting, .signedIn, .verificationRequired:
            false
        }
    }

    private var headlineBlock: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            headlineText
                .font(theme.type.opinion.xl.font)
                .foregroundStyle(LaneShadowTheme.color.content.primary)
                .accessibilityAddTraits(.isHeader)

            Text(configuration.subhead)
                .font(theme.type.body.md.font)
                .italic()
                .foregroundStyle(LaneShadowTheme.color.content.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var headlineText: Text {
        switch viewModel.mode {
        case .existingUser:
            Text("Welcome ") + Text("back.").italic().foregroundColor(LaneShadowTheme.color.signal.default)
        case .newUser:
            Text("Set ") + Text("up").italic().foregroundColor(LaneShadowTheme.color.signal.default) + Text(" shop.")
        case .entry, .emailEntry, .invalidEmail, .submitting, .signedIn, .verificationRequired:
            Text("Saddle ") + Text("up.").italic().foregroundColor(LaneShadowTheme.color.signal.default)
        }
    }

    private var formStack: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            branchContent
            signUpEntry
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(configuration.formAccessibilityLabel)
        .accessibilityIdentifier("authscreen-form")
    }

    private var branchContent: AnyView {
        // Keep this branch boundary type-erased. The fully generic ViewBuilder
        // shape overflows the main-thread stack on physical devices while Swift
        // resolves SwiftUI metadata during first layout.
        switch viewModel.mode {
        case .entry:
            AnyView(entryBranch)
        case .existingUser:
            AnyView(branchStack {
                existingUserBranch
                primaryCTA
            })
        case .newUser:
            AnyView(branchStack {
                newUserBranch
                primaryCTA
            })
        case .signedIn:
            AnyView(authenticatedTransitionBranch)
        case .emailEntry, .invalidEmail, .submitting, .verificationRequired:
            AnyView(branchStack {
                emailEntryBranch
                primaryCTA
            })
        }
    }

    private func branchStack(@ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: theme.space.md, content: content)
    }

    private var entryBranch: some View {
        VStack(spacing: theme.space.sm) {
            LSAuthProviderButton(provider: .apple, isDisabled: viewModel.isSubmitting) {
                Task { await authenticateWithProvider(.apple) }
            }
            LSAuthProviderButton(provider: .google, isDisabled: viewModel.isSubmitting) {
                Task { await authenticateWithProvider(.google) }
            }
            LSAuthProviderButton(provider: .email, isDisabled: viewModel.isSubmitting) {
                viewModel.selectEmailEntry()
            }

            #if DEBUG
                if Self.isUITestE2EEnabled, let onE2ESignIn {
                    e2eSignInButton(action: onE2ESignIn)
                }
            #endif

            if let errorMessage = viewModel.errorMessage, viewModel.mode == .entry {
                LSText(errorMessage, variant: .body.sm, color: .danger)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, theme.space.xs)
                    .accessibilityIdentifier("authscreen-entry-error")
            }
        }
        // NOTE: do not set .accessibilityIdentifier on this VStack — SwiftUI's
        // `accessibilityIdentifier` modifier on a container view bubbles down
        // and clobbers the identifiers on the per-button children, breaking
        // E2E selectors like `auth.signIn.continueWithEmail` and
        // `auth.signIn.bypassAuth`.
    }

    #if DEBUG
        private func e2eSignInButton(action: @escaping () -> Void) -> some View {
            Button(action: action) {
                HStack(spacing: theme.space.sm) {
                    Image(systemName: "ladybug")
                        .font(theme.type.label.md.font)
                        .foregroundStyle(LaneShadowTheme.color.status.error.default)
                        .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                    LSText("E2E Sign In (real Clerk)", variant: .label.md, color: .danger)
                }
                .frame(maxWidth: .infinity, minHeight: theme.control.minHeight)
                .padding(.horizontal, theme.space.md)
                .background(LaneShadowTheme.color.status.error.default.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                        .stroke(
                            LaneShadowTheme.color.status.error.default.opacity(0.6),
                            style: StrokeStyle(lineWidth: theme.borderWidth.thin, dash: [4, 3])
                        )
                )
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("auth.signIn.e2eSignIn")
            .accessibilityLabel("E2E Sign In with real Clerk authentication")
        }
    #endif

    private var emailEntryBranch: some View {
        LSFormField(
            label: "Email",
            value: $viewModel.email,
            placeholder: "you@example.com",
            error: viewModel.mode == .invalidEmail ? (viewModel.errorMessage ?? "Enter a valid email address.") : nil,
            state: viewModel.isSubmitting ? .disabled : .default,
            inputAccessibilityIdentifier: "\(authIdentifierPrefix).email"
        )
        .accessibilityIdentifier("authscreen-email-field")
    }

    private var authenticatedTransitionBranch: some View {
        HStack(spacing: theme.space.sm) {
            LSSpinner()
                .scaleEffect(0.72)
                .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)

            LSText("Finishing sign in...", variant: .body.md, color: .secondary)
        }
        .frame(maxWidth: .infinity, minHeight: theme.control.minHeight, alignment: .center)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Finishing sign in")
        .accessibilityIdentifier("authscreen-authenticated-transition")
    }

    private var existingUserBranch: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            HStack(spacing: theme.space.sm) {
                LSIconSymbolIOS(name: "check", size: theme.iconSize.small, color: .signal)
                Text(viewModel.email)
                    .font(theme.type.body.sm.font.weight(.semibold))
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
                    .lineLimit(1)
                    .truncationMode(.middle)

                Spacer(minLength: theme.space.sm)

                Button("Edit") {
                    viewModel.editEmail()
                }
                .font(theme.type.label.sm.font)
                .foregroundStyle(LaneShadowTheme.color.signal.default)
                .accessibilityIdentifier("authscreen-edit-email")
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, theme.space.sm)
            .background(LaneShadowTheme.color.status.success.default.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                    .stroke(
                        LaneShadowTheme.color.status.success.default.opacity(0.25),
                        lineWidth: theme.borderWidth.thin
                    )
            )
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Email recognized \(viewModel.email)")
            .accessibilityIdentifier("authscreen-existing-user-row")

            passwordField(helperText: nil, error: viewModel.errorMessage)

            Button("Forgot password?") {}
                .font(theme.type.label.sm.font)
                .foregroundStyle(LaneShadowTheme.color.signal.default)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .accessibilityIdentifier("authscreen-forgot-password")
        }
    }

    private var newUserBranch: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            HStack(alignment: .top, spacing: theme.space.sm) {
                LSIcon(name: .sparkle, size: .sm, color: .signal)
                    .padding(.top, theme.space.xs)

                Text("Looks like you are new here. ")
                    .font(theme.type.body.sm.font)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
                    + Text("Create your password")
                    .font(theme.type.body.sm.font.weight(.semibold))
                    .foregroundColor(LaneShadowTheme.color.signal.default)
                    + Text(" to save rides across devices.")
                    .font(theme.type.body.sm.font)
                    .foregroundColor(LaneShadowTheme.color.content.primary)
            }
            .padding(theme.space.md)
            .background(LaneShadowTheme.color.signal.whisper)
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous))
            .overlay(alignment: .leading) {
                Rectangle()
                    .fill(LaneShadowTheme.color.signal.default)
                    .frame(width: theme.borderWidth.thick)
            }
            .accessibilityIdentifier("authscreen-new-user-prompt")

            LSFormField(
                label: "Display name",
                value: $viewModel.displayName,
                placeholder: "Jamie Miller",
                inputAccessibilityIdentifier: "\(authIdentifierPrefix).name"
            )
            .accessibilityIdentifier("authscreen-display-name-field")

            passwordField(helperText: "Use at least 8 characters.", error: viewModel.errorMessage)
        }
    }

    private func passwordField(helperText: String?, error: String?) -> some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            LSFormField(
                label: "Password",
                value: $viewModel.password,
                placeholder: configuration.passwordPlaceholder,
                error: error,
                helperText: helperText,
                isSecureEntry: passwordVisibility.isSecureEntry && !Self.isRunningUITests,
                inputAccessibilityIdentifier: "\(authIdentifierPrefix).password"
            )

            Button(passwordVisibility.isSecureEntry ? "Show password" : "Hide password") {
                passwordVisibility.toggle()
            }
            .font(theme.type.label.sm.font)
            .foregroundStyle(LaneShadowTheme.color.signal.default)
            .accessibilityIdentifier("authscreen-password-visibility")
        }
        .accessibilityIdentifier("authscreen-password-field")
    }

    private var primaryCTA: some View {
        ZStack {
            LSButton(
                configuration.ctaTitle,
                isDisabled: viewModel.isSubmitting,
                isFullWidth: true
            ) {
                Task { await submitPrimaryAction() }
            }
            .accessibilityIdentifier("\(authIdentifierPrefix).submit")
            .opacity(viewModel.isSubmitting ? 0 : 1)

            if viewModel.isSubmitting {
                LSSpinner()
                    .scaleEffect(0.72)
                    .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                    .accessibilityIdentifier("authscreen-submit-spinner")
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("authscreen-primary-cta")
    }

    @ViewBuilder
    private var signUpEntry: some View {
        if showsSignUpEntry, viewModel.mode != .entry, viewModel.mode != .signedIn {
            Button("Create Account") {
                onSignUpRequested?()
            }
            .font(theme.type.label.md.font)
            .foregroundStyle(LaneShadowTheme.color.signal.default)
            .frame(maxWidth: .infinity, alignment: .center)
            .accessibilityLabel("Create Account")
            .accessibilityIdentifier("auth.signUp.entry")
        }
    }

    private var footer: some View {
        Text("By continuing, you agree to our ")
            .font(theme.type.body.sm.font)
            .foregroundStyle(LaneShadowTheme.color.content.tertiary)
            + Text("Terms")
            .font(theme.type.body.sm.font)
            .underline()
            .foregroundColor(LaneShadowTheme.color.content.secondary)
            + Text(" & ")
            .font(theme.type.body.sm.font)
            .foregroundColor(LaneShadowTheme.color.content.tertiary)
            + Text("Privacy Policy")
            .font(theme.type.body.sm.font)
            .underline()
            .foregroundColor(LaneShadowTheme.color.content.secondary)
    }

    private var configuration: AuthScreenConfiguration {
        AuthScreenConfiguration(mode: viewModel.mode)
    }

    private func authenticateWithProvider(_ provider: LSAuthProvider) async {
        do {
            switch provider {
            case .apple:
                try await viewModel.signInWithApple()
            case .google:
                try await viewModel.signInWithGoogle()
            case .email:
                viewModel.selectEmailEntry()
                return
            }
            dispatchTerminalModeIfNeeded(viewModel.mode)
        } catch is CancellationError {
            viewModel.errorMessage = nil
        } catch {
            viewModel.errorMessage = error.localizedDescription
        }
    }

    private func submitPrimaryAction() async {
        await viewModel.submitEmailBranch()
        dispatchTerminalModeIfNeeded(viewModel.mode)
    }

    private func handleBackTap() {
        if let onBack {
            onBack()
        } else {
            viewModel.backToEntry()
        }
    }

    private func dispatchTerminalModeIfNeeded(_ mode: AuthScreenMode) {
        switch mode {
        case .signedIn:
            guard !didDispatchTerminalMode else { return }
            didDispatchTerminalMode = true
            onAuthenticated()
        case .verificationRequired:
            guard !didDispatchTerminalMode else { return }
            didDispatchTerminalMode = true
            onVerificationRequired(viewModel.email)
        case .entry, .emailEntry, .existingUser, .newUser, .invalidEmail, .submitting:
            didDispatchTerminalMode = false
        }
    }

    private static var isRunningUITests: Bool {
        ProcessInfo.processInfo.arguments.contains("-UITesting")
    }

    #if DEBUG
        fileprivate static var isUITestE2EEnabled: Bool {
            ProcessInfo.processInfo.arguments.contains("-LaneShadowUITestE2E")
        }
    #endif
}

struct AuthScreenConfiguration: Equatable {
    let headline: String
    let subhead: String
    let ctaTitle: String
    let formAccessibilityLabel: String
    let passwordPlaceholder: String

    init(mode: AuthScreenMode) {
        switch mode {
        case .entry:
            headline = "Saddle up."
            subhead = "Sign in or create an account to start planning rides."
            ctaTitle = "Continue"
            formAccessibilityLabel = "Choose a sign-in option"
            passwordPlaceholder = "Enter your password"
        case .existingUser:
            headline = "Welcome back."
            subhead = "Enter your password to pick up where you left off."
            ctaTitle = "Sign in"
            formAccessibilityLabel = "Sign in"
            passwordPlaceholder = "Enter your password"
        case .newUser:
            headline = "Set up shop."
            subhead = "Create a LaneShadow account to save rides and preferences."
            ctaTitle = "Create account"
            formAccessibilityLabel = "Create account"
            passwordPlaceholder = "Create a password"
        case .emailEntry, .invalidEmail, .submitting, .signedIn, .verificationRequired:
            headline = "Saddle up."
            subhead = "Enter the email tied to your rides."
            ctaTitle = "Continue"
            formAccessibilityLabel = "Sign in or create account"
            passwordPlaceholder = "Enter your password"
        }
    }
}

private extension AuthScreenMode {
    var accessibilityValue: String {
        switch self {
        case .entry:
            "entry"
        case .emailEntry:
            "email-entry"
        case .existingUser:
            "existing-user"
        case .newUser:
            "new-user"
        case .invalidEmail:
            "invalid-email"
        case .submitting:
            "submitting"
        case .signedIn:
            "signed-in"
        case .verificationRequired:
            "verification-required"
        }
    }
}
