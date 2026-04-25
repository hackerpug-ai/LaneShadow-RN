package com.laneshadow.sandbox.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.LaneShadowTheme
import com.nativesandbox.theming.ThemeMode
import org.junit.Rule
import org.junit.Test

/**
 * TDD test for AC-2: Live theme toggle
 *
 * GIVEN: Developer launches `/native-sandbox --platform android` and opens any story
 * WHEN: They tap the light/dark/auto toggle in the sandbox top bar
 * THEN: Every visible story re-renders with the corresponding theme variant within one frame, no relaunch
 *
 * TC-2: Toggling theme state recomposes a probe story's colorScheme
 */
class LaneShadowThemeToggleTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun toggling_themeMode_renders_correct_colors() {
        // GIVEN: Theme controller in Auto mode (light in test environment)
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto

        var backgroundColor: Color? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                backgroundColor = theme.colors.background.default
            }
        }

        // WHEN: We toggle to AlwaysDark
        composeTestRule.runOnUiThread {
            LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysDark
        }

        // THEN: The background color changes to dark
        composeTestRule.waitUntil(timeoutMillis = 1000) {
            backgroundColor != null
        }

        val lightColor = backgroundColor

        // Wait for recomposition
        composeTestRule.waitUntil(timeoutMillis = 1000) {
            val currentTheme = composeTestRule.onRoot().fetchSemanticsNode()
            // Trigger recomposition by reading again
            composeTestRule.setContent {
                LaneShadowTheme {
                    val theme = LocalLaneShadowTheme.current
                    backgroundColor = theme.colors.background.default
                }
            }
            backgroundColor != lightColor
        }

        // Reset for other tests
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto
    }

    @Test
    fun themeMode_alwaysLight_renders_light_colors() {
        // GIVEN: Theme controller in AlwaysLight mode
        LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysLight

        var backgroundColor: Color? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                backgroundColor = theme.colors.background.default
            }
        }

        // THEN: Background is light colored (high luminance)
        composeTestRule.waitUntil(timeoutMillis = 1000) {
            backgroundColor != null
        }

        assert(backgroundColor != null) { "Background color should be set" }
        // Light mode background should be bright (high RGB values)
        val luminance = (0.299 * backgroundColor!!.red + 0.587 * backgroundColor!!.green + 0.114 * backgroundColor!!.blue)
        assert(luminance > 0.5f) {
            "Light mode should have high luminance background, but got $luminance"
        }

        // Reset for other tests
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto
    }

    @Test
    fun themeMode_alwaysDark_renders_dark_colors() {
        // GIVEN: Theme controller in AlwaysDark mode
        LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysDark

        var backgroundColor: Color? = null

        composeTestRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                backgroundColor = theme.colors.background.default
            }
        }

        // THEN: Background is dark colored (low luminance)
        composeTestRule.waitUntil(timeoutMillis = 1000) {
            backgroundColor != null
        }

        assert(backgroundColor != null) { "Background color should be set" }
        // Dark mode background should be dim (low RGB values)
        val luminance = (0.299 * backgroundColor!!.red + 0.587 * backgroundColor!!.green + 0.114 * backgroundColor!!.blue)
        assert(luminance < 0.5f) {
            "Dark mode should have low luminance background, but got $luminance"
        }

        // Reset for other tests
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto
    }
}
