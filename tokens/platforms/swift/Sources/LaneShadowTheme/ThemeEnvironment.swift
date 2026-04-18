import SwiftUI

private struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue: Theme = .shared
}

public extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}

public extension View {
    /// Inject `Theme.shared` into the SwiftUI environment for this view tree.
    func laneShadowTheme(_ theme: Theme = .shared) -> some View {
        environment(\.theme, theme)
    }
}
