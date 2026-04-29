import Foundation

struct AuthPasswordVisibilityState {
    private(set) var isSecureEntry = true

    mutating func toggle() {
        isSecureEntry.toggle()
    }
}
