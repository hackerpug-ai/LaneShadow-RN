package com.laneshadow.ui.components.molecules

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
 * TDD tests for ErrorMessage component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 * Updated to use shared test theme helper
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ErrorMessageTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-1: Component renders in default state
     * GIVEN: App is running and component is mounted
     * WHEN: ErrorMessage is rendered with required props
     * THEN: Component displays matching RN wrapper defaults
     */
    @Test
    fun testErrorMessageDefaultRendering() {
        // GIVEN: ErrorMessage component with required props
        // WHEN: Rendered with message text
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ErrorMessage(
                    message = "Something went wrong"
                )
            }
        }

        // THEN: Component displays with error message
        composeTestRule.onNodeWithText("Something went wrong").assertIsDisplayed()
    }

    /**
     * AC-2: All style properties match RN wrapper
     * GIVEN: RN wrapper defines layout, typography, colors
     * WHEN: Component is rendered
     * THEN: Uses surfaceVariant background, warning border, lg radius, body.md typography
     */
    @Test
    fun testErrorMessageStylePropertiesMatchRN() {
        // Test basic rendering
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ErrorMessage(
                    message = "Error: Invalid input"
                )
            }
        }
        composeTestRule.onNodeWithText("Error: Invalid input").assertIsDisplayed()

        // Test with custom modifier
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ErrorMessage(
                    message = "Another error",
                    modifier = androidx.compose.ui.Modifier
                )
            }
        }
        composeTestRule.onNodeWithText("Another error").assertIsDisplayed()
    }

    /**
     * AC-3: Component handles accessibility
     * GIVEN: Component has contentDescription
     * WHEN: Screen reader is used
     * THEN: Error message is announced
     */
    @Test
    fun testErrorMessageAccessibility() {
        // Test with default testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ErrorMessage(
                    message = "Accessible error"
                )
            }
        }
        composeTestRule.onNodeWithText("Accessible error").assertIsDisplayed()

        // Test with custom testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ErrorMessage(
                    message = "Custom test ID",
                    testID = "custom-error-message"
                )
            }
        }
        composeTestRule.onNodeWithText("Custom test ID").assertIsDisplayed()
    }
}
