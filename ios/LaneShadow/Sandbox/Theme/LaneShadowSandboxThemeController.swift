import Combine

// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Theme mode for LaneShadow theme (light/dark/auto).
/// This bridges NativeSandbox.ThemeMode to LaneShadow's theming system.
public enum LaneShadowThemeMode: Sendable, Equatable {
    case light
    case dark
    case auto
}

/// Theme controller for LaneShadow sandbox. Supports Auto/Light/Dark toggling
/// via the sandbox's Appearance section.
///
/// This controller bridges NativeSandbox's ThemeMode to LaneShadow's theming
/// system and is scoped ONLY to sandbox previews - never used in the main app.
@MainActor
public final class LaneShadowSandboxThemeController: ObservableObject, ThemeController {
    public static let shared = LaneShadowSandboxThemeController()

    /// Published theme mode that native-sandbox binds to.
    /// Changes to this property trigger SwiftUI re-renders.
    @Published public var themeMode: NativeSandbox.ThemeMode = .auto

    /// Derived LaneShadow theme mode for host consumption.
    /// Maps NativeSandbox.ThemeMode to LaneShadowThemeMode.
    public var hostThemeMode: LaneShadowThemeMode {
        switch themeMode {
        case .auto:
            .auto
        case .alwaysLight:
            .light
        case .alwaysDark:
            .dark
        }
    }

    /// Preferred color scheme for SwiftUI environment.
    /// Returns nil for auto (system), .light for alwaysLight, .dark for alwaysDark.
    public var preferredColorScheme: ColorScheme? {
        themeMode.preferredColorScheme
    }

    public init() {}
}
