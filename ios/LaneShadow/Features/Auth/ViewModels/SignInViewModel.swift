import Foundation
import Observation

@MainActor
@Observable
final class SignInViewModel {
    var step: SignInStep = .email
    var email = ""
    var password = ""
    var errorMessage: String?
    var isSubmitting = false

    private let auth: ClerkAuth

    init(auth: ClerkAuth) {
        self.auth = auth
    }

    func advanceFromEmail() {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Enter an email address to continue."
            return
        }
        errorMessage = nil
        step = .password
    }

    func submit() async {
        guard !password.isEmpty else {
            errorMessage = "Enter your password."
            return
        }

        errorMessage = nil
        isSubmitting = true
        step = .submitting

        do {
            try await auth.signIn(email: email, password: password)
            step = .signedIn
        } catch {
            errorMessage = error.localizedDescription
            step = .password
        }

        isSubmitting = false
    }
}
