import Foundation
import Observation

@MainActor
@Observable
final class SignUpViewModel {
    var name = ""
    var email = ""
    var password = ""
    var confirmPassword = ""
    var errorMessage: String?
    var isSubmitting = false
    var isSignedIn = false

    private let auth: ClerkAuth

    init(auth: ClerkAuth) {
        self.auth = auth
    }

    func submit() async {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Enter your name."
            return
        }
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Enter an email address."
            return
        }
        guard !password.isEmpty else {
            errorMessage = "Enter a password."
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match."
            return
        }

        isSubmitting = true
        errorMessage = nil

        do {
            try await auth.signUp(email: email, password: password, name: name)
            isSignedIn = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isSubmitting = false
    }
}
