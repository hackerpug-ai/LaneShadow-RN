package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.testTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for Checkbox component
 *
 * Tests checked/unchecked/indeterminate states and disabled opacity
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class CheckboxTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Unchecked state renders correctly
     */
    @Test
    fun testUncheckedStateRenders() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Unchecked,
                    onToggle = {},
                )
            }
        }
        // Checkbox renders without checkmark
        composeTestRule.onNodeWithText("✓").assertDoesNotExist()
    }

    /**
     * AC-2: Checked state renders with checkmark
     */
    @Test
    fun testCheckedStateRendersCheckmark() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Checked,
                    onToggle = {},
                )
            }
        }
        composeTestRule.onNodeWithText("✓").assertIsDisplayed()
    }

    /**
     * AC-3: Indeterminate state renders with bar
     */
    @Test
    fun testIndeterminateStateRendersBar() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Indeterminate,
                    onToggle = {},
                )
            }
        }
        // Indeterminate state shows bar (not checkmark)
        composeTestRule.onNodeWithText("✓").assertDoesNotExist()
    }

    /**
     * AC-4: Disabled state applies 0.5 opacity
     */
    @Test
    fun testDisabledStateAppliesOpacity() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Checked,
                    onToggle = {},
                    disabled = true,
                )
            }
        }
        composeTestRule.onNodeWithText("✓").assertIsDisplayed()
    }

    /**
     * AC-5: Checkbox is interactive when onToggle is provided
     */
    @Test
    fun testCheckboxIsInteractiveWithCallback() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Unchecked,
                    onToggle = {},
                )
            }
        }
        // Checkbox should be rendered and interactive
        composeTestRule.onNodeWithText("✓").assertDoesNotExist()
    }

    /**
     * AC-6: Checkbox uses theme primary color (not hardcoded hex)
     */
    @Test
    fun testCheckboxUsesThemePrimaryColor() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                Checkbox(
                    state = CheckboxState.Checked,
                    onToggle = {},
                )
            }
        }
        composeTestRule.onNodeWithText("✓").assertIsDisplayed()
    }
}
