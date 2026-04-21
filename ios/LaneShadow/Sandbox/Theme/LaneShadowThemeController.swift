// native-sandbox: configured
import NativeSandbox
import SwiftUI

/// Theme controller for LaneShadow sandbox. Supports Auto/Light/Dark toggling
/// via the sandbox's Appearance section.
@MainActor
public final class LaneShadowThemeController: ObservableObject, ThemeController {
    public static let shared = LaneShadowThemeController()

    @Published private var mode: NativeSandbox.ThemeMode = .auto

    public var themeMode: NativeSandbox.ThemeMode {
        get { mode }
        set { mode = newValue }
    }

    private init() {}
}
