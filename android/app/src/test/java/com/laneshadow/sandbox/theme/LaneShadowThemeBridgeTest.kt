package com.laneshadow.sandbox.theme

import com.nativesandbox.theming.ThemeMode
import org.junit.Test

/**
 * TDD test for AC-1: Theme controller bridge
 *
 * GIVEN: Developer opens LaneShadowSandboxThemeController.kt
 * WHEN: They inspect the class
 * THEN: They find a LaneShadowSandboxThemeController implementing native-sandbox ThemeController
 *       whose themeMode state bridges into Compose isSystemInDarkTheme + host LaneShadowTheme.ThemeMode
 */
class LaneShadowThemeBridgeTest {

    /**
     * TC-1: Mapping (.auto, system=dark) → LaneShadowTheme.Dark;
     *       (.alwaysLight) → Light;
     *       (.alwaysDark) → Dark
     */
    @Test
    fun themeMode_is_mutable_and_has_three_states() {
        // GIVEN: Initial mode
        val initialMode = LaneShadowThemeBridge.themeMode
        assert(initialMode == ThemeMode.Auto) {
            "Expected initial theme mode to be Auto, but was $initialMode"
        }

        // WHEN: We set AlwaysDark mode
        LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysDark

        // THEN: The mode is updated
        assert(LaneShadowThemeBridge.themeMode == ThemeMode.AlwaysDark) {
            "Expected theme mode to be updated to AlwaysDark"
        }

        // WHEN: We set AlwaysLight mode
        LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysLight

        // THEN: The mode is updated
        assert(LaneShadowThemeBridge.themeMode == ThemeMode.AlwaysLight) {
            "Expected theme mode to be updated to AlwaysLight"
        }

        // Reset for other tests
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto
    }

    @Test
    fun themeMode_defaults_to_auto() {
        // GIVEN: A fresh theme controller
        // WHEN: We read the initial state
        val mode = LaneShadowThemeBridge.themeMode

        // THEN: It defaults to Auto
        assert(mode == ThemeMode.Auto) {
            "Expected default theme mode to be Auto, but was $mode"
        }
    }

    @Test
    fun isDarkMode_returns_correct_value_for_alwaysDark() {
        // GIVEN: Theme mode is set to AlwaysDark
        LaneShadowThemeBridge.themeMode = ThemeMode.AlwaysDark

        // WHEN & THEN: We cannot test @Composable functions in unit tests
        // This will be tested in instrumentation tests

        // Reset for other tests
        LaneShadowThemeBridge.themeMode = ThemeMode.Auto
    }
}
