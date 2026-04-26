// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

// Preview wrapper extensions and helpers for sandbox story theming.
// This file provides utilities for applying LaneShadowTheme to sandbox previews
// and supports the theme control features in the sandbox UI.

/// Preview wrapper that applies LaneShadowTheme with sandbox theme controller integration.
/// Used by native-sandbox to wrap story previews with the host theme.
@MainActor
public let laneShadowPreviewWrapper: PreviewWrapper = { view in
    AnyView(
        view
            .laneShadowTheme()
            .environment(\.colorScheme, LaneShadowSandboxThemeController.shared.preferredColorScheme ?? .light)
            .onReceive(LaneShadowSandboxThemeController.shared.$themeMode) { _ in
                // Trigger re-render when theme mode changes
            }
    )
}

// MARK: - Preview Helpers

extension View {
    /// Applies LaneShadow theme to a view for sandbox preview.
    /// This is a convenience wrapper around `.laneShadowTheme()` from the theme package.
    func withSandboxTheme() -> some View {
        laneShadowTheme()
    }
}
