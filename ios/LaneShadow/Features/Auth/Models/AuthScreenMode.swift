import Foundation

enum AuthScreenMode: Equatable, CaseIterable {
    case emailEntry
    case existingUser
    case newUser
    case invalidEmail
    case submitting
    case signedIn
}

enum AuthEmailResolution: Equatable {
    case existingUser
    case newUser
    case unresolved
}
