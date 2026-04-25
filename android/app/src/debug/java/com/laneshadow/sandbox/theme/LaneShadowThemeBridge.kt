// native-sandbox: configured
package com.laneshadow.sandbox.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.laneshadow.theme.LocalLaneShadowTheme
import com.nativesandbox.theming.ThemeController
import com.nativesandbox.theming.ThemeMode

/**
 * Bridge from LaneShadowTheme to NativeSandbox's ThemeController.
 * Implements the sandbox's Appearance toggle (Auto/Light/Dark) by delegating
 * to the theme mode state.
 *
 * The themeMode is observable via Compose state, so changes trigger recomposition
 * of any composables reading it.
 */
object LaneShadowThemeBridge : ThemeController {
    private var _mode: ThemeMode by mutableStateOf(ThemeMode.Auto)

    override var themeMode: ThemeMode
        get() = _mode
        set(value) {
            _mode = value
        }

    /**
     * Determines whether the app should be in dark mode based on the current themeMode.
     *
     * - ThemeMode.Auto: Follows system dark mode setting
     * - ThemeMode.AlwaysLight: Always light mode
     * - ThemeMode.AlwaysDark: Always dark mode
     */
    @Composable
    fun isDarkMode(): Boolean {
        return when (_mode) {
            ThemeMode.AlwaysDark -> true
            ThemeMode.AlwaysLight -> false
            ThemeMode.Auto -> isSystemInDarkTheme()
        }
    }
}
