// native-sandbox: configured
package com.laneshadow.sandbox

import com.nativesandbox.theming.ThemeController
import com.nativesandbox.theming.ThemeMode

/**
 * Theme controller for LaneShadow sandbox. Supports Auto/Light/Dark toggling
 * via the sandbox's Appearance section.
 */
object LaneShadowThemeController : ThemeController {
    private var _mode: ThemeMode = ThemeMode.Auto

    override var themeMode: ThemeMode
        get() = _mode
        set(value) { _mode = value }
}
