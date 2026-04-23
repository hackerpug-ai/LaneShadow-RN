import Foundation

public enum InputState: Hashable, Sendable {
    case `default`
    case focused
    case error
    case disabled
}

public extension InputState {
    static let defaultState: Self = .default
}
