import Foundation

enum AuthScreenMode: Equatable, CaseIterable {
    case entry
    case emailEntry
    case existingUser
    case newUser
    case invalidEmail
    case submitting
    case signedIn
    case verificationRequired
}

enum AuthEmailResolution: Equatable {
    case existingUser
    case newUser
    case unresolved
}
