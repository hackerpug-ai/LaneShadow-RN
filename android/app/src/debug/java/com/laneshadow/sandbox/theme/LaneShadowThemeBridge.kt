// native-sandbox: configured
package com.laneshadow.sandbox.theme

import com.laneshadow.theme.LocalLaneShadowTheme
import com.nativesandbox.theming.ThemeController
import com.nativesandbox.theming.ThemeMode

/**
 * Bridge from LaneShadowTheme to NativeSandbox's ThemeController.
 * Implements the sandbox's Appearance toggle (Auto/Light/Dark) by delegating
 * to the theme mode state.
 */
object LaneShadowThemeBridge : ThemeController {
    private var _mode: ThemeMode = ThemeMode.Auto

    override var themeMode: ThemeMode
        get() = _mode
        set(value) {
            _mode = value
        }
}
