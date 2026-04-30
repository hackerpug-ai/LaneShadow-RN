import LaneShadowTheme
import SwiftUI

enum AuthScreenDesignCopy {
    static let continueWithApple = "Continue with Apple"
    static let continueWithGoogle = "Continue with Google"
    static let emailDivider = "OR CONTINUE WITH EMAIL"
}

struct AuthScreen: View {
    @Environment(\.theme) private var theme
    @Environment(\.colorScheme) private var colorScheme

    @State private var viewModel: AuthScreenViewModel
    @State private var passwordVisibility = AuthPasswordVisibilityState()

    private let onBack: (() -> Void)?
    private let onAuthenticated: () -> Void

    init(
        viewModel: AuthScreenViewModel,
        onBack: (() -> Void)? = nil,
        onAuthenticated: @escaping () -> Void = {}
    ) {
        _viewModel = State(initialValue: viewModel)
        self.onBack = onBack
        self.onAuthenticated = onAuthenticated
    }

    var body: some View {
        ZStack {
            backgroundCanvas
            topBar

            ScrollView {
                VStack(alignment: .leading, spacing: theme.space.lg) {
                    brandBlock
                    headlineBlock
                    formStack
                    footer
                }
                .padding(theme.space.lg)
                .frame(maxWidth: 350, alignment: .leading)
                .frame(maxWidth: .infinity, minHeight: 760, alignment: .center)
            }
            .scrollIndicators(.hidden)
            .safeAreaPadding(.top, theme.space.xxl)
            .safeAreaPadding(.bottom, theme.space.xl)
        }
        .accessibilityIdentifier("authscreen-\(viewModel.mode.accessibilityValue)")
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

    private var topBar: some View {
        VStack {
            HStack {
                Button {
                    onBack?()
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
                .accessibilityHint("Return to the previous screen")
                .accessibilityIdentifier("authscreen-back")

                Spacer()
            }
            .padding(.horizontal, theme.space.md)
            .padding(.top, theme.space.md)

            Spacer()
        }
    }

    private var brandBlock: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                    .fill(LaneShadowTheme.color.signal.whisper)
                    .overlay(
                        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                            .stroke(LaneShadowTheme.color.signal.tint, lineWidth: theme.borderWidth.thin)
                    )

                LSIcon(name: .compass, size: .lg, color: .signal)
            }
            .frame(width: theme.space.xxl, height: theme.space.xxl)
            .accessibilityHidden(true)

            LSText("LaneShadow", variant: .label.md, color: .tertiary)
        }
        .accessibilityIdentifier("authscreen-brand")
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
        case .emailEntry, .invalidEmail, .submitting, .signedIn:
            Text("Saddle ") + Text("up.").italic().foregroundColor(LaneShadowTheme.color.signal.default)
        }
    }

    private var formStack: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            socialStack
            labeledDivider
            branchContent
            primaryCTA
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(configuration.formAccessibilityLabel)
        .accessibilityIdentifier("authscreen-form")
    }

    private var socialStack: some View {
        VStack(spacing: theme.space.sm) {
            LSAuthProviderButton(provider: .apple, isDisabled: viewModel.isSubmitting) {
                Task { await authenticateWithProvider(.apple) }
            }
            LSAuthProviderButton(provider: .google, isDisabled: viewModel.isSubmitting) {
                Task { await authenticateWithProvider(.google) }
            }
        }
        .accessibilityIdentifier("authscreen-social-stack")
    }

    private var labeledDivider: some View {
        HStack(spacing: theme.space.sm) {
            LSDivider()
            LSText(AuthScreenDesignCopy.emailDivider, variant: .label.sm, color: .tertiary)
                .lineLimit(1)
                .layoutPriority(1)
            LSDivider()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(AuthScreenDesignCopy.emailDivider)
        .accessibilityIdentifier("authscreen-email-divider")
    }

    @ViewBuilder
    private var branchContent: some View {
        switch viewModel.mode {
        case .existingUser:
            existingUserBranch
        case .newUser:
            newUserBranch
        case .emailEntry, .invalidEmail, .submitting, .signedIn:
            emailEntryBranch
        }
    }

    private var emailEntryBranch: some View {
        LSFormField(
            label: "Email",
            value: $viewModel.email,
            placeholder: "you@example.com",
            error: viewModel.mode == .invalidEmail ? (viewModel.errorMessage ?? "Enter a valid email address.") : nil,
            state: viewModel.isSubmitting ? .disabled : .default,
            leadingSymbolName: "mail",
            inputAccessibilityIdentifier: "auth.signIn.email"
        )
        .accessibilityIdentifier("authscreen-email-field")
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

            passwordField(helperText: nil)

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
                placeholder: "Jamie Miller"
            )
            .accessibilityIdentifier("authscreen-display-name-field")

            passwordField(helperText: "Use at least 8 characters.")
        }
    }

    private func passwordField(helperText: String?) -> some View {
        LSFormField(
            label: "Password",
            value: $viewModel.password,
            placeholder: configuration.passwordPlaceholder,
            helperText: helperText,
            isSecureEntry: passwordVisibility.isSecureEntry,
            leadingSymbolName: "lock",
            trailingSymbolName: passwordVisibility.isSecureEntry ? "eye" : "eye.slash",
            inputAccessibilityIdentifier: "auth.signIn.password"
        )
        .overlay(alignment: .trailing) {
            Button {
                passwordVisibility.toggle()
            } label: {
                Color.clear
                    .frame(width: theme.control.minHeight, height: theme.control.minHeight)
            }
            .accessibilityLabel(passwordVisibility.isSecureEntry ? "Show password" : "Hide password")
            .accessibilityIdentifier("authscreen-password-visibility")
        }
        .accessibilityIdentifier("authscreen-password-field")
    }

    private var primaryCTA: some View {
        ZStack {
            LSButton(configuration.ctaTitle, isDisabled: viewModel.isSubmitting) {
                Task { await submitPrimaryAction() }
            }
            .opacity(viewModel.isSubmitting ? 0 : 1)

            if viewModel.isSubmitting {
                LSSpinner()
                    .scaleEffect(0.72)
                    .frame(width: theme.iconSize.medium, height: theme.iconSize.medium)
                    .accessibilityIdentifier("authscreen-submit-spinner")
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityLabel(viewModel.isSubmitting ? "Submitting" : configuration.ctaTitle)
        .accessibilityIdentifier("authscreen-primary-cta")
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
            }
            onAuthenticated()
        } catch {
            viewModel.errorMessage = error.localizedDescription
            viewModel.mode = .invalidEmail
        }
    }

    private func submitPrimaryAction() async {
        await viewModel.submitEmailBranch()
        if viewModel.mode == .signedIn {
            onAuthenticated()
        }
    }
}

struct AuthScreenConfiguration: Equatable {
    let headline: String
    let subhead: String
    let ctaTitle: String
    let formAccessibilityLabel: String
    let passwordPlaceholder: String

    init(mode: AuthScreenMode) {
        switch mode {
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
        case .emailEntry, .invalidEmail, .submitting, .signedIn:
            headline = "Saddle up."
            subhead = "Sign in or create an account to start planning rides."
            ctaTitle = "Continue"
            formAccessibilityLabel = "Sign in or create account"
            passwordPlaceholder = "Enter your password"
        }
    }
}

private extension AuthScreenMode {
    var accessibilityValue: String {
        switch self {
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
        }
    }
}
