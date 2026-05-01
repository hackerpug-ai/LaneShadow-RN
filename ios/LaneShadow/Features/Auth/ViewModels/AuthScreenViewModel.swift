import Foundation
import Observation

@MainActor
@Observable
final class AuthScreenViewModel {
    typealias EmailResolver = @MainActor (String) async -> AuthEmailResolution

    var mode: AuthScreenMode
    var email: String
    var password: String
    var displayName: String
    var errorMessage: String?
    var isSubmitting: Bool

    private let auth: ClerkAuth
    private let emailResolver: EmailResolver

    init(
        auth: ClerkAuth,
        mode: AuthScreenMode = .entry,
        email: String = "",
        password: String = "",
        displayName: String = "",
        errorMessage: String? = nil,
        isSubmitting: Bool = false,
        emailResolver: @escaping EmailResolver
    ) {
        self.auth = auth
        self.mode = mode
        self.email = email
        self.password = password
        self.displayName = displayName
        self.errorMessage = errorMessage
        self.isSubmitting = isSubmitting
        self.emailResolver = emailResolver
    }

    static func preview(
        mode: AuthScreenMode,
        auth: ClerkAuth,
        email: String = "elena@ridelaneshadow.com"
    ) -> AuthScreenViewModel {
        let isEmptyEmailMode = mode == .entry || mode == .emailEntry
        let isEmptyPasswordMode = mode == .entry || mode == .emailEntry || mode == .invalidEmail
        return AuthScreenViewModel(
            auth: auth,
            mode: mode,
            email: isEmptyEmailMode ? "" : email,
            password: isEmptyPasswordMode ? "" : "route-ready",
            displayName: mode == .newUser ? "Rider" : "",
            errorMessage: mode == .invalidEmail ? "Enter a valid email address." : nil,
            isSubmitting: mode == .submitting,
            emailResolver: neutralPreviewEmailResolver
        )
    }

    static func neutralPreviewEmailResolver(_: String) async -> AuthEmailResolution {
        .unresolved
    }

    func continueFromEmail() async {
        let normalized = normalizedEmail
        guard Self.isValidEmail(normalized) else {
            email = normalized
            errorMessage = "Enter a valid email address."
            mode = .invalidEmail
            return
        }

        errorMessage = nil
        email = normalized

        switch await emailResolver(normalized) {
        case .existingUser:
            mode = .existingUser
        case .newUser:
            mode = .newUser
        case .unresolved:
            mode = .emailEntry
        }
    }

    func editEmail() {
        errorMessage = nil
        password = ""
        displayName = ""
        mode = .emailEntry
    }

    func selectEmailEntry() {
        errorMessage = nil
        mode = .emailEntry
    }

    func backToEntry() {
        errorMessage = nil
        email = ""
        password = ""
        displayName = ""
        mode = .entry
    }

    func submitEmailBranch() async {
        switch mode {
        case .existingUser:
            await signInWithPassword()
        case .newUser:
            await createAccount()
        case .emailEntry, .invalidEmail:
            await continueFromEmail()
        case .entry, .submitting, .signedIn, .verificationRequired:
            break
        }
    }

    func signInWithApple() async throws {
        try await auth.signInWithApple()
        mode = .signedIn
    }

    func signInWithGoogle() async throws {
        try await auth.signInWithGoogle()
        mode = .signedIn
    }

    private func signInWithPassword() async {
        guard !password.isEmpty else {
            errorMessage = "Enter your password."
            return
        }

        await submit(from: .existingUser) {
            switch try await auth.signIn(email: normalizedEmail, password: password) {
            case .signedIn:
                .signedIn
            case .verificationRequired:
                .verificationRequired
            }
        }
    }

    private func createAccount() async {
        guard !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Enter your display name."
            return
        }
        guard !password.isEmpty else {
            errorMessage = "Create a password."
            return
        }

        await submit(from: .newUser) {
            let result = try await auth.signUp(
                email: normalizedEmail,
                password: password,
                name: displayName.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            switch result {
            case .signedIn:
                return .signedIn
            case .verificationRequired:
                return .verificationRequired
            }
        }
    }

    private func submit(
        from submitMode: AuthScreenMode,
        operation: () async throws -> AuthScreenMode
    ) async {
        errorMessage = nil
        isSubmitting = true
        mode = .submitting

        do {
            mode = try await operation()
        } catch {
            errorMessage = error.localizedDescription
            mode = submitMode
        }

        isSubmitting = false
    }

    private var normalizedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func isValidEmail(_ email: String) -> Bool {
        let parts = email.split(separator: "@")
        guard parts.count == 2, let domain = parts.last else { return false }
        return domain.range(of: ".") != nil && email.range(of: " ") == nil
    }
}
